import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { buildApiUrl } from "./api-config";
import { offlineDB, type CachedMessage } from "./offline-db";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Helper to cache messages automatically when fetched
async function cacheMessagesIfNeeded(url: string, data: any) {
  // Only cache inbox messages (skip sent, trash, etc.)
  if (url.includes('/api/messages/inbox')) {
    try {
      if (Array.isArray(data)) {
        const messagesToCache: CachedMessage[] = data.map((msg: any) => ({
          id: msg.id,
          subject: msg.subject,
          content: msg.content,
          senderId: msg.senderId,
          senderName: msg.senderName || '',
          recipientIds: msg.recipientIds || [],
          recipientNames: msg.recipientNames,
          documentNumber: msg.documentNumber,
          createdAt: msg.createdAt,
          readAt: msg.readAt,
          forwardedFromId: msg.forwardedFromId,
          forwardedFromSubject: msg.forwardedFromSubject,
          attachments: msg.attachments?.length || 0,
          cachedAt: Date.now(),
        }));
        
        await offlineDB.cacheMessages(messagesToCache);
      }
    } catch (error) {
      console.warn('Failed to cache messages:', error);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  const fullUrl = buildApiUrl(url);
  const res = await fetch(fullUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const fullUrl = buildApiUrl(queryKey.join("/") as string);
    
    // Try to fetch from network first
    try {
      const res = await fetch(fullUrl, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      const data = await res.json();
      
      // Auto-cache messages when fetched
      await cacheMessagesIfNeeded(fullUrl, data);
      
      return data;
    } catch (error) {
      // If offline and fetching inbox messages, try to return cached data
      if (!navigator.onLine && fullUrl.includes('/api/messages/inbox')) {
        try {
          const cachedMessages = await offlineDB.getMessages();
          console.log('📱 Офлайн режим: Загружены кешированные сообщения', cachedMessages.length);
          return cachedMessages;
        } catch (cacheError) {
          console.error('Failed to retrieve cached messages:', cacheError);
        }
      }
      
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
