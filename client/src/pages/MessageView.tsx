import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useTranslation, type Language } from '@/lib/i18n';
import { ArrowLeft, Download, Reply, Paperclip, Leaf, Trash2, LogOut, FileText, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import type { Message, Department } from '@shared/schema';
import { format } from 'date-fns';
import bgImage from '@assets/eco-background-light.webp';
import logoImage from '@assets/logo-optimized.webp';
import { Footer } from '@/components/Footer';
import { DatePicker } from '@/components/ui/date-picker';

interface Attachment {
  id: number;
  filename: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

const ASSIGNMENT_TOPICS = [
  'Нақшаи корӣ',
  'Протоколи назоратӣ',
  'Қарорҳои ҳайати мушовара',
  'Протоколҳои ҷаласаҳои ҳайати мушовара',
];

const EXECUTORS_LIST = [
  'Шукурзода И',
  'Раҳмонзода Л.Ш',
  'Назирзода Абдуқодир. С',
  'Қурбонзода Абдуллоҳ. Ҳ',
  'Холзода Суҳроб. Хол',
  'Сабзали Шаҳтут. Н',
  'Собтрзода Қурбоналӣ. М',
  'Нурализода Фируз. М',
  'Сафарализода Бахтиёр. С',
  'Ибодуллои Маҳмадулло',
  'Салимзода Умаралӣ. С',
  'Қаландарзода Абдуқаюм. Ҷ',
  'Давлатзода Сарвар',
  'Зарифзода Фарҳод. Т',
  'Идизод Неъматулло. Р',
  'Қурбонзода Фируз. А',
  'Маҳмудов Насим. З',
  'Раҳмоналӣ Маҳмадалӣ',
  'Давлатзода Афзал. А',
  'Бобохонзода Адолатхон. О',
  'Шамсиддинзода Хуршед.Ш',
  'Дустзода Ҳасан. Т',
  'Шерматов Хисравшоҳ. Р',
  'Сафаров Фирузю П',
  'Улуғов Умидҷон. А',
  'Тиллои Гулрухсор. А',
  'Аҳрорзода Ҳамароҳ. Ҳ',
  'Судурзода Саидисмон. С',
  'Ятимов Олимҷон. Р',
  'Ҷунайдзода Муҳибулло.Ҳ',
  'Панҷиев Аъзам. А',
  'Яқубов Ҷамолиддин. Н',
  'Каримов Алихон. А',
  'Алмосов Сафаралӣ. А',
  'Ашуриён Хуршед. Қ',
  'Юсуфзода Абдуҷалил.Ҳ',
  'Маҳмадализода Шарофиддин. А',
  'Камолзода Дилшод. Н',
  'Каримзода Акмал. Т',
  'Нуров Муродулло.Т',
  'Расуло Ҷамшед. Д',
  'Буев Абдулазиз. А',
  'Камолов Эраҷ. Т',
  'Раҷабов Сайҷафар. Д',
  'Саъдуллоев Бекназар. С',
  'Ҳуҷумбороа Фазлиддин. С',
];

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
  
  // Assignment modal state
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [assignmentTopic, setAssignmentTopic] = useState('');
  const [assignmentContent, setAssignmentContent] = useState('');
  const [assignmentDocNumber, setAssignmentDocNumber] = useState('');
  const [selectedExecutors, setSelectedExecutors] = useState<string[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);
  const [assignmentDeadline, setAssignmentDeadline] = useState('');
  const [assignmentFiles, setAssignmentFiles] = useState<File[]>([]);
  
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

  // Load department list for assignment recipients selection
  const { data: departmentsList = [], isLoading: loadingDepartments } = useQuery<any[]>({
    queryKey: ['/api/departments/list'],
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

  const createAssignmentMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create assignment');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      toast({
        title: lang === 'tg' ? 'Муваффақият' : 'Успешно',
        description: lang === 'tg' ? 'Супориш эҷод шуд' : 'Поручение создано',
      });
      setIsAssignmentDialogOpen(false);
      // Clear form
      setAssignmentTopic('');
      setAssignmentContent('');
      setAssignmentDocNumber('');
      setSelectedExecutors([]);
      setSelectedRecipients([]);
      setAssignmentDeadline('');
      setAssignmentFiles([]);
    },
    onError: (error: any) => {
      toast({
        title: lang === 'tg' ? 'Хато' : 'Ошибка',
        description: error.message,
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

  // Open assignment dialog with pre-filled data from message
  const openAssignmentDialog = () => {
    if (!message) return;
    // Pre-fill content from message subject and content
    setAssignmentContent(message.subject + (message.content ? '\n\n' + message.content : ''));
    // Pre-fill document number if available
    if (message.documentNumber) {
      setAssignmentDocNumber(message.documentNumber);
    }
    setIsAssignmentDialogOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      if (assignmentFiles.length + filesArray.length > 5) {
        toast({
          title: lang === 'tg' ? 'Хато' : 'Ошибка',
          description: lang === 'tg' ? 'Шумо танҳо то 5 файл метавонед илова кунед' : 'Вы можете добавить только до 5 файлов',
          variant: 'destructive',
        });
        return;
      }
      setAssignmentFiles([...assignmentFiles, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setAssignmentFiles(assignmentFiles.filter((_, i) => i !== index));
  };

  const handleSubmitAssignment = () => {
    if (!assignmentTopic) {
      toast({
        title: lang === 'tg' ? 'Хато' : 'Ошибка',
        description: lang === 'tg' ? 'Мавзӯъро интихоб кунед' : 'Выберите тему',
        variant: 'destructive',
      });
      return;
    }
    if (selectedExecutors.length === 0) {
      toast({
        title: lang === 'tg' ? 'Хато' : 'Ошибка',
        description: lang === 'tg' ? 'Иҷрокунандагонро интихоб кунед' : 'Выберите исполнителей',
        variant: 'destructive',
      });
      return;
    }
    if (selectedRecipients.length === 0) {
      toast({
        title: lang === 'tg' ? 'Хато' : 'Ошибка',
        description: lang === 'tg' ? 'Ҳадди ақал як гиранда интихоб кунед' : 'Выберите хотя бы одного получателя',
        variant: 'destructive',
      });
      return;
    }
    if (!assignmentDeadline) {
      toast({
        title: lang === 'tg' ? 'Хато' : 'Ошибка',
        description: lang === 'tg' ? 'Мӯҳлати иҷроро муайян кунед' : 'Укажите срок выполнения',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    formData.append('topic', assignmentTopic);
    if (assignmentContent) {
      formData.append('content', assignmentContent);
    }
    if (assignmentDocNumber) {
      formData.append('documentNumber', assignmentDocNumber);
    }
    formData.append('executors', JSON.stringify(selectedExecutors));
    formData.append('recipientIds', JSON.stringify(selectedRecipients));
    formData.append('deadline', assignmentDeadline);
    
    assignmentFiles.forEach((file) => {
      formData.append('files', file);
    });

    createAssignmentMutation.mutate(formData);
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

      <main className="flex-1 w-full px-3 py-4 sm:px-4 sm:py-8 md:px-6 lg:px-8 relative z-10">
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
          <div className="w-full space-y-4">
            {originalMessage && (
              <Card className="w-full bg-white dark:bg-slate-900" data-testid="original-message">
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

            <Card className="w-full border-border/40 bg-white dark:bg-slate-900">
              <CardHeader className="pb-6 space-y-6 border-b">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-4">
                    <h2 className="text-xl font-semibold text-foreground" data-testid="text-subject">{message.subject}</h2>
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

                <div className="space-y-3 text-base border-t pt-6">
                  {message.documentNumber && (
                    <div data-testid="text-document-number">
                      <span className="text-muted-foreground font-medium">{lang === 'tg' ? 'Рақами ҳуҷҷат:' : 'Номер документа:'}</span>
                      <span className="ml-2 text-foreground">{message.documentNumber}</span>
                    </div>
                  )}
                  <div data-testid="text-date">
                    <span className="text-muted-foreground font-medium">{lang === 'tg' ? 'Сана:' : 'Дата:'}</span>
                    <span className="ml-2 text-foreground">{formatDateTajik(new Date(message.documentDate), lang)}</span>
                  </div>
                  {message.executor && (
                    <div data-testid="text-executor">
                      <span className="text-muted-foreground font-medium">{lang === 'tg' ? 'Иҷрокунанда:' : 'Исполнитель:'}</span>
                      <span className="ml-2 text-foreground">{message.executor}</span>
                    </div>
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
                  <div className="pt-4 border-t flex gap-3">
                    <Button onClick={handleReply} data-testid="button-reply" className="gap-2" size="lg">
                      <Reply className="h-4 w-4" />
                      {t.reply}
                    </Button>
                    {user.department?.code === 'ROHBAR001' && (
                      <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
                        <DialogTrigger asChild>
                          <Button onClick={openAssignmentDialog} data-testid="button-create-assignment" className="gap-2 bg-green-600 hover:bg-green-700 text-white" size="lg">
                            <FileText className="h-4 w-4" />
                            {lang === 'tg' ? 'Вазифагузорӣ' : 'Поручение'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{lang === 'tg' ? 'Эҷоди супориш' : 'Создание поручения'}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label>{lang === 'tg' ? 'Мавзӯъро интихоб кунед' : 'Выберите тему'}</Label>
                              <Select value={assignmentTopic} onValueChange={setAssignmentTopic}>
                                <SelectTrigger data-testid="select-assignment-topic">
                                  <SelectValue placeholder={lang === 'tg' ? 'Интихоб кунед' : 'Выберите'} />
                                </SelectTrigger>
                                <SelectContent>
                                  {ASSIGNMENT_TOPICS.map((t) => (
                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>{lang === 'tg' ? 'Мазмуни супоришҳои додашуда' : 'Содержание поручения'}</Label>
                              <Textarea
                                value={assignmentContent}
                                onChange={(e) => setAssignmentContent(e.target.value)}
                                placeholder={lang === 'tg' ? 'Шарҳи иловагӣ...' : 'Дополнительные комментарии...'}
                                className="min-h-[120px]"
                                data-testid="textarea-assignment-content"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="assignment-doc-number">
                                {lang === 'tg' ? 'Рақами ҳуҷҷат' : 'Номер документа'}
                              </Label>
                              <Input
                                id="assignment-doc-number"
                                value={assignmentDocNumber}
                                onChange={(e) => setAssignmentDocNumber(e.target.value)}
                                placeholder={lang === 'tg' ? 'Рақами ҳуҷҷат' : 'Номер документа'}
                                data-testid="input-assignment-doc-number"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>{lang === 'tg' ? 'Иҷрокунандагон' : 'Исполнители'}</Label>
                              <div className="border rounded-md p-4 max-h-60 overflow-y-auto space-y-2">
                                {EXECUTORS_LIST.map((executor) => (
                                  <div key={executor} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`assignment-executor-${executor}`}
                                      checked={selectedExecutors.includes(executor)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedExecutors([...selectedExecutors, executor]);
                                        } else {
                                          setSelectedExecutors(selectedExecutors.filter(e => e !== executor));
                                        }
                                      }}
                                      data-testid={`checkbox-assignment-executor-${executor}`}
                                    />
                                    <label htmlFor={`assignment-executor-${executor}`} className="text-sm cursor-pointer">{executor}</label>
                                  </div>
                                ))}
                              </div>
                              {selectedExecutors.length > 0 && (
                                <p className="text-sm text-muted-foreground">
                                  {lang === 'tg' ? 'Интихоб шуд:' : 'Выбрано:'} {selectedExecutors.length}
                                </p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label>{lang === 'tg' ? 'Гирандагон' : 'Получатели'}</Label>
                              {loadingDepartments ? (
                                <div className="text-sm text-muted-foreground">{lang === 'tg' ? 'Боргирӣ...' : 'Загрузка...'}</div>
                              ) : (
                                <div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const allDeptIds = departmentsList.map(dept => dept.id);
                                      if (selectedRecipients.length === allDeptIds.length) {
                                        setSelectedRecipients([]);
                                      } else {
                                        setSelectedRecipients(allDeptIds);
                                      }
                                    }}
                                    className="mb-2"
                                    data-testid="button-select-all-assignment-recipients"
                                  >
                                    {selectedRecipients.length === departmentsList.length
                                      ? (lang === 'tg' ? 'Бекор кардан' : 'Отменить все')
                                      : (lang === 'tg' ? 'Ҳамаро қайд кардан' : 'Выбрать все')}
                                  </Button>
                                  <div className="border rounded-md p-4 max-h-60 overflow-y-auto space-y-2">
                                    {departmentsList.map((dept: any) => (
                                      <div key={dept.id} className="flex items-center space-x-2">
                                        <Checkbox
                                          id={`assignment-recipient-${dept.id}`}
                                          checked={selectedRecipients.includes(dept.id)}
                                          onCheckedChange={(checked) => {
                                            if (checked) {
                                              setSelectedRecipients([...selectedRecipients, dept.id]);
                                            } else {
                                              setSelectedRecipients(selectedRecipients.filter(id => id !== dept.id));
                                            }
                                          }}
                                          data-testid={`checkbox-assignment-recipient-${dept.id}`}
                                        />
                                        <label htmlFor={`assignment-recipient-${dept.id}`} className="text-sm cursor-pointer">{dept.name}</label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {selectedRecipients.length > 0 && (
                                <p className="text-sm text-muted-foreground">
                                  {lang === 'tg' 
                                    ? `Интихоб шуд: ${selectedRecipients.length}` 
                                    : `Выбрано: ${selectedRecipients.length}`}
                                </p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label>{lang === 'tg' ? 'Мӯҳлати иҷро то:' : 'Срок выполнения'}</Label>
                              <DatePicker
                                value={assignmentDeadline}
                                onChange={setAssignmentDeadline}
                                placeholder={lang === 'tg' ? 'Санаро интихоб кунед' : 'Выберите дату'}
                                data-testid="datepicker-assignment-deadline"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>{lang === 'tg' ? 'Файлҳо' : 'Файлы'}</Label>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="default"
                                  onClick={() => document.getElementById('assignment-file-input-modal')?.click()}
                                  className="gap-2"
                                  data-testid="button-select-assignment-files"
                                >
                                  <Paperclip className="h-4 w-4" />
                                  {lang === 'tg' ? 'Интихоби файл' : 'Выбрать файл'}
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                  {assignmentFiles.length > 0 && `${assignmentFiles.length} ${lang === 'tg' ? 'файл' : 'файлов'}`}
                                </span>
                              </div>
                              <input
                                id="assignment-file-input-modal"
                                type="file"
                                multiple
                                accept="*/*"
                                className="hidden"
                                onChange={handleFileSelect}
                              />
                              {assignmentFiles.length > 0 && (
                                <div className="space-y-2 mt-2">
                                  {assignmentFiles.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                      <span className="text-sm truncate flex-1">{file.name}</span>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeFile(index)}
                                        className="h-6 w-6 p-0"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                              <Button variant="outline" onClick={() => setIsAssignmentDialogOpen(false)}>
                                {lang === 'tg' ? 'Бекор кардан' : 'Отмена'}
                              </Button>
                              <Button onClick={handleSubmitAssignment} disabled={createAssignmentMutation.isPending}>
                                {createAssignmentMutation.isPending
                                  ? (lang === 'tg' ? 'Эҷод шуда истодааст...' : 'Создание...')
                                  : (lang === 'tg' ? 'Эҷод кардан' : 'Создать')}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
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
