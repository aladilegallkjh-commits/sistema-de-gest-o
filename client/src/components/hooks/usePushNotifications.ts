import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  
  const subscribeMutation = trpc.push.subscribe.useMutation();
  const getVapidKey = trpc.push.getVapidPublicKey.useQuery(undefined, {
    enabled: typeof window !== 'undefined' && 'serviceWorker' in navigator && permission === 'default',
  });

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribeUser = async () => {
    if (!('serviceWorker' in navigator)) return;
    if (!getVapidKey.data) return;

    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      
      if (permissionResult !== 'granted') return;

      const registration = await navigator.serviceWorker.ready;
      
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(getVapidKey.data),
        });
      }
      
      const subJson = subscription.toJSON();
      
      await subscribeMutation.mutateAsync({
        endpoint: subscription.endpoint,
        p256dh: subJson.keys?.p256dh || '',
        auth: subJson.keys?.auth || '',
      });
      
    } catch (error) {
      console.error('Failed to subscribe to push notifications', error);
      toast.error('Erro ao ativar notificações. Tente novamente.');
    }
  };

  useEffect(() => {
    // Se o usuário ainda não decidiu, podemos sugerir ou pedir automaticamente
    // Porém a boa prática é pedir após um clique. 
    // Para simplificar, se ele aceitou e temos VAPID, tentamos garantir a inscrição.
    if (permission === 'granted' && getVapidKey.data && !subscribeMutation.isPending && !subscribeMutation.isSuccess) {
      subscribeUser();
    }
  }, [permission, getVapidKey.data]);

  return {
    permission,
    subscribeUser,
  };
}
