import { useEffect } from 'react';
import { queryClient } from '@/lib/queryClient';

export function useCacheInvalidation() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'INVALIDATE_CACHE') {
        console.log('[Cache] 🔄 Received cache invalidation from Service Worker');
        
        const notificationType = event.data.payload?.notificationType || 'message';
        
        queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
        queryClient.invalidateQueries({ queryKey: ['/api/messages/inbox'] });
        queryClient.invalidateQueries({ queryKey: ['/api/messages/unread/count'] });
        queryClient.invalidateQueries({ queryKey: ['/api/messages/unread/by-department'] });
        queryClient.invalidateQueries({ queryKey: ['/api/counters'] });
        
        if (notificationType === 'announcement') {
          queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
        }
        
        if (notificationType === 'assignment') {
          queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
        }
        
        console.log('[Cache] ✅ Cache invalidated for type:', notificationType);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);
}
