import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const isSubscribed = useRef(false);
  const currentSubscription = useRef<PushSubscription | null>(null);
  const permissionRequested = useRef(false);
  
  const { data: user, isSuccess: isAuthReady } = useQuery({
    queryKey: ['/api/auth/me'],
  });

  useEffect(() => {
    if (!isAuthReady) return;
    
    if (!user && currentSubscription.current) {
      unsubscribeFromPush().catch(err => 
        console.error('Failed to unsubscribe on logout:', err)
      );
      return;
    }
    
    if (!user) return;
    if (isSubscribed.current) return;
    
    const setupPushNotifications = async () => {
      try {
        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
          console.log('Push notifications not supported');
          return;
        }

        if (!VAPID_PUBLIC_KEY) {
          console.warn('VAPID public key not configured');
          return;
        }

        const registration = await navigator.serviceWorker.ready;
        let permission = Notification.permission;

        if (permission === 'default' && !permissionRequested.current) {
          permissionRequested.current = true;
          try {
            permission = await Notification.requestPermission();
          } catch (e) {
            console.log('Notification permission request failed:', e);
          }
        }

        if (permission === 'denied') {
          console.log('Notifications denied by user');
          return;
        }

        if (permission === 'granted') {
          try {
            let subscription = await registration.pushManager.getSubscription();

            if (!subscription) {
              subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
              });
            }

            if (subscription) {
              const p256dhKey = subscription.getKey('p256dh');
              const authKey = subscription.getKey('auth');
              
              if (p256dhKey && authKey) {
                const response = await fetch('/api/push/subscribe', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  credentials: 'include',
                  body: JSON.stringify({
                    endpoint: subscription.endpoint,
                    keys: {
                      p256dh: btoa(
                        String.fromCharCode(...Array.from(new Uint8Array(p256dhKey)))
                      ),
                      auth: btoa(
                        String.fromCharCode(...Array.from(new Uint8Array(authKey)))
                      ),
                    },
                  }),
                });

                if (response.ok) {
                  console.log('Push notification subscription successful');
                  isSubscribed.current = true;
                  currentSubscription.current = subscription;
                } else {
                  console.error('Failed to subscribe to push notifications:', await response.text());
                }
              }
            }
          } catch (subscriptionError) {
            console.error('Failed to subscribe to push notifications:', subscriptionError);
          }
        }
      } catch (error) {
        console.error('Error setting up push notifications:', error);
      }
    };

    setupPushNotifications();
  }, [user, isAuthReady]);
  
  async function unsubscribeFromPush() {
    try {
      if (!currentSubscription.current) return;

      const endpoint = currentSubscription.current.endpoint;
      
      await currentSubscription.current.unsubscribe();
      
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ endpoint }),
      });

      console.log('Push notification unsubscription successful');
      isSubscribed.current = false;
      currentSubscription.current = null;
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
    }
  }

  return null;
}
