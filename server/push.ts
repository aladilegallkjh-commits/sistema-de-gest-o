import webpush from 'web-push';
import { getDb } from './db';
import { eq } from 'drizzle-orm';
import { pushSubscriptions, users, appNotifications } from '../drizzle/schema';

// Setup VAPID keys
webpush.setVapidDetails(
  'mailto:suporte@sistemagestao.com',
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

/**
 * Save a DB notification for a user and optionally send a push notification.
 */
async function saveAndPushForUser(userId: number, title: string, body: string, url?: string, sendPush = true) {
  const db = await getDb();
  if (!db) return;

  const moduleMatch = url?.match(/module=([^&]+)/);
  const moduleId = moduleMatch ? moduleMatch[1] : 'dashboard';

  // Always save to the in-app notifications bell
  try {
    await db.insert(appNotifications).values({
      userId,
      title,
      message: body,
      moduleId,
      isRead: false
    });
  } catch (e) {
    console.error('[push] Error saving appNotification:', e);
  }

  // Optionally send push notification (device/browser)
  if (!sendPush) return;
  if (!process.env.VAPID_PUBLIC_KEY) return;

  try {
    const subscriptions = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
    if (subscriptions.length === 0) return;

    const payload = JSON.stringify({ title, body, url: url || '/' });

    await Promise.all(subscriptions.map(async (sub: typeof pushSubscriptions.$inferSelect) => {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };
      try {
        await webpush.sendNotification(pushSub, payload);
      } catch (err: any) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
        } else {
          console.error('[push] Error sending push notification:', err);
        }
      }
    }));
  } catch (err) {
    console.error('[push] Error sending push for user', userId, err);
  }
}

export async function sendNotificationToUser(userId: number, title: string, body: string, url?: string) {
  await saveAndPushForUser(userId, title, body, url, true);
}

export async function sendNotificationToMultipleUsers(userIds: number[], title: string, body: string, url?: string) {
  if (!userIds.length) return;
  const uniqueIds = Array.from(new Set(userIds));
  await Promise.all(uniqueIds.map((id: number) => sendNotificationToUser(id, title, body, url)));
}

/**
 * Notify ALL users with a DB bell notification.
 * Push notifications go only to "others" (not the actor), since the actor is already in the app.
 */
export async function notifyOthers(currentUserId: number, title: string, body: string, url?: string) {
  try {
    const db = await getDb();
    if (!db) return;
    const allUsers = await db.select({ id: users.id }).from(users);
    const allUserIds = allUsers.map((u: { id: number }) => u.id);

    await Promise.all(allUserIds.map((id: number) =>
      // Save DB notification for everyone (including actor)
      // Only send push to others (actor is already using the app)
      saveAndPushForUser(id, title, body, url, id !== currentUserId)
    ));
  } catch (err) {
    console.error('[push] Error in notifyOthers:', err);
  }
}
