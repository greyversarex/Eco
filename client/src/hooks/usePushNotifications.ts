import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

// Convert base64 VAPID key to Uint8Array
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
  
  // Check if user is authenticated
  const { data: user, isSuccess: isAuthReady } = useQuery({
    queryKey: ['/api/auth/me'],
  });

  useEffect(() => {
    // Wait until auth query has completed
    if (!isAuthReady) return;
    
    // If user logged out, clean up subscription
    if (!user && currentSubscription.current) {
      unsubscribeFromPush().catch(err => 
        console.error('Failed to unsubscribe on logout:', err)
      );
      return;
    }
    
    // Wait until user is authenticated
    if (!user) return;
    
    // Only run once per session
    if (isSubscribed.current) return;
    
    const setupPushNotifications = async () => {
      try {
        // Check if browser supports notifications and service workers
        if (!('Notification' in window) || !('serviceWorker' in navigator)) {
          console.log('Push notifications not supported');
          return;
        }

        // Check if VAPID key is configured
        if (!VAPID_PUBLIC_KEY) {
          console.warn('VAPID public key not configured');
          return;
        }

        // Wait for service worker to be ready
        const registration = await navigator.serviceWorker.ready;

        // Check current permission
        let permission = Notification.permission;

        // If permission is default (not asked yet), request it
        if (permission === 'default') {
          // Wait a bit before asking (don't ask immediately on page load)
          await new Promise(resolve => setTimeout(resolve, 3000));
          permission = await Notification.requestPermission();
        }

        // If permission denied, nothing we can do
        if (permission === 'denied') {
          console.log('Notification permission denied');
          return;
        }

        // If permission granted, subscribe to push
        if (permission === 'granted') {
          try {
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
  
  // Helper function to unsubscribe
  async function unsubscribeFromPush() {
    try {
      if (!currentSubscription.current) return;

      const endpoint = currentSubscription.current.endpoint;
      
      // Unsubscribe from browser
      await currentSubscription.current.unsubscribe();
      
      // Notify server
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
