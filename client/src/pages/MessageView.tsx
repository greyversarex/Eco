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

const formatDateTajik = (date: Date, lang: Language) => {
  const monthsTajik = [
    'январ', 'феврал', 'март', 'апрел', 'май', 'июн',
    'июл', 'август', 'сентябр', 'октябр', 'ноябр', 'декабр'
  ];
  
  const day = date.getDate();
  const month = lang === 'tg' ? monthsTajik[date.getMonth()] : monthsTajik[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day} ${month} ${year}`;
};

export default function MessageView() {
  const { id } = useParams();
  const [location, setLocation] = useLocation();
  const [lang, setLang] = useState<Language>('tg');
  const t = useTranslation(lang);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Get 'from' query parameter to know where to go back
  const searchParams = new URLSearchParams(window.location.search);
  const fromPage = searchParams.get('from');

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
  
  // Determine back location - prioritize 'from' parameter, then fall back to inbox/outbox
  let backLocation = '/department/inbox';
  if (fromPage) {
    backLocation = fromPage;
  } else if (user?.userType === 'admin') {
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
        description: lang === 'tg' ? 'Ҳуҷҷат бекор карда шуд' : 'Документ удален',
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
        ? 'Шумо мутмаин ҳастед, ки мехоҳед ин ҳуҷҷатро бекор кунед?' 
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
              <Card className="bg-white dark:bg-slate-900" data-testid="original-message">
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
                      <span>{formatDateTajik(new Date(originalMessage.documentDate), lang)}</span>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground line-clamp-3" data-testid="original-content">
                    {originalMessage.content}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-border/40 bg-white dark:bg-slate-900">
              <CardHeader className="pb-6 space-y-6 border-b">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-4">
                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground" data-testid="text-subject">{message.subject}</h2>
                  </div>
                  {user?.userType === 'admin' && (
                    <div className="flex gap-2 shrink-0">
                      <Button 
                        onClick={handleDelete} 
                        data-testid="button-delete" 
                        variant="destructive"
                        size="lg"
                        className="gap-2"
                        disabled={deleteMessageMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                        {deleteMessageMutation.isPending 
                          ? (lang === 'tg' ? 'Бекор шуда истодааст...' : 'Удаление...') 
                          : (lang === 'tg' ? 'Бекор кардан' : 'Удалить')}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-8 space-y-6">
                <div className="prose prose-lg max-w-none" data-testid="text-content">
                  <div className="whitespace-pre-line text-lg leading-relaxed text-foreground">
                    {message.content}
                  </div>
                </div>

                <div className="space-y-3 text-base text-muted-foreground border-t pt-6">
                  <p data-testid="text-date" className="text-foreground">
                    {formatDateTajik(new Date(message.documentDate), lang)}
                  </p>
                  {message.executor && (
                    <p data-testid="text-executor" className="text-foreground">
                      {message.executor}
                    </p>
                  )}
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-xl font-semibold text-foreground">
                      {lang === 'tg' ? 'Замимашудаҳо' : 'Вложения'} ({attachments.length})
                    </h3>
                    <div className="space-y-3">
                      {attachments.map((attachment, index) => (
                        <div key={attachment.id} className="flex items-center gap-4 rounded-lg border border-border bg-card p-5 hover:bg-accent/50 transition-colors">
                          <Paperclip className="h-6 w-6 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-medium text-foreground truncate" data-testid={`text-attachment-${index}`}>
                              {attachment.filename}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {(attachment.fileSize / 1024 / 1024).toFixed(2)} МБ
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="lg"
                            onClick={() => handleDownload(attachment.id, attachment.filename)}
                            data-testid={`button-download-${index}`}
                            className="gap-2 shrink-0"
                          >
                            <Download className="h-5 w-5" />
                            {t.download}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {user?.userType === 'department' && (
                  <div className="pt-4 border-t">
                    <Button onClick={handleReply} data-testid="button-reply" className="gap-2" size="lg">
                      <Reply className="h-4 w-4" />
                      {t.reply}
                    </Button>
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
