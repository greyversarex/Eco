import { useState, useEffect, useCallback } from 'react';
import { offlineDB, type DraftMessage } from '@/lib/offline-db';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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

  const saveDraft = useCallback(async (draft: Omit<DraftMessage, 'id' | 'createdAt' | 'syncStatus'>) => {
    const newDraft: DraftMessage = {
      ...draft,
      id: `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      syncStatus: 'pending',
    };

    try {
      await offlineDB.saveDraft(newDraft);
      await loadDrafts();
      
      toast({
        title: 'Черновик сохранён',
        description: 'Сообщение будет отправлено при восстановлении соединения',
      });

      return newDraft.id;
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить черновик',
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
        title: 'Черновик удалён',
      });
    } catch (error) {
      console.error('Failed to delete draft:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить черновик',
        variant: 'destructive',
      });
    }
  }, [loadDrafts, toast]);

  const syncDraft = useCallback(async (draft: DraftMessage) => {
    try {
      // Mark as syncing
      await offlineDB.updateDraftStatus(draft.id, 'syncing');
      await loadDrafts();

      // Prepare FormData for files
      const formData = new FormData();
      formData.append('subject', draft.subject);
      formData.append('content', draft.content);
      formData.append('recipientIds', JSON.stringify(draft.recipientIds));
      
      if (draft.documentNumber) {
        formData.append('documentNumber', draft.documentNumber);
      }

      if (draft.attachments && draft.attachments.length > 0) {
        for (const file of draft.attachments) {
          formData.append('attachments', file);
        }
      }

      // Send message
      const response = await fetch('/api/messages', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Mark as synced and delete
      await offlineDB.updateDraftStatus(draft.id, 'synced');
      await offlineDB.deleteDraft(draft.id);
      await loadDrafts();

      toast({
        title: 'Сообщение отправлено',
        description: 'Черновик успешно отправлен',
      });

      return true;
    } catch (error) {
      console.error('Failed to sync draft:', error);
      
      await offlineDB.updateDraftStatus(
        draft.id,
        'failed',
        error instanceof Error ? error.message : 'Неизвестная ошибка'
      );
      await loadDrafts();

      toast({
        title: 'Ошибка отправки',
        description: 'Не удалось отправить черновик. Попробуем позже.',
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
      title: 'Синхронизация черновиков',
      description: `Отправка ${pendingDrafts.length} сообщений...`,
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
        title: 'Синхронизация завершена',
        description: `Отправлено ${successCount} из ${pendingDrafts.length} сообщений`,
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
