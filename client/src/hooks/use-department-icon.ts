import { useState, useEffect } from 'react';

/**
 * Fetches department icon with authentication
 * Returns object URL for the icon blob
 */
export function useDepartmentIcon(departmentId: number, iconVersion?: number) {
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let objectUrl: string | null = null;
    let isCancelled = false;

    async function fetchIcon() {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/departments/${departmentId}/icon?v=${iconVersion || 0}`,
          {
            credentials: 'include', // Important: sends auth cookies
          }
        );

        if (!response.ok) {
          // Icon not found or not authenticated
          if (!isCancelled) {
            setIconUrl(null);
            setIsLoading(false);
          }
          return;
        }

        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        
        if (!isCancelled) {
          setIconUrl(objectUrl);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch department icon:', error);
        if (!isCancelled) {
          setIconUrl(null);
          setIsLoading(false);
        }
      }
    }

    fetchIcon();

    // Cleanup: revoke object URL to prevent memory leaks
    return () => {
      isCancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [departmentId, iconVersion]);

  return { iconUrl, isLoading };
}
