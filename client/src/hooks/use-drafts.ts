import { useState, useEffect, useCallback } from 'react';
import { offlineDB, type DraftMessage, fileToAttachment, attachmentToFile } from '@/lib/offline-db';
import { apiFetch } from '@/lib/api-config';
import { useToast } from '@/hooks/use-toast';

// Background Sync tag
const SYNC_TAG = 'sync-drafts';

/**
 * Register Background Sync for automatic draft synchronization
 */
async function registerBackgroundSync() {
  try {
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(SYNC_TAG);
      console.log('📱 Background Sync registered');
    } else {
      console.log('⚠️ Background Sync not supported');
    }
  } catch (error) {
    console.error('❌ Failed to register Background Sync:', error);
  }
}

/**
 * Hook to manage draft messages
 */
export function useDrafts() {
  const [drafts, setDrafts] = useState<DraftMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadDrafts = useCallback(async () => {
    try {
      const allDrafts = await offlineDB.getDrafts();
      setDrafts(allDrafts);
    } catch (error) {
      console.error('Failed to load drafts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  const saveDraft = useCallback(async (draft: { 
    subject: string;
    content?: string;
    recipientIds: number[];
    documentNumber?: string;
    attachments?: File[];
  }) => {
    // Convert File objects to DraftAttachment
    const attachments = draft.attachments 
      ? await Promise.all(draft.attachments.map(file => fileToAttachment(file)))
      : undefined;

    const newDraft: DraftMessage = {
      subject: draft.subject,
      content: draft.content || '',
      recipientIds: draft.recipientIds,
      documentNumber: draft.documentNumber,
      attachments,
      id: `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      syncStatus: 'pending',
    };

    try {
      await offlineDB.saveDraft(newDraft);
      await loadDrafts();
      
      // Register Background Sync for automatic retry
      await registerBackgroundSync();
      
      toast({
        title: 'Лоиҳа нигоҳ дошта шуд',
        description: 'Паём ҳангоми барқарорӣ алоқа фиристода мешавад',
      });

      return newDraft.id;
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast({
        title: 'Хато',
        description: 'Лоиҳа нигоҳ дошта нашуд',
        variant: 'destructive',
      });
      throw error;
    }
  }, [loadDrafts, toast]);

  const deleteDraft = useCallback(async (id: string) => {
    try {
      await offlineDB.deleteDraft(id);
      await loadDrafts();
      
      toast({
        title: 'Лоиҳа нест карда шуд',
      });
    } catch (error) {
      console.error('Failed to delete draft:', error);
      toast({
        title: 'Хато',
        description: 'Лоиҳа нест карда нашуд',
        variant: 'destructive',
      });
    }
  }, [loadDrafts, toast]);

  const syncDraft = useCallback(async (draft: DraftMessage) => {
    try {
      // Mark as syncing
      await offlineDB.updateDraftStatus(draft.id, 'syncing');
      await loadDrafts();

      // Convert DraftAttachment back to File objects
      const files = draft.attachments 
        ? draft.attachments.map(att => attachmentToFile(att))
        : [];

      // Prepare FormData for files
      const formData = new FormData();
      formData.append('subject', draft.subject);
      formData.append('content', draft.content);
      formData.append('recipientIds', JSON.stringify(draft.recipientIds));
      
      if (draft.documentNumber) {
        formData.append('documentNumber', draft.documentNumber);
      }

      if (files.length > 0) {
        for (const file of files) {
          formData.append('attachments', file);
        }
      }

      // Send message using apiFetch (includes auth headers)
      const response = await apiFetch('/api/messages', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Mark as synced and delete
      await offlineDB.updateDraftStatus(draft.id, 'synced');
      await offlineDB.deleteDraft(draft.id);
      await loadDrafts();

      toast({
        title: 'Паём фиристода шуд',
        description: 'Лоиҳа бомуваффақият фиристода шуд',
      });

      return true;
    } catch (error) {
      console.error('Failed to sync draft:', error);
      
      await offlineDB.updateDraftStatus(
        draft.id,
        'failed',
        error instanceof Error ? error.message : 'Хатои номаълум'
      );
      await loadDrafts();

      toast({
        title: 'Хатои фиристодан',
        description: 'Лоиҳа фиристода нашуд. Баъдтар кӯшиш мекунем.',
        variant: 'destructive',
      });

      return false;
    }
  }, [loadDrafts, toast]);

  const syncAllPendingDrafts = useCallback(async () => {
    const pendingDrafts = drafts.filter(d => d.syncStatus === 'pending');
    
    if (pendingDrafts.length === 0) {
      return;
    }

    toast({
      title: 'Ҳамоҳангсозии лоиҳаҳо',
      description: `Фиристодани ${pendingDrafts.length} паём...`,
    });

    let successCount = 0;
    for (const draft of pendingDrafts) {
      const success = await syncDraft(draft);
      if (success) {
        successCount++;
      }
    }

    if (successCount > 0) {
      toast({
        title: 'Ҳамоҳангсозӣ ба анҷом расид',
        description: `${successCount} аз ${pendingDrafts.length} паём фиристода шуданд`,
      });
    }
  }, [drafts, syncDraft, toast]);

  return {
    drafts,
    isLoading,
    saveDraft,
    deleteDraft,
    syncDraft,
    syncAllPendingDrafts,
    pendingCount: drafts.filter(d => d.syncStatus === 'pending').length,
  };
}
