import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation, type Language } from '@/lib/i18n';
import { ArrowLeft, Download, Reply, Paperclip, Leaf } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import type { Message, Department } from '@shared/schema';
import { format } from 'date-fns';
import bgImage from '@assets/eco-background-light.webp';

export default function MessageView() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [lang, setLang] = useState<Language>('tg');
  const t = useTranslation(lang);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: message, isLoading } = useQuery<Message>({
    queryKey: ['/api/messages', id],
    enabled: !!id,
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  // Load original message if this is a reply
  const { data: originalMessage } = useQuery<Message>({
    queryKey: ['/api/messages', message?.replyToId],
    enabled: !!message?.replyToId,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      return await apiRequest('PATCH', `/api/messages/${messageId}/read`, undefined);
    },
    onSuccess: () => {
      // Invalidate queries to refresh message lists
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/unread/count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/unread/by-department'] });
    },
    onError: (error: any) => {
      console.error('Failed to mark message as read:', error);
      toast({
        title: lang === 'tg' ? 'Хато' : 'Ошибка',
        description: lang === 'tg' ? 'Хатогӣ ҳангоми навсозии ҳолат' : 'Ошибка при обновлении статуса',
        variant: 'destructive',
      });
    },
  });

  // Automatically mark message as read when opened (only if current user is the recipient)
  useEffect(() => {
    if (id && message && !message.isRead && user?.userType === 'department' && !markAsReadMutation.isPending) {
      const currentDepartmentId = user.department.id;
      // Only mark as read if current user is the recipient
      if (message.recipientId === currentDepartmentId) {
        markAsReadMutation.mutate(id);
      }
    }
  }, [id, message?.isRead, message?.recipientId, user, markAsReadMutation.isPending]);

  const getSenderName = (senderId: number) => {
    const dept = departments.find(d => d.id === senderId);
    return dept?.name || '';
  };

  const getRecipientName = (recipientId: number) => {
    const dept = departments.find(d => d.id === recipientId);
    return dept?.name || '';
  };

  const handleReply = () => {
    if (id) {
      setLocation(`/department/compose?replyTo=${id}`);
    }
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    if (!id) {
      return;
    }

    try {
      // Get signed download URL from backend (requires messageId for authorization)
      const response = await apiRequest('POST', '/api/objects/download', {
        messageId: id,
        fileUrl,
      });
      
      const { downloadURL } = response as { downloadURL: string };
      
      // Download file using signed URL
      const link = document.createElement('a');
      link.href = downloadURL;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: lang === 'tg' ? 'Хато' : 'Ошибка',
        description: lang === 'tg' ? 'Хатогӣ ҳангоми боргирӣ' : 'Ошибка при загрузке файла',
        variant: 'destructive',
      });
    }
  };

  // Get all attachments (support both old single attachment and new multiple attachments)
  const getAttachments = (): Array<{ url: string; name: string }> => {
    if (!message) return [];
    
    // If new attachments array exists and is not empty, use it
    if (message.attachments && Array.isArray(message.attachments) && message.attachments.length > 0) {
      return message.attachments;
    }
    
    // Fallback to old single attachment fields for backward compatibility
    if (message.attachmentUrl && message.attachmentName) {
      return [{ url: message.attachmentUrl, name: message.attachmentName }];
    }
    
    return [];
  };

  const attachments = getAttachments();

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed relative"
      style={{ 
        backgroundImage: `url(${bgImage})`,
      }}
    >
      <div 
        className="absolute inset-0" 
        style={{
          background: 'rgba(255, 255, 255, 0.92)'
        }}
      />
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md relative">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex h-14 sm:h-16 items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/department/inbox')}
                data-testid="button-back"
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
                  <Leaf className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-base md:text-lg font-semibold text-foreground truncate">{message?.subject || 'ЭкоТочикистон'}</h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">ЭкоТочикистон</p>
                </div>
              </div>
            </div>
            <LanguageSwitcher currentLang={lang} onLanguageChange={setLang} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-3 py-4 sm:px-4 sm:py-8 md:px-6 lg:px-8 relative z-10">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">{lang === 'tg' ? 'Боргирӣ...' : 'Загрузка...'}</p>
            </div>
          </div>
        ) : !message ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">
              {lang === 'tg' ? 'Паём ёфт нашуд' : 'Сообщение не найдено'}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {originalMessage && (
              <Card className="bg-muted/30" data-testid="original-message">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Reply className="h-4 w-4" />
                    <span>{lang === 'tg' ? 'Ҷавоб ба паём' : 'Ответ на сообщение'}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-foreground" data-testid="original-subject">{originalMessage.subject}</h3>
                    <div className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium">{t.sender}:</span> {getSenderName(originalMessage.senderId)}
                      {' • '}
                      <span>{format(new Date(originalMessage.documentDate), 'dd.MM.yyyy')}</span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground line-clamp-3" data-testid="original-content">
                    {originalMessage.content}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h2 className="text-xl font-semibold text-foreground" data-testid="text-subject">{message.subject}</h2>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p data-testid="text-sender">
                        <span className="font-medium">{t.sender}:</span> {getSenderName(message.senderId)}
                      </p>
                      <p data-testid="text-date">
                        <span className="font-medium">{t.date}:</span> {format(new Date(message.documentDate), 'dd.MM.yyyy')}
                      </p>
                      {message.executor && (
                        <p data-testid="text-executor">
                          <span className="font-medium">{t.executor}:</span> {message.executor}
                        </p>
                      )}
                    </div>
                  </div>
                  {user?.userType === 'department' && (
                    <Button onClick={handleReply} data-testid="button-reply" className="gap-2">
                      <Reply className="h-4 w-4" />
                      {t.reply}
                    </Button>
                  )}
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {lang === 'tg' ? 'Замимашудаҳо' : 'Вложения'} ({attachments.length})
                    </p>
                    {attachments.map((attachment, index) => (
                      <div key={index} className="flex items-center gap-3 rounded-md border border-border bg-muted/30 p-4">
                        <Paperclip className="h-5 w-5 text-muted-foreground" />
                        <span className="flex-1 text-sm font-medium text-foreground truncate" data-testid={`text-attachment-${index}`}>
                          {attachment.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(attachment.url, attachment.name)}
                          data-testid={`button-download-${index}`}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          {t.download}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed" data-testid="text-content">
                  {message.content}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
