import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

/**
 * Hook to manage App Icon Badge (red circle with unread count)
 * Works on PWA and native mobile apps
 */
export function useAppBadge() {
  // Check if user is authenticated
  const { data: user } = useQuery({
    queryKey: ['/api/auth/me'],
  });

  // Only fetch unread counts if user is authenticated
  const { data: unreadCounts = {} } = useQuery<Record<number, number>>({
    queryKey: ['/api/messages/unread/by-department'],
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: !!user, // Only run when authenticated
  });

  // Get counters for announcements and assignments
  const { data: counters } = useQuery<{ unreadAnnouncements: number; uncompletedAssignments: number }>({
    queryKey: ['/api/counters'],
    refetchInterval: 30000, // Refresh every 30 seconds
    enabled: !!user, // Only run when authenticated
  });

  useEffect(() => {
    // Clear badge if user logs out
    if (!user) {
      if ('clearAppBadge' in navigator) {
        navigator.clearAppBadge().catch(err => {
          console.error('Failed to clear app badge on logout:', err);
        });
      }
      return;
    }

    // Check if Badging API is supported
    if (!('setAppBadge' in navigator)) {
      return;
    }

    // Calculate total unread count
    let totalUnread = 0;

    // Sum all unread messages across all departments
    if (unreadCounts) {
      totalUnread += Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
    }

    // Add unread announcements and uncompleted assignments
    if (counters) {
      totalUnread += counters.unreadAnnouncements || 0;
      totalUnread += counters.uncompletedAssignments || 0;
    }

    // Update app badge
    if (totalUnread > 0) {
      navigator.setAppBadge(totalUnread).catch(err => {
        console.error('Failed to set app badge:', err);
      });
    } else {
      navigator.clearAppBadge().catch(err => {
        console.error('Failed to clear app badge:', err);
      });
    }
  }, [user, unreadCounts, counters]);
}
