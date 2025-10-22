import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation, type Language } from '@/lib/i18n';
import { ArrowLeft, Leaf } from 'lucide-react';
import bgImage from '@assets/eco-background-light.webp';
import ObjectUploader from '@/components/ObjectUploader';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import type { Department } from '@shared/schema';

export default function ComposeMessage() {
  const [, setLocation] = useLocation();
  const [lang, setLang] = useState<Language>('tg');
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState('');
  const [recipient, setRecipient] = useState('');
  const [executor, setExecutor] = useState('');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Array<{ url: string; name: string }>>([]);
  const [isFileUploading, setIsFileUploading] = useState(false);
  const t = useTranslation(lang);
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: departments = [], isLoading: loadingDepartments } = useQuery<Omit<Department, 'accessCode'>[]>({
    queryKey: ['/api/departments/list'],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      return await apiRequest('POST', '/api/messages', messageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      toast({
        title: lang === 'tg' ? 'Муваффақият' : 'Успешно',
        description: lang === 'tg' ? 'Паём фиристода шуд' : 'Сообщение отправлено',
      });
      setLocation('/department/outbox');
    },
    onError: (error: any) => {
      toast({
        title: lang === 'tg' ? 'Хато' : 'Ошибка',
        description: error.message || (lang === 'tg' ? 'Хатогӣ ҳангоми фиристодани паём' : 'Ошибка при отправке сообщения'),
        variant: 'destructive',
      });
    },
  });

  const handleAllUploadsComplete = (files: Array<{ url: string; name: string }>) => {
    setAttachments(files);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isFileUploading) {
      toast({
        title: lang === 'tg' ? 'Хато' : 'Ошибка',
        description: lang === 'tg' ? 'Лутфан интизор шавед, файл бор мешавад' : 'Пожалуйста, подождите, файл загружается',
        variant: 'destructive',
      });
      return;
    }
    
    if (!user || user.userType !== 'department') {
      toast({
        title: lang === 'tg' ? 'Хато' : 'Ошибка',
        description: lang === 'tg' ? 'Шумо ворид нашудаед' : 'Вы не авторизованы',
        variant: 'destructive',
      });
      return;
    }

    const messageData = {
      subject,
      content,
      senderId: user.department.id,
      recipientId: parseInt(recipient),
      executor: executor || null,
      documentDate: new Date(date).toISOString(),
      attachments: attachments.length > 0 ? attachments : null,
      attachmentUrl: null,
      attachmentName: null,
      replyToId: null,
    };

    sendMessageMutation.mutate(messageData);
  };

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
                onClick={() => setLocation('/department/main')}
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
                  <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">{t.newMessage}</h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">ЭкоТочикистон</p>
                </div>
              </div>
            </div>
            <LanguageSwitcher currentLang={lang} onLanguageChange={setLang} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-3 py-4 sm:px-4 sm:py-8 md:px-6 lg:px-8 relative z-10">
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">{t.newMessage}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="subject">
                    {t.subject} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={t.enterSubject}
                    required
                    data-testid="input-subject"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">
                    {t.date} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    data-testid="input-date"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipient">
                  {t.recipient} <span className="text-destructive">*</span>
                </Label>
                <Select value={recipient} onValueChange={setRecipient} required disabled={loadingDepartments}>
                  <SelectTrigger id="recipient" data-testid="select-recipient">
                    <SelectValue placeholder={loadingDepartments ? (lang === 'tg' ? 'Боргирӣ...' : 'Загрузка...') : t.selectRecipient} />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="executor">{t.executorOptional}</Label>
                <Input
                  id="executor"
                  value={executor}
                  onChange={(e) => setExecutor(e.target.value)}
                  placeholder={lang === 'tg' ? 'Исм ва насаби иҷрокунанда' : 'ФИО исполнителя'}
                  data-testid="input-executor"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">
                  {t.content} <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t.enterContent}
                  rows={8}
                  required
                  data-testid="textarea-content"
                />
              </div>

              <div className="space-y-2">
                <Label>{t.attachFile}</Label>
                <ObjectUploader 
                  onAllUploadsComplete={handleAllUploadsComplete}
                  onUploadStatusChange={setIsFileUploading}
                  language={lang}
                  maxSizeMB={100}
                  maxFiles={5}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                <Button 
                  type="submit" 
                  data-testid="button-send" 
                  disabled={sendMessageMutation.isPending || isFileUploading}
                  className="w-full sm:w-auto"
                >
                  {isFileUploading
                    ? (lang === 'tg' ? 'Файл бор мешавад...' : 'Загрузка файла...') 
                    : sendMessageMutation.isPending 
                      ? (lang === 'tg' ? 'Фиристода мешавад...' : 'Отправка...') 
                      : t.send}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation('/department/main')}
                  data-testid="button-cancel"
                  disabled={sendMessageMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {t.cancel}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
