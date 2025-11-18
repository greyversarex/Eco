import { useState, useEffect } from 'react';
import { offlineDB } from '@/lib/offline-db';

/**
 * Hook to track online/offline status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * Hook to initialize IndexedDB on app start
 */
export function useOfflineDB() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    offlineDB
      .init()
      .then(() => {
        setIsReady(true);
        // Cleanup old cache (older than 7 days)
        return offlineDB.cleanupOldCache();
      })
      .catch((err) => {
        console.error('Failed to initialize offline DB:', err);
        setError(err);
      });
  }, []);

  return { isReady, error };
}
