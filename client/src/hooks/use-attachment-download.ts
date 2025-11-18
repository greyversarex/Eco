import { useCallback } from 'react';
import { offlineDB } from '@/lib/offline-db';
import { apiFetch } from '@/lib/api-config';
import { useOnlineStatus } from '@/hooks/use-offline';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook for downloading attachments with offline caching support
 */
export function useAttachmentDownload() {
  const isOnline = useOnlineStatus();
  const { toast } = useToast();

  const downloadAttachment = useCallback(async (
    attachmentId: number,
    fileName: string,
    apiEndpoint: string,
    relatedId?: number
  ) => {
    try {
      // Check cache first
      const cachedFile = await offlineDB.getAttachment(attachmentId);
      
      if (cachedFile) {
        // Use cached file
        console.log('📦 Using cached attachment:', fileName);
        const blob = cachedFile.data;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return true;
      }

      // Not in cache - check if online
      if (!isOnline) {
        toast({
          title: 'Офлайн',
          description: 'Файл дар кеш нест. Барои боргирӣ интернет лозим аст',
          variant: 'destructive',
        });
        return false;
      }

      // Download from server
      console.log('🌐 Downloading attachment from server:', fileName);
      const response = await apiFetch(apiEndpoint);
      
      if (!response.ok) {
        throw new Error('Failed to download');
      }

      const blob = await response.blob();
      const contentType = response.headers.get('content-type') || 'application/octet-stream';

      // Cache for offline use
      await offlineDB.cacheAttachment({
        id: attachmentId,
        messageId: relatedId,
        filename: fileName,
        mimeType: contentType,
        size: blob.size,
        data: blob,
        cachedAt: Date.now(),
      });

      // Download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✅ Attachment downloaded and cached');
      return true;
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: 'Хато',
        description: 'Хатогӣ ҳангоми боргирӣ',
        variant: 'destructive',
      });
      return false;
    }
  }, [isOnline, toast]);

  return { downloadAttachment };
}
