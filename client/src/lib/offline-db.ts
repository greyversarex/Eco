/**
 * IndexedDB utility for offline data storage
 * Stores messages, assignments, announcements, and attachments
 */

const DB_NAME = 'ecodoc-offline';
const DB_VERSION = 1;

export interface CachedMessage {
  id: number;
  subject: string;
  content: string;
  senderId: number;
  senderName: string;
  recipientIds: number[];
  recipientNames?: string[];
  documentNumber?: string;
  createdAt: string;
  readAt?: string;
  forwardedFromId?: number;
  forwardedFromSubject?: string;
  attachments?: number;
  cachedAt: number;
}

export interface CachedAssignment {
  id: number;
  title: string;
  content: string;
  topic?: string;
  deadline?: string;
  creatorId: number;
  creatorName?: string;
  executorIds: number[];
  recipientIds: number[];
  status: string;
  completedAt?: string;
  createdAt: string;
  attachments?: number;
  cachedAt: number;
}

export interface CachedAnnouncement {
  id: number;
  title: string;
  content: string;
  creatorId: number;
  creatorName?: string;
  recipientIds: number[] | null;
  createdAt: string;
  attachments?: number;
  cachedAt: number;
}

export interface DraftMessage {
  id: string;
  subject: string;
  content: string;
  recipientIds: number[];
  documentNumber?: string;
  attachments?: File[];
  createdAt: number;
  syncStatus: 'pending' | 'syncing' | 'failed' | 'synced';
  errorMessage?: string;
}

export interface CachedAttachment {
  id: number;
  messageId?: number;
  assignmentId?: number;
  announcementId?: number;
  filename: string;
  mimeType: string;
  size: number;
  data: Blob;
  cachedAt: number;
}

class OfflineDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Messages store
        if (!db.objectStoreNames.contains('messages')) {
          const messagesStore = db.createObjectStore('messages', { keyPath: 'id' });
          messagesStore.createIndex('cachedAt', 'cachedAt', { unique: false });
          messagesStore.createIndex('senderId', 'senderId', { unique: false });
        }

        // Assignments store
        if (!db.objectStoreNames.contains('assignments')) {
          const assignmentsStore = db.createObjectStore('assignments', { keyPath: 'id' });
          assignmentsStore.createIndex('cachedAt', 'cachedAt', { unique: false });
          assignmentsStore.createIndex('status', 'status', { unique: false });
        }

        // Announcements store
        if (!db.objectStoreNames.contains('announcements')) {
          const announcementsStore = db.createObjectStore('announcements', { keyPath: 'id' });
          announcementsStore.createIndex('cachedAt', 'cachedAt', { unique: false });
        }

        // Drafts store
        if (!db.objectStoreNames.contains('drafts')) {
          const draftsStore = db.createObjectStore('drafts', { keyPath: 'id' });
          draftsStore.createIndex('createdAt', 'createdAt', { unique: false });
          draftsStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        }

        // Attachments store
        if (!db.objectStoreNames.contains('attachments')) {
          const attachmentsStore = db.createObjectStore('attachments', { keyPath: 'id' });
          attachmentsStore.createIndex('messageId', 'messageId', { unique: false });
          attachmentsStore.createIndex('assignmentId', 'assignmentId', { unique: false });
          attachmentsStore.createIndex('announcementId', 'announcementId', { unique: false });
          attachmentsStore.createIndex('cachedAt', 'cachedAt', { unique: false });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Failed to initialize IndexedDB');
    }
    return this.db;
  }

  // Messages operations
  async cacheMessages(messages: CachedMessage[]): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['messages'], 'readwrite');
    const store = transaction.objectStore('messages');

    const now = Date.now();
    for (const message of messages) {
      await store.put({ ...message, cachedAt: now });
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getMessages(limit = 100): Promise<CachedMessage[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['messages'], 'readonly');
    const store = transaction.objectStore('messages');
    const index = store.index('cachedAt');

    return new Promise((resolve, reject) => {
      const request = index.openCursor(null, 'prev');
      const results: CachedMessage[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async getMessage(id: number): Promise<CachedMessage | null> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['messages'], 'readonly');
    const store = transaction.objectStore('messages');

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Drafts operations
  async saveDraft(draft: DraftMessage): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['drafts'], 'readwrite');
    const store = transaction.objectStore('drafts');

    return new Promise((resolve, reject) => {
      const request = store.put(draft);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getDrafts(): Promise<DraftMessage[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['drafts'], 'readonly');
    const store = transaction.objectStore('drafts');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingDrafts(): Promise<DraftMessage[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['drafts'], 'readonly');
    const store = transaction.objectStore('drafts');
    const index = store.index('syncStatus');

    return new Promise((resolve, reject) => {
      const request = index.getAll('pending');
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async updateDraftStatus(
    id: string,
    syncStatus: DraftMessage['syncStatus'],
    errorMessage?: string
  ): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['drafts'], 'readwrite');
    const store = transaction.objectStore('drafts');

    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const draft = getRequest.result;
        if (draft) {
          draft.syncStatus = syncStatus;
          if (errorMessage !== undefined) {
            draft.errorMessage = errorMessage;
          }
          const putRequest = store.put(draft);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Draft not found'));
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async deleteDraft(id: string): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['drafts'], 'readwrite');
    const store = transaction.objectStore('drafts');

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Assignments operations
  async cacheAssignments(assignments: CachedAssignment[]): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['assignments'], 'readwrite');
    const store = transaction.objectStore('assignments');

    const now = Date.now();
    for (const assignment of assignments) {
      await store.put({ ...assignment, cachedAt: now });
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getAssignments(limit = 100): Promise<CachedAssignment[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['assignments'], 'readonly');
    const store = transaction.objectStore('assignments');
    const index = store.index('cachedAt');

    return new Promise((resolve, reject) => {
      const request = index.openCursor(null, 'prev');
      const results: CachedAssignment[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Announcements operations
  async cacheAnnouncements(announcements: CachedAnnouncement[]): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['announcements'], 'readwrite');
    const store = transaction.objectStore('announcements');

    const now = Date.now();
    for (const announcement of announcements) {
      await store.put({ ...announcement, cachedAt: now });
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getAnnouncements(limit = 50): Promise<CachedAnnouncement[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['announcements'], 'readonly');
    const store = transaction.objectStore('announcements');
    const index = store.index('cachedAt');

    return new Promise((resolve, reject) => {
      const request = index.openCursor(null, 'prev');
      const results: CachedAnnouncement[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Attachments operations
  async cacheAttachment(attachment: CachedAttachment): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['attachments'], 'readwrite');
    const store = transaction.objectStore('attachments');

    return new Promise((resolve, reject) => {
      const request = store.put({ ...attachment, cachedAt: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getAttachment(id: number): Promise<CachedAttachment | null> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['attachments'], 'readonly');
    const store = transaction.objectStore('attachments');

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getMessageAttachments(messageId: number): Promise<CachedAttachment[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['attachments'], 'readonly');
    const store = transaction.objectStore('attachments');
    const index = store.index('messageId');

    return new Promise((resolve, reject) => {
      const request = index.getAll(messageId);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Cleanup old cached data
  async cleanupOldCache(maxAgeMs = 7 * 24 * 60 * 60 * 1000): Promise<void> {
    const db = await this.ensureDB();
    const cutoffTime = Date.now() - maxAgeMs;
    
    const stores = ['messages', 'assignments', 'announcements', 'attachments'];
    
    for (const storeName of stores) {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const index = store.index('cachedAt');
      
      const request = index.openCursor(IDBKeyRange.upperBound(cutoffTime));
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
    }
  }

  async clearAll(): Promise<void> {
    const db = await this.ensureDB();
    const stores = ['messages', 'assignments', 'announcements', 'drafts', 'attachments'];
    
    const transaction = db.transaction(stores, 'readwrite');
    
    for (const storeName of stores) {
      transaction.objectStore(storeName).clear();
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export const offlineDB = new OfflineDB();
