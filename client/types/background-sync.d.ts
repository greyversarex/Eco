/**
 * Type definitions for Background Sync API
 * TypeScript removed these in v4.4.0 as API is not standardized
 * See: https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API
 */

interface SyncManager {
  getTags(): Promise<string[]>;
  register(tag: string): Promise<void>;
}

interface SyncEvent extends ExtendableEvent {
  readonly lastChance: boolean;
  readonly tag: string;
}

declare global {
  interface ServiceWorkerRegistration {
    readonly sync: SyncManager;
  }

  interface ServiceWorkerGlobalScopeEventMap {
    sync: SyncEvent;
  }

  interface Window {
    SyncManager?: typeof SyncManager;
  }
}

export {};
