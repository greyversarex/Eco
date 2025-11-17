/**
 * API Configuration for EcoDoc
 * 
 * Supports both web and mobile (Capacitor) environments:
 * - Web: Uses relative URLs (same origin)
 * - Mobile: Uses full production URL from VITE_API_URL
 */

const isCapacitor = () => {
  return !!(window as any).Capacitor;
};

/**
 * Get the base API URL based on environment
 */
export function getApiBaseUrl(): string {
  if (isCapacitor()) {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
      console.error('VITE_API_URL not configured for mobile app!');
      return '';
    }
    return apiUrl;
  }
  return '';
}

/**
 * Build full API URL for both web and mobile
 */
export function buildApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  
  if (!path.startsWith('/')) {
    path = '/' + path;
  }
  
  return baseUrl + path;
}

/**
 * Wrapper around fetch that automatically handles API URLs
 */
export function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const fullUrl = buildApiUrl(path);
  return fetch(fullUrl, {
    credentials: 'include',
    ...options,
  });
}
