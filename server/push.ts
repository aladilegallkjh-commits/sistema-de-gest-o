import webpush from 'web-push';
import { db } from './db';
import { eq, inArray } from 'drizzle-orm';
import { pushSubscriptions } from '../drizzle/schema';

// Setup VAPID keys
// It's important to provide a mailto so push services can contact you if there's an issue
webpush.setVapidDetails(
  'mailto:suporte@sistemagestao.com',
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

export async function sendNotificationToUser(userId: number, title: string, body: string, url?: string) {
  if (!process.env.VAPID_PUBLIC_KEY) return; // Skip if push is not configured

  try {
    const subscriptions = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
    if (subscriptions.length === 0) return;
    
    const payload = JSON.stringify({
      title,
      body,
      url: url || '/',
    });

    const promises = subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, payload);
      } catch (err: any) {
        // Se a assinatura expirou ou o usuário revogou (404/410), deletamos do banco
        if (err.statusCode === 404 || err.statusCode === 410) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
        } else {
          console.error('Erro ao enviar push notification:', err);
        }
      }
    });

    await Promise.all(promises);
  } catch (error) {
    console.error(`Erro ao processar pushes para o usuário ${userId}`, error);
  }
}

export async function sendNotificationToMultipleUsers(userIds: number[], title: string, body: string, url?: string) {
  if (!userIds.length) return;
  // Remove duplicate IDs
  const uniqueIds = Array.from(new Set(userIds));
  await Promise.all(uniqueIds.map(id => sendNotificationToUser(id, title, body, url)));
}

export async function notifyOthers(currentUserId: number, title: string, body: string, url?: string) {
  try {
    const { users } = await import('../drizzle/schema');
    const allUsers = await db.select({ id: users.id }).from(users);
    const otherUserIds = allUsers.map(u => u.id).filter(id => id !== currentUserId);
    if (otherUserIds.length > 0) {
      sendNotificationToMultipleUsers(otherUserIds, title, body, url).catch(console.error);
    }
  } catch (err) {
    console.error('Error notifying others', err);
  }
}
