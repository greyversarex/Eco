// EcoDoc Service Worker with Background Sync support
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// Precache all static assets
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Cache Google Fonts (CacheFirst strategy)
registerRoute(
  /^https:\/\/fonts\.googleapis\.com\/.*/i,
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

registerRoute(
  /^https:\/\/fonts\.gstatic\.com\/.*/i,
  new CacheFirst({
    cacheName: 'gstatic-fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Cache API requests (NetworkFirst strategy)
registerRoute(
  /\/api\/.*/i,
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 10,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 5, // 5 minutes
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Background Sync for draft messages
const SYNC_TAG = 'sync-drafts';

// Register sync event handler
self.addEventListener('sync', async (event) => {
  console.log('[SW] 🔄 Background Sync event triggered:', event.tag);

  if (event.tag === SYNC_TAG) {
    event.waitUntil(syncDrafts());
  }
});

// Sync drafts function
async function syncDrafts() {
  try {
    console.log('[SW] 📤 Starting draft synchronization...');

    // Open IndexedDB
    const db = await openIndexedDB();
    const drafts = await getPendingDrafts(db);

    if (drafts.length === 0) {
      console.log('[SW] ✅ No pending drafts to sync');
      return;
    }

    console.log(`[SW] 📋 Found ${drafts.length} draft(s) to sync`);

    // Try to sync each draft
    let successCount = 0;
    let failCount = 0;

    for (const draft of drafts) {
      try {
        await sendDraft(draft);
        await deleteDraft(db, draft.id);
        successCount++;
        console.log(`[SW] ✅ Draft ${draft.id} sent successfully`);
      } catch (error) {
        failCount++;
        console.error(`[SW] ❌ Failed to send draft ${draft.id}:`, error);
      }
    }

    console.log(`[SW] 📊 Sync complete: ${successCount} success, ${failCount} failed`);

    // Show notification if supported
    if (successCount > 0 && self.registration.showNotification) {
      await self.registration.showNotification('EcoDoc', {
        body: `${successCount} сообщений отправлено`,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'draft-sync',
      });
    }
  } catch (error) {
    console.error('[SW] ❌ Background sync failed:', error);
    throw error; // Rethrow to retry sync later
  }
}

// Open IndexedDB
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('EcoDocOfflineDB', 1);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Get pending drafts from IndexedDB
async function getPendingDrafts(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['drafts'], 'readonly');
    const store = transaction.objectStore('drafts');
    const request = store.getAll();

    request.onsuccess = () => {
      const drafts = request.result.filter(
        (draft) => draft.status === 'pending' || draft.status === 'syncing'
      );
      resolve(drafts);
    };

    request.onerror = () => reject(request.error);
  });
}

// Delete draft from IndexedDB
async function deleteDraft(db, draftId) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['drafts'], 'readwrite');
    const store = transaction.objectStore('drafts');
    const request = store.delete(draftId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Send draft via API
async function sendDraft(draft) {
  const formData = new FormData();
  formData.append('subject', draft.subject);
  formData.append('content', draft.content);
  formData.append('recipientIds', JSON.stringify(draft.recipientIds));

  if (draft.documentNumber) {
    formData.append('documentNumber', draft.documentNumber);
  }

  // Convert attachments back to Files
  if (draft.attachments && draft.attachments.length > 0) {
    for (const attachment of draft.attachments) {
      const blob = new Blob([attachment.data], { type: attachment.type });
      const file = new File([blob], attachment.name, { type: attachment.type });
      formData.append('attachments', file);
    }
  }

  const response = await fetch('/api/messages', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.json();
}

// Listen for skipWaiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] ✅ Service Worker loaded with Background Sync support');
