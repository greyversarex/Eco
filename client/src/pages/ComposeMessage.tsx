import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { t } from '@/lib/i18n';
import { ArrowLeft, Paperclip, X, LogOut, Save } from 'lucide-react';
import bgImage from '@assets/eco-background-light.webp';
import logoImage from '@assets/logo-optimized.webp';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { apiFetch } from '@/lib/api-config';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import type { Department, Person } from '@shared/schema';
import { Footer } from '@/components/Footer';
import { PageHeader, PageHeaderContainer, PageHeaderLeft, PageHeaderRight } from '@/components/PageHeader';
import { useOnlineStatus } from '@/hooks/use-offline';
import { useDrafts } from '@/hooks/use-drafts';
import { OfflineIndicator } from '@/components/offline-indicator';

export default function ComposeMessage() {
  
  const [, setLocation] = useLocation();
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const isOnline = useOnlineStatus();
  const { saveDraft } = useDrafts();

  const { data: departments = [], isLoading: loadingDepartments, dataUpdatedAt } = useQuery<Omit<Department, 'accessCode'>[]>({
    queryKey: ['/api/departments/list'],
  });

  const { data: allPeople = [] } = useQuery<Person[]>({
    queryKey: ['/api/people'],
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
            
            const response = await apiFetch(`/api/messages/${messageId}/attachments`, {
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
            title: 'Огоҳӣ',
            description: failedFiles.length > 0 
              ? `Паём фиристода шуд, вале файлҳо бор нашуданд: ${failedFiles.join(', ')}. Шумо метавонед онҳоро дар саҳифаи паём илова кунед.` 
              : 'Паём фиристода шуд, вале файлҳо бор нашуданд. Шумо метавонед онҳоро дар саҳифаи паём илова кунед.',
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
        title: 'Муваффақият',
        description: selectedFiles.length > 0 
          ? 'Паём ва файлҳо фиристода шуданд'
          : 'Паём фиристода шуд',
      });
      setLocation('/department/outbox');
    },
    onError: (error: any) => {
      toast({
        title: 'Хато',
        description: error.message || 'Хатогӣ ҳангоми фиристодани паём',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || user.userType !== 'department') {
      toast({
        title: 'Хато',
        description: 'Шумо ворид нашудаед',
        variant: 'destructive',
      });
      return;
    }

    // Validate required fields
    if (!subject.trim()) {
      toast({
        title: 'Хато',
        description: 'Мавзуъро ворид кунед',
        variant: 'destructive',
      });
      return;
    }

    if (!date) {
      toast({
        title: 'Хато',
        description: 'Санаро интихоб кунед',
        variant: 'destructive',
      });
      return;
    }

    // Validate that at least one recipient is selected
    if (selectedRecipients.length === 0) {
      toast({
        title: 'Хато',
        description: 'Ҳадди ақал як гиранда интихоб кунед',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingFiles(true);
    try {
      // Use optimized broadcast endpoint for multiple recipients
      if (selectedRecipients.length > 1) {
        const formData = new FormData();
        formData.append('recipientIds', JSON.stringify(selectedRecipients));
        formData.append('subject', subject);
        formData.append('content', content);
        formData.append('documentNumber', documentNumber || '');
        formData.append('senderId', user.department.id.toString());
        formData.append('documentDate', new Date(date).toISOString());
        
        // Attach all files
        selectedFiles.forEach(file => {
          formData.append('files', file);
        });

        const response = await apiFetch('/api/messages/broadcast', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to send messages');
        }

        const result = await response.json();
        
        toast({
          title: 'Муваффақият',
          description: `${result.messagesCreated} паём${selectedFiles.length > 0 ? ' ва файлҳо' : ''} фиристода ${selectedFiles.length > 0 ? 'шуданд' : 'шуд'}`,
        });
      } else {
        // Single recipient - use original endpoint
        const messageData = {
          subject,
          content,
          documentNumber: documentNumber || null,
          senderId: user.department.id,
          recipientId: selectedRecipients[0],
          documentDate: new Date(date).toISOString(),
          replyToId: null,
        };

        const message = await apiRequest('POST', '/api/messages', messageData);

        // Upload files if any
        if (selectedFiles.length > 0) {
          let uploadSuccess = true;
          let failedFiles: string[] = [];
          
          for (const file of selectedFiles) {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await apiFetch(`/api/messages/${message.id}/attachments`, {
              method: 'POST',
              body: formData,
            });
            
            if (!response.ok) {
              uploadSuccess = false;
              failedFiles.push(file.name);
            }
          }
          
          if (!uploadSuccess) {
            toast({
              title: 'Огоҳӣ',
              description: 'Паём фиристода шуд, вале баъзе файлҳо бор нашуданд',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Муваффақият',
              description: 'Паём ва файлҳо фиристода шуданд',
            });
          }
        } else {
          toast({
            title: 'Муваффақият',
            description: 'Паём фиристода шуд',
          });
        }
      }

      // Clear form and redirect
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      setSubject('');
      setContent('');
      setDocumentNumber('');
      setSelectedRecipients([]);
      setDate('');
      setSelectedFiles([]);
      setLocation('/department/outbox');
    } catch (error: any) {
      toast({
        title: 'Хато',
        description: error.message || 'Хатогӣ ҳангоми фиристодани паёмҳо',
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
          title: 'Хато',
          description: `Файл ${file.name} аз 100МБ калонтар аст`,
          variant: 'destructive',
        });
        return;
      }
    }
    
    // Check total files
    const newFiles = [...selectedFiles, ...fileArray];
    if (newFiles.length > 5) {
      toast({
        title: 'Хато',
        description: 'Шумо наметавонед зиёда аз 5 файл илова кунед',
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

  const handleSaveDraft = async () => {
    // Validate required fields
    if (!subject.trim()) {
      toast({
        title: 'Хато',
        description: 'Мавзуъро ворид кунед',
        variant: 'destructive',
      });
      return;
    }

    if (selectedRecipients.length === 0) {
      toast({
        title: 'Хато',
        description: 'Ҳадди ақал як гиранда интихоб кунед',
        variant: 'destructive',
      });
      return;
    }

    try {
      await saveDraft({
        subject,
        content,
        recipientIds: selectedRecipients,
        documentNumber: documentNumber || undefined,
        attachments: selectedFiles.length > 0 ? selectedFiles : undefined,
      });

      // Clear form
      setSubject('');
      setContent('');
      setDocumentNumber('');
      setSelectedRecipients([]);
      setDate('');
      setSelectedFiles([]);

      // Redirect to drafts page
      setLocation('/department/drafts');
    } catch (error) {
      // Error already shown in useDrafts hook
      console.error('Failed to save draft:', error);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ 
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.92), rgba(255, 255, 255, 0.92)), url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <PageHeader variant="department">
        <PageHeaderContainer className="px-3 sm:px-4 md:px-6 lg:px-8">
          <PageHeaderLeft className="gap-2 sm:gap-4 min-w-0 flex-1">
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
                <p className="text-xs text-white/90 drop-shadow-sm truncate">EcoDoc - Портали электронӣ</p>
              </div>
            </button>
          </PageHeaderLeft>
          <PageHeaderRight className="gap-2">
            <OfflineIndicator />
            <Button
              size="sm"
              onClick={() => {
                apiFetch('/api/auth/logout', { method: 'POST' })
                  .then(() => setLocation('/'));
              }}
              data-testid="button-logout"
              className="flex items-center gap-2 bg-red-500/90 hover:bg-red-600 text-white border-0 font-medium shadow-md"
            >
              <LogOut className="h-4 w-4" />
              <span>Баромад</span>
            </Button>
          </PageHeaderRight>
        </PageHeaderContainer>
      </PageHeader>

      <main className="flex-1 mx-auto max-w-4xl w-full px-3 py-6 sm:px-4 md:px-6 lg:px-8">
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">{t.newMessage}</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="subject">
                  {t.subject} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={t.enterSubject}
                  data-testid="input-subject"
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="documentNumber">
                    Рақами ҳуҷҷат
                  </Label>
                  <Input
                    id="documentNumber"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="Рақами ҳуҷҷат"
                    data-testid="input-document-number"
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
                      placeholder="Санаро интихоб кунед"
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
                      Имрӯз
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
                      className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
                      data-testid="button-select-all-recipients"
                    >
                      {selectedRecipients.length === departments.filter(dept => dept.id !== (user?.userType === 'department' ? user.department?.id : undefined)).length
                        ? 'Бекор кардан'
                        : 'Ҳамаро қайд кардан'}
                    </Button>
                  )}
                </div>
                {loadingDepartments ? (
                  <p className="text-sm text-muted-foreground">
                    Боргирӣ...
                  </p>
                ) : (
                  <div className="border rounded-md p-4 max-h-96 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {departments
                        .filter(dept => dept.id !== (user?.userType === 'department' ? user.department?.id : undefined))
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                        .map((dept) => (
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
                        ))
                      }
                    </div>
                  </div>
                )}
                {selectedRecipients.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Интихоб шуд: {selectedRecipients.length}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Иҷрокунандагон</Label>
                {selectedRecipients.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Аввал иҷрокунанда интихоб кунед
                  </p>
                ) : (
                  <div className="border rounded-md p-4 max-h-64 overflow-y-auto">
                    {selectedRecipients.map(recipientId => {
                      const dept = departments.find(d => d.id === recipientId);
                      const peopleInDept = allPeople.filter(p => p.departmentId === recipientId);
                      
                      if (peopleInDept.length === 0) return null;
                      
                      return (
                        <div key={recipientId} className="mb-4 last:mb-0">
                          <div className="text-sm font-semibold mb-2 text-gray-700">
                            {dept?.name || 'Номаълум'}
                          </div>
                          <div className="grid grid-cols-2 gap-2 pl-2">
                            {peopleInDept.map(person => (
                              <div key={person.id} className="text-sm">
                                • {person.name}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {allPeople.filter(p => p.departmentId !== null && selectedRecipients.includes(p.departmentId)).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Иҷрокунандае дар ин шуъбаҳо нест
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">
                  {t.content}
                </Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t.enterContent}
                  rows={8}
                  data-testid="textarea-content"
                />
              </div>

              <div className="space-y-2">
                <Label>Илова кардани файл</Label>
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
                      variant="default"
                      size="sm"
                      onClick={() => document.getElementById('files')?.click()}
                      disabled={selectedFiles.length >= 5 || sendMessageMutation.isPending || isUploadingFiles}
                      className="gap-2"
                    >
                      <Paperclip className="h-4 w-4" />
                      Интихоб кардани файлҳо
                    </Button>
                    {selectedFiles.length > 0 && (
                      <span className="text-sm text-muted-foreground">
                        Файлҳои интихобшуда: {selectedFiles.length}/5
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

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:justify-end">
                <Button 
                  type="button"
                  onClick={handleSaveDraft}
                  size="icon"
                  data-testid="button-save-draft" 
                  className="bg-green-600 hover:bg-green-700 text-white border-0"
                  title="Нигоҳ доштани лоиҳа"
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button 
                  type="submit" 
                  data-testid="button-send" 
                  disabled={sendMessageMutation.isPending || isUploadingFiles || !isOnline}
                  className="w-full sm:w-auto"
                >
                  {!isOnline 
                    ? 'Офлайн'
                    : isUploadingFiles 
                      ? 'Файлҳо бор мешаванд...' 
                      : sendMessageMutation.isPending 
                        ? 'Фиристода мешавад...'
                        : t.send}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
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
