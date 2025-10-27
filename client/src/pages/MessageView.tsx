import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useTranslation, type Language } from '@/lib/i18n';
import { ArrowLeft, Download, Reply, Paperclip, Leaf, Trash2, LogOut } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import type { Message, Department } from '@shared/schema';
import { format } from 'date-fns';
import bgImage from '@assets/eco-background-light.webp';
import logoImage from '@assets/logo-optimized.webp';
import { Footer } from '@/components/Footer';

interface Attachment {
  id: number;
  filename: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

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

  // Load attachments from database
  const { data: attachments = [] } = useQuery<Attachment[]>({
    queryKey: ['/api/messages', id, 'attachments'],
    enabled: !!id,
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

  // Determine if current message is sent or received
  const isSentMessage = message && user?.userType === 'department' && message.senderId === user.department.id;
  
  // Determine back location based on user type
  let backLocation = '/department/inbox';
  if (user?.userType === 'admin') {
    backLocation = '/admin/departments';
  } else if (isSentMessage) {
    backLocation = '/department/outbox';
  }

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      return await apiRequest('DELETE', `/api/messages/${messageId}`, undefined);
    },
    onSuccess: () => {
      toast({
        title: lang === 'tg' ? 'Муваффақият' : 'Успешно',
        description: lang === 'tg' ? 'Ҳуҷҷат нест карда шуд' : 'Документ удален',
      });
      // Invalidate queries and go back to appropriate list
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/unread/count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/unread/by-department'] });
      setLocation(backLocation);
    },
    onError: (error: any) => {
      toast({
        title: lang === 'tg' ? 'Хато' : 'Ошибка',
        description: error.message || (lang === 'tg' ? 'Хатогӣ ҳангоми несткунии ҳуҷҷат' : 'Ошибка при удалении документа'),
        variant: 'destructive',
      });
    },
  });

  const handleDelete = () => {
    if (!id) return;
    
    // Confirm deletion
    const confirmed = window.confirm(
      lang === 'tg' 
        ? 'Шумо мутмаин ҳастед, ки мехоҳед ин ҳуҷҷатро нест кунед?' 
        : 'Вы уверены, что хотите удалить этот документ?'
    );
    
    if (confirmed) {
      deleteMessageMutation.mutate(id);
    }
  };

  const handleDownload = async (attachmentId: number, fileName: string) => {
    try {
      // Download directly from database via API
      const link = document.createElement('a');
      link.href = `/api/attachments/${attachmentId}`;
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

  return (
    <div 
      className="min-h-screen flex flex-col bg-cover bg-center bg-fixed relative"
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
      <header 
        className="sticky top-0 z-50 border-b border-border/20 backdrop-blur-md relative"
        style={{
          background: 'linear-gradient(135deg, #4a9d4a 0%, #5cb85c 50%, #6fca6f 100%)'
        }}
      >
        <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex h-14 sm:h-16 items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation(backLocation)}
                data-testid="button-back"
                className="shrink-0 text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <button 
                onClick={() => setLocation('/department/main')}
                className="flex items-start gap-2 sm:gap-3 min-w-0 hover:opacity-80 transition-opacity pt-1"
                data-testid="button-home"
              >
                <img src={logoImage} alt="Логотип" className="hidden sm:block h-10 w-10 object-contain shrink-0 drop-shadow-md" />
                <div className="min-w-0 text-left">
                  <h1 className="text-sm sm:text-base md:text-lg font-semibold text-white drop-shadow-md truncate">{message?.subject || 'Портали электронӣ'}</h1>
                  <p className="text-xs text-white/90 drop-shadow-sm hidden sm:block">Портали электронӣ</p>
                </div>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => {
                  fetch('/api/auth/logout', { method: 'POST' })
                    .then(() => setLocation('/'));
                }}
                data-testid="button-logout"
                className="flex items-center gap-2 bg-red-500/90 hover:bg-red-600 text-white border-0 font-medium shadow-md"
              >
                <LogOut className="h-4 w-4" />
                <span>{lang === 'tg' ? 'Баромад' : 'Выход'}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-8 md:px-6 lg:px-8 relative z-10">
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
                      <span>{format(new Date(originalMessage.documentDate), 'd. M. yyyy')}</span>
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
                        <span className="font-medium">{t.date}:</span> {format(new Date(message.documentDate), 'd. M. yyyy')}
                      </p>
                      {message.executor && (
                        <p data-testid="text-executor">
                          <span className="font-medium">{t.executor}:</span> {message.executor}
                        </p>
                      )}
                    </div>
                  </div>
                  {user?.userType === 'department' && (
                    <div className="flex gap-2">
                      <Button onClick={handleReply} data-testid="button-reply" className="gap-2">
                        <Reply className="h-4 w-4" />
                        {t.reply}
                      </Button>
                      <Button 
                        onClick={handleDelete} 
                        data-testid="button-delete" 
                        variant="destructive"
                        className="gap-2"
                        disabled={deleteMessageMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                        {deleteMessageMutation.isPending 
                          ? (lang === 'tg' ? 'Нест шуда истодааст...' : 'Удаление...') 
                          : (lang === 'tg' ? 'Нест кардан' : 'Удалить')}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                <section
                  className="rounded-2xl border-2 border-emerald-200/70 dark:border-emerald-800/50 bg-gradient-to-br from-emerald-50/40 via-white to-white dark:from-slate-800 dark:via-slate-900 dark:to-slate-900 shadow-lg shadow-emerald-100/30 dark:shadow-none overflow-hidden"
                  data-testid="section-content"
                >
                  <div className="flex items-center gap-3 px-6 py-4 border-b-2 border-emerald-100/70 dark:border-emerald-900/40 bg-gradient-to-r from-emerald-50 to-white dark:from-slate-800 dark:to-slate-900">
                    <Leaf className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100" data-testid="heading-content">
                      {lang === 'tg' ? 'Мазмун' : 'Содержимое сообщения'}
                    </h3>
                  </div>
                  <div className="px-6 py-6 sm:px-8 sm:py-8 bg-white dark:bg-slate-900">
                    <div
                      className="whitespace-pre-line text-base sm:text-lg leading-relaxed sm:leading-8 text-gray-900 dark:text-gray-100"
                      data-testid="text-content"
                    >
                      {message.content}
                    </div>
                  </div>
                </section>

                {attachments.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      <p className="text-base font-semibold text-emerald-900 dark:text-emerald-100">
                        {lang === 'tg' ? 'Замимашудаҳо' : 'Вложения'} ({attachments.length})
                      </p>
                    </div>
                    <div className="space-y-2">
                      {attachments.map((attachment, index) => (
                        <div key={attachment.id} className="flex items-center gap-3 rounded-lg border-2 border-emerald-100 dark:border-emerald-900/40 bg-white dark:bg-slate-900 p-4 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
                          <Paperclip className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate" data-testid={`text-attachment-${index}`}>
                              {attachment.filename}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(attachment.fileSize / 1024 / 1024).toFixed(2)} МБ
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(attachment.id, attachment.filename)}
                            data-testid={`button-download-${index}`}
                            className="gap-2 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                          >
                            <Download className="h-4 w-4" />
                            {t.download}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
