import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { useTranslation, type Language } from '@/lib/i18n';
import { ArrowLeft, Paperclip, X, LogOut } from 'lucide-react';
import bgImage from '@assets/eco-background-light.webp';
import logoImage from '@assets/logo-optimized.webp';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import type { Department } from '@shared/schema';
import { Footer } from '@/components/Footer';

export default function ComposeMessage() {
  
  const [, setLocation] = useLocation();
  const [lang, setLang] = useState<Language>('tg');
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);
  const [executor, setExecutor] = useState('');
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
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
    onSuccess: async (data: any) => {
      const messageId = data.id;
      
      // Upload files if any selected
      if (selectedFiles.length > 0) {
        setIsUploadingFiles(true);
        let uploadSuccess = true;
        let failedFiles: string[] = [];
        
        try {
          for (const file of selectedFiles) {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch(`/api/messages/${messageId}/attachments`, {
              method: 'POST',
              body: formData,
            });
            
            if (!response.ok) {
              uploadSuccess = false;
              failedFiles.push(file.name);
              console.error(`Failed to upload ${file.name}:`, response.status, await response.text());
            }
          }
        } catch (error) {
          console.error('Failed to upload files:', error);
          uploadSuccess = false;
        } finally {
          setIsUploadingFiles(false);
        }
        
        if (!uploadSuccess) {
          // Redirect to message view where user can upload files via ObjectUploader
          queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
          toast({
            title: lang === 'tg' ? 'Огоҳӣ' : 'Предупреждение',
            description: failedFiles.length > 0 
              ? (lang === 'tg' 
                  ? `Паём фиристода шуд, вале файлҳо бор нашуданд: ${failedFiles.join(', ')}. Шумо метавонед онҳоро дар саҳифаи паём илова кунед.` 
                  : `Сообщение отправлено, но файлы не загружены: ${failedFiles.join(', ')}. Вы можете добавить их на странице сообщения.`)
              : (lang === 'tg' 
                  ? 'Паём фиристода шуд, вале файлҳо бор нашуданд. Шумо метавонед онҳоро дар саҳифаи паём илова кунед.' 
                  : 'Сообщение отправлено, но файлы не загружены. Вы можете добавить их на странице сообщения.'),
            variant: 'destructive',
          });
          // Redirect to message view where files can be uploaded
          setLocation(`/department/message/${messageId}`);
          return;
        }
      }
      
      // Success - clear state and redirect
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      setSelectedFiles([]); // Clear files only on success
      toast({
        title: lang === 'tg' ? 'Муваффақият' : 'Успешно',
        description: selectedFiles.length > 0 
          ? (lang === 'tg' ? 'Паём ва файлҳо фиристода шуданд' : 'Сообщение и файлы отправлены')
          : (lang === 'tg' ? 'Паём фиристода шуд' : 'Сообщение отправлено'),
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || user.userType !== 'department') {
      toast({
        title: lang === 'tg' ? 'Хато' : 'Ошибка',
        description: lang === 'tg' ? 'Шумо ворид нашудаед' : 'Вы не авторизованы',
        variant: 'destructive',
      });
      return;
    }

    // Validate that at least one recipient is selected
    if (selectedRecipients.length === 0) {
      toast({
        title: lang === 'tg' ? 'Хато' : 'Ошибка',
        description: lang === 'tg' ? 'Ҳадди ақал як гиранда интихоб кунед' : 'Выберите хотя бы одного получателя',
        variant: 'destructive',
      });
      return;
    }

    // Create messages for all selected recipients
    setIsUploadingFiles(true);
    try {
      const createdMessageIds: number[] = [];
      
      // Step 1: Create all messages
      for (const recipientId of selectedRecipients) {
        const messageData = {
          subject,
          content,
          senderId: user.department.id,
          recipientId: recipientId,
          executor: executor || null,
          documentDate: new Date(date).toISOString(),
          replyToId: null,
        };

        const response = await apiRequest('POST', '/api/messages', messageData);
        createdMessageIds.push(response.id);
      }

      // Step 2: Upload files to all created messages
      if (selectedFiles.length > 0) {
        let uploadSuccess = true;
        let failedFiles: string[] = [];
        
        for (const messageId of createdMessageIds) {
          for (const file of selectedFiles) {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch(`/api/messages/${messageId}/attachments`, {
              method: 'POST',
              body: formData,
            });
            
            if (!response.ok) {
              uploadSuccess = false;
              failedFiles.push(file.name);
              console.error(`Failed to upload ${file.name} to message ${messageId}:`, response.status, await response.text());
            }
          }
        }
        
        if (!uploadSuccess) {
          toast({
            title: lang === 'tg' ? 'Огоҳӣ' : 'Предупреждение',
            description: lang === 'tg' 
              ? `Паёмҳо фиристода шуданд, вале баъзе файлҳо бор нашуданд: ${failedFiles.join(', ')}` 
              : `Сообщения отправлены, но некоторые файлы не загружены: ${failedFiles.join(', ')}`,
            variant: 'destructive',
          });
        } else {
          toast({
            title: lang === 'tg' ? 'Муваффақият' : 'Успешно',
            description: lang === 'tg' 
              ? `${selectedRecipients.length} паём ва файлҳо фиристода шуданд` 
              : `${selectedRecipients.length} сообщений и файлы отправлены`,
          });
        }
      } else {
        toast({
          title: lang === 'tg' ? 'Муваффақият' : 'Успешно',
          description: lang === 'tg' 
            ? `${selectedRecipients.length} паём фиристода шуд` 
            : `${selectedRecipients.length} сообщений отправлено`,
        });
      }

      // Step 3: Clear form and redirect
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      setSubject('');
      setContent('');
      setSelectedRecipients([]);
      setExecutor('');
      setDate('');
      setSelectedFiles([]);
      setLocation('/department/outbox');
    } catch (error: any) {
      toast({
        title: lang === 'tg' ? 'Хато' : 'Ошибка',
        description: error.message || (lang === 'tg' ? 'Хатогӣ ҳангоми фиристодани паёмҳо' : 'Ошибка при отправке сообщений'),
        variant: 'destructive',
      });
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const fileArray = Array.from(files);
    const maxSize = 100 * 1024 * 1024; // 100MB in bytes
    
    // Check file size
    for (const file of fileArray) {
      if (file.size > maxSize) {
        toast({
          title: lang === 'tg' ? 'Хато' : 'Ошибка',
          description: lang === 'tg' ? `Файл ${file.name} аз 100МБ калонтар аст` : `Файл ${file.name} превышает 100МБ`,
          variant: 'destructive',
        });
        return;
      }
    }
    
    // Check total files
    const newFiles = [...selectedFiles, ...fileArray];
    if (newFiles.length > 5) {
      toast({
        title: lang === 'tg' ? 'Хато' : 'Ошибка',
        description: lang === 'tg' ? 'Шумо наметавонед зиёда аз 5 файл илова кунед' : 'Вы не можете добавить более 5 файлов',
        variant: 'destructive',
      });
      return;
    }
    
    setSelectedFiles(newFiles);
    // Reset input
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  return (
    <div 
      style={{ 
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.92)), url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <header 
        className="border-b border-border/20 backdrop-blur-md"
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
                onClick={() => setLocation('/department/main')}
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
                <img src={logoImage} alt="Логотип" className="h-10 w-10 object-contain shrink-0 drop-shadow-md" />
                <div className="min-w-0 text-left">
                  <h1 className="text-base sm:text-lg font-semibold text-white drop-shadow-md truncate">{t.newMessage}</h1>
                  <p className="text-xs text-white/90 drop-shadow-sm truncate">Портали электронӣ</p>
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

      <main className="mx-auto max-w-4xl w-full px-3 pt-6 pb-0 sm:px-4 md:px-6 lg:px-8">
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
                  <div className="flex gap-2">
                    <DatePicker
                      id="date"
                      value={date}
                      onChange={(value) => setDate(value)}
                      placeholder={lang === 'tg' ? 'Санаро интихоб кунед' : 'Выберите дату'}
                      required
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="default"
                      onClick={() => {
                        const today = new Date();
                        const year = today.getFullYear();
                        const month = String(today.getMonth() + 1).padStart(2, "0");
                        const day = String(today.getDate()).padStart(2, "0");
                        setDate(`${year}-${month}-${day}`);
                      }}
                      className="shrink-0"
                      data-testid="button-today"
                    >
                      {lang === 'tg' ? 'Имрӯз' : 'Сегодня'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>
                    {t.recipient} <span className="text-destructive">*</span>
                  </Label>
                  {!loadingDepartments && departments.filter(dept => dept.id !== (user?.userType === 'department' ? user.department?.id : undefined)).length > 0 && (
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => {
                        const allDeptIds = departments
                          .filter(dept => dept.id !== (user?.userType === 'department' ? user.department?.id : undefined))
                          .map(dept => dept.id);
                        if (selectedRecipients.length === allDeptIds.length) {
                          setSelectedRecipients([]);
                        } else {
                          setSelectedRecipients(allDeptIds);
                        }
                      }}
                      className="h-8 text-xs"
                      data-testid="button-select-all-recipients"
                    >
                      {selectedRecipients.length === departments.filter(dept => dept.id !== (user?.userType === 'department' ? user.department?.id : undefined)).length
                        ? (lang === 'tg' ? 'Бекор кардан' : 'Отменить все')
                        : (lang === 'tg' ? 'Ҳамаро қайд кардан' : 'Выбрать все')}
                    </Button>
                  )}
                </div>
                {loadingDepartments ? (
                  <p className="text-sm text-muted-foreground">
                    {lang === 'tg' ? 'Боргирӣ...' : 'Загрузка...'}
                  </p>
                ) : (
                  <div className="border rounded-md p-4 space-y-3 max-h-64 overflow-y-auto">
                    {departments.filter(dept => dept.id !== (user?.userType === 'department' ? user.department?.id : undefined)).map((dept) => (
                      <div key={dept.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`recipient-${dept.id}`}
                          checked={selectedRecipients.includes(dept.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedRecipients([...selectedRecipients, dept.id]);
                            } else {
                              setSelectedRecipients(selectedRecipients.filter(id => id !== dept.id));
                            }
                          }}
                          data-testid={`checkbox-recipient-${dept.id}`}
                        />
                        <label
                          htmlFor={`recipient-${dept.id}`}
                          className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {dept.name}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
                {selectedRecipients.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {lang === 'tg' 
                      ? `Интихоб шуд: ${selectedRecipients.length}` 
                      : `Выбрано: ${selectedRecipients.length}`}
                  </p>
                )}
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
                <Label>{lang === 'tg' ? 'Илова кардани файл (то 5 адад, 100МБ ҳар як)' : 'Прикрепить файлы (до 5 шт, 100МБ каждый)'}</Label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      id="files"
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      disabled={selectedFiles.length >= 5 || sendMessageMutation.isPending || isUploadingFiles}
                      data-testid="input-files"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('files')?.click()}
                      disabled={selectedFiles.length >= 5 || sendMessageMutation.isPending || isUploadingFiles}
                      className="gap-2"
                    >
                      <Paperclip className="h-4 w-4" />
                      {lang === 'tg' ? 'Интихоб кардани файлҳо' : 'Выбрать файлы'}
                    </Button>
                    {selectedFiles.length > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {lang === 'tg' ? 'Файлҳои интихобшуда' : 'Выбрано файлов'}: {selectedFiles.length}/5
                      </span>
                    )}
                  </div>
                  {selectedFiles.length > 0 && (
                    <div className="space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-3 rounded-md border border-border bg-muted/30 p-3">
                          <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate" data-testid={`text-selected-file-${index}`}>
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(2)} МБ
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            data-testid={`button-remove-file-${index}`}
                            disabled={sendMessageMutation.isPending || isUploadingFiles}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                <Button 
                  type="submit" 
                  data-testid="button-send" 
                  disabled={sendMessageMutation.isPending || isUploadingFiles}
                  className="w-full sm:w-auto"
                >
                  {isUploadingFiles 
                    ? (lang === 'tg' ? 'Файлҳо бор мешаванд...' : 'Загрузка файлов...') 
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
      <Footer />
    </div>
    
  
  );
}
