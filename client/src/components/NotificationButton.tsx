import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface NotificationButtonProps {
  variant?: 'mobile' | 'desktop';
}

export default function NotificationButton({ variant = 'desktop' }: NotificationButtonProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Check current permission status
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const handleSubscribe = async () => {
    try {
      setIsSubscribing(true);

      // Check if browser supports notifications and service workers
      if (!('Notification' in window) || !('serviceWorker' in navigator)) {
        alert('Ваш браузер не поддерживает уведомления');
        return;
      }

      // Check if VAPID key is configured
      if (!VAPID_PUBLIC_KEY) {
        console.warn('VAPID public key not configured');
        alert('Уведомления не настроены на сервере');
        return;
      }

      // Request permission (User Gesture required)
      const newPermission = await Notification.requestPermission();
      setPermission(newPermission);

      if (newPermission === 'denied') {
        alert('Вы запретили уведомления. Измените настройки браузера для включения.');
        return;
      }

      if (newPermission === 'granted') {
        // Wait for service worker to be ready
        const registration = await navigator.serviceWorker.ready;

        // Get existing subscription
        let subscription = await registration.pushManager.getSubscription();

        // If no subscription exists, create one
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          });
        }

        // Send subscription to server
        const p256dhKey = subscription.getKey('p256dh');
        const authKey = subscription.getKey('auth');
        
        const subscriptionData = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...Array.from(new Uint8Array(p256dhKey!)))),
            auth: btoa(String.fromCharCode(...Array.from(new Uint8Array(authKey!)))),
          },
        };

        await apiRequest('POST', '/api/push/subscribe', subscriptionData);

        alert('Уведомления успешно включены!');
      }
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      alert('Не удалось включить уведомления. Попробуйте позже.');
    } finally {
      setIsSubscribing(false);
    }
  };

  // Don't show button if notifications are already granted
  if (permission === 'granted') {
    return null;
  }

  if (variant === 'mobile') {
    return (
      <Button
        className="justify-start gap-2.5 h-12 text-sm font-medium bg-orange-500 hover:bg-orange-600 shadow-md"
        onClick={handleSubscribe}
        disabled={isSubscribing}
        data-testid="mobile-nav-notifications"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
          {permission === 'denied' ? (
            <BellOff className="h-4 w-4 text-white" />
          ) : (
            <Bell className="h-4 w-4 text-white" />
          )}
        </div>
        <span>{isSubscribing ? 'Загрузка...' : 'Включить уведомления'}</span>
      </Button>
    );
  }

  return (
    <Button
      size="icon"
      onClick={handleSubscribe}
      disabled={isSubscribing}
      data-testid="button-enable-notifications"
      className="bg-orange-500 text-white hover:bg-orange-600 h-11 w-11 rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
      title={permission === 'denied' ? 'Уведомления запрещены' : 'Включить уведомления'}
    >
      {permission === 'denied' ? (
        <BellOff className="h-5 w-5" />
      ) : (
        <Bell className="h-5 w-5" />
      )}
    </Button>
  );
}
