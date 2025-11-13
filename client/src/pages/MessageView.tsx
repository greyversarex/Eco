import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { t } from '@/lib/i18n';
import { ArrowLeft, Download, Reply, Paperclip, Leaf, Trash2, LogOut, FileText, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import type { Message, Department, Person } from '@shared/schema';
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

const formatDateTajik = (date: Date) => {
  const monthsTajik = [
    'январ', 'феврал', 'март', 'апрел', 'май', 'июн',
    'июл', 'август', 'сентябр', 'октябр', 'ноябр', 'декабр'
  ];
  
  const day = date.getDate();
  const month = monthsTajik[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day} ${month} ${year}`;
};

export default function MessageView() {
  const { id } = useParams();
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Assignment modal state
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);
  const [assignmentTopic, setAssignmentTopic] = useState('');
  const [assignmentContent, setAssignmentContent] = useState('');
  const [assignmentDocNumber, setAssignmentDocNumber] = useState('');
  const [selectedExecutorIds, setSelectedExecutorIds] = useState<number[]>([]);
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

  // Load department list for all purposes (sender name, recipients, etc.)
  const { data: departments = [], isLoading: loadingDepartments } = useQuery<any[]>({
    queryKey: ['/api/departments/list'],
  });

  const { data: allPeople = [] } = useQuery<Person[]>({
    queryKey: ['/api/people'],
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
        title: 'Хато',
        description: 'Хатогӣ ҳангоми навсозии ҳолат',
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
        title: 'Муваффақият',
        description: 'Ҳуҷҷат бекор карда шуд',
      });
      // Invalidate queries and go back to appropriate list
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/unread/count'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages/unread/by-department'] });
      setLocation(backLocation);
    },
    onError: (error: any) => {
      toast({
        title: 'Хато',
        description: error.message || 'Хатогӣ ҳангоми несткунии ҳуҷҷат',
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
        title: 'Муваффақият',
        description: 'Супориш эҷод шуд',
      });
      setIsAssignmentDialogOpen(false);
      // Clear form
      setAssignmentTopic('');
      setAssignmentContent('');
      setAssignmentDocNumber('');
      setSelectedExecutorIds([]);
      setSelectedRecipients([]);
      setAssignmentDeadline('');
      setAssignmentFiles([]);
    },
    onError: (error: any) => {
      toast({
        title: 'Хато',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleDelete = () => {
    if (!id) return;
    
    // Confirm deletion
    const confirmed = window.confirm(
      'Шумо мутмаин ҳастед, ки мехоҳед ин ҳуҷҷатро бекор кунед?'
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
        title: 'Хато',
        description: 'Хатогӣ ҳангоми боргирӣ',
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
          title: 'Хато',
          description: 'Шумо танҳо то 5 файл метавонед илова кунед',
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
        title: 'Хато',
        description: 'Мавзӯъро интихоб кунед',
        variant: 'destructive',
      });
      return;
    }
    if (selectedRecipients.length === 0) {
      toast({
        title: 'Хато',
        description: 'Ҳадди ақал як қабулкунанда интихоб кунед',
        variant: 'destructive',
      });
      return;
    }
    if (selectedExecutorIds.length === 0) {
      toast({
        title: 'Хато',
        description: 'Иҷрокунандагонро интихоб кунед',
        variant: 'destructive',
      });
      return;
    }
    if (!assignmentDeadline) {
      toast({
        title: 'Хато',
        description: 'Мӯҳлати иҷроро муайян кунед',
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
    formData.append('executorIds', JSON.stringify(selectedExecutorIds));
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
        <div className="mx-auto max-w-6xl px-3 sm:px-4 md:px-6 lg:px-8">
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
                <span>Баромад</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-6xl mx-auto px-3 py-4 sm:px-4 sm:py-8 md:px-6 lg:px-8 relative z-10">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Боргирӣ...</p>
            </div>
          </div>
        ) : !message ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">
              Паём ёфт нашуд
            </p>
          </Card>
        ) : (
          <div className="w-full space-y-4">
            {originalMessage && (
              <Card className="w-full bg-white dark:bg-slate-900" data-testid="original-message">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Reply className="h-4 w-4" />
                    <span>Ҷавоб ба паём</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-foreground" data-testid="original-subject">{originalMessage.subject}</h3>
                    <div className="text-sm text-muted-foreground mt-1">
                      <span className="font-medium">{t.sender}:</span> {getSenderName(originalMessage.senderId)}
                      {' • '}
                      <span>{formatDateTajik(new Date(originalMessage.documentDate))}</span>
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
                          ? 'Бекор шуда истодааст...'
                          : 'Бекор кардан'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-8 space-y-6 px-0">
                <div data-testid="text-content" className="px-6">
                  <div className="whitespace-pre-line text-lg leading-relaxed text-foreground">
                    {message.content}
                  </div>
                </div>

                <div className="space-y-3 text-base border-t pt-6 px-6">
                  {message.documentNumber && (
                    <div data-testid="text-document-number">
                      <span className="font-medium text-[#050505]">Рақами ҳуҷҷат:</span>
                      <span className="ml-2 text-foreground">{message.documentNumber}</span>
                    </div>
                  )}
                  <div data-testid="text-date">
                    <span className="font-medium text-[#000000]">Сана:</span>
                    <span className="ml-2 text-foreground">{formatDateTajik(new Date(message.documentDate))}</span>
                  </div>
                  <div data-testid="text-sender" className="space-y-1">
                    <div className="text-foreground">
                      <span className="font-medium text-[#000000]">Фиристанда:</span> {getSenderName(message.senderId)}
                    </div>
                  </div>
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-4 pt-4 border-t px-6">
                    <h3 className="text-xl font-semibold text-foreground">
                      Замимашудаҳо ({attachments.length})
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
                  <div className="pt-4 border-t flex justify-between gap-3 px-6">
                    <Button onClick={handleReply} data-testid="button-reply" className="gap-2" size="lg">
                      <Reply className="h-4 w-4" />
                      {t.reply}
                    </Button>
                    {user.department?.canCreateAssignmentFromMessage && (
                      <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
                        <DialogTrigger asChild>
                          <Button onClick={openAssignmentDialog} data-testid="button-create-assignment" className="gap-2 bg-green-600 hover:bg-green-700 text-white" size="lg">
                            <FileText className="h-4 w-4" />
                            Вазифагузорӣ
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Супориш</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label>Мавзӯъ</Label>
                              <Input
                                value={assignmentTopic}
                                onChange={(e) => setAssignmentTopic(e.target.value)}
                                placeholder="Мавзӯъи супориш"
                                data-testid="input-assignment-topic"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Мазмун</Label>
                              <Textarea
                                value={assignmentContent}
                                onChange={(e) => setAssignmentContent(e.target.value)}
                                placeholder="Шарҳи иловагӣ..."
                                className="min-h-[120px]"
                                data-testid="textarea-assignment-content"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="assignment-doc-number">
                                Рақами ҳуҷҷат
                              </Label>
                              <Input
                                id="assignment-doc-number"
                                value={assignmentDocNumber}
                                onChange={(e) => setAssignmentDocNumber(e.target.value)}
                                placeholder="Рақами ҳуҷҷат"
                                data-testid="input-assignment-doc-number"
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between mb-2">
                                <Label>Қабулкунандагон</Label>
                                {!loadingDepartments && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => {
                                      const allDeptIds = departments.map(dept => dept.id);
                                      if (selectedRecipients.length === allDeptIds.length) {
                                        setSelectedRecipients([]);
                                      } else {
                                        setSelectedRecipients(allDeptIds);
                                      }
                                    }}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    data-testid="button-select-all-recipients"
                                  >
                                    {selectedRecipients.length === departments.length
                                      ? 'Бекор кардан'
                                      : 'Ҳамаро қайд кардан'}
                                  </Button>
                                )}
                              </div>
                              {loadingDepartments ? (
                                <div className="text-sm text-muted-foreground">Боргирӣ...</div>
                              ) : (
                                <div>
                                  <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {departments
                                        .sort((a: any, b: any) => a.sortOrder - b.sortOrder)
                                        .map((dept: any) => (
                                          <div key={dept.id} className="flex items-center space-x-2">
                                            <Checkbox
                                              id={`recipient-${dept.id}`}
                                              checked={selectedRecipients.includes(dept.id)}
                                              onCheckedChange={(checked) => {
                                                if (checked) {
                                                  setSelectedRecipients([...selectedRecipients, dept.id]);
                                                } else {
                                                  setSelectedRecipients(selectedRecipients.filter(id => id !== dept.id));
                                                  const deptPeopleIds = allPeople.filter(p => p.departmentId === dept.id).map(p => p.id);
                                                  setSelectedExecutorIds(selectedExecutorIds.filter(id => !deptPeopleIds.includes(id)));
                                                }
                                              }}
                                              data-testid={`checkbox-recipient-${dept.id}`}
                                            />
                                            <label htmlFor={`recipient-${dept.id}`} className="text-sm cursor-pointer">{dept.name}</label>
                                          </div>
                                        ))
                                      }
                                    </div>
                                  </div>
                                </div>
                              )}
                              {selectedRecipients.length > 0 && (
                                <p className="text-sm text-muted-foreground">
                                  Интихоб шуд: {selectedRecipients.length}
                                </p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label>Иҷрокунандагон</Label>
                                {selectedExecutorIds.length > 0 && (
                                  <span className="text-xs text-muted-foreground">
                                    Интихоб шуд: {selectedExecutorIds.length}
                                  </span>
                                )}
                              </div>
                              {selectedRecipients.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                  Аввал қабулкунандаро интихоб кунед
                                </p>
                              ) : (
                                <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                                  {selectedRecipients.map(recipientId => {
                                    const dept = departments.find(d => d.id === recipientId);
                                    const peopleInDept = allPeople.filter(p => p.departmentId === recipientId);
                                    
                                    if (peopleInDept.length === 0) return null;
                                    
                                    return (
                                      <div key={recipientId} className="mb-4 last:mb-0">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="text-sm font-semibold text-gray-700">
                                            {dept?.name || 'Номаълум'}
                                          </div>
                                          {peopleInDept.length > 1 && (
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => {
                                                const deptPeopleIds = peopleInDept.map(p => p.id);
                                                const allSelected = deptPeopleIds.every(id => selectedExecutorIds.includes(id));
                                                if (allSelected) {
                                                  setSelectedExecutorIds(selectedExecutorIds.filter(id => !deptPeopleIds.includes(id)));
                                                } else {
                                                  setSelectedExecutorIds(Array.from(new Set([...selectedExecutorIds, ...deptPeopleIds])));
                                                }
                                              }}
                                              className="text-xs h-7"
                                            >
                                              {peopleInDept.every(p => selectedExecutorIds.includes(p.id)) ? 'Бекор кардан' : 'Ҳамаро интихоб'}
                                            </Button>
                                          )}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-2">
                                          {peopleInDept.map(person => (
                                            <div key={person.id} className="flex items-center space-x-2">
                                              <Checkbox
                                                id={`executor-${person.id}`}
                                                checked={selectedExecutorIds.includes(person.id)}
                                                onCheckedChange={(checked) => {
                                                  if (checked) {
                                                    setSelectedExecutorIds([...selectedExecutorIds, person.id]);
                                                  } else {
                                                    setSelectedExecutorIds(selectedExecutorIds.filter(id => id !== person.id));
                                                  }
                                                }}
                                                data-testid={`checkbox-executor-${person.id}`}
                                              />
                                              <label htmlFor={`executor-${person.id}`} className="text-sm cursor-pointer flex items-center gap-1.5">
                                                {person.name}
                                                {selectedExecutorIds.includes(person.id) && (
                                                  <span className="text-xs text-muted-foreground opacity-70">даъват</span>
                                                )}
                                              </label>
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
                              <Label>Мӯҳлати иҷро то:</Label>
                              <DatePicker
                                value={assignmentDeadline}
                                onChange={setAssignmentDeadline}
                                placeholder="Санаро интихоб кунед"
                                data-testid="datepicker-assignment-deadline"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Файлҳо</Label>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="default"
                                  onClick={() => document.getElementById('assignment-file-input-modal')?.click()}
                                  className="gap-2"
                                  data-testid="button-select-assignment-files"
                                >
                                  <Paperclip className="h-4 w-4" />
                                  Интихоби файл
                                </Button>
                                <span className="text-sm text-muted-foreground">
                                  {assignmentFiles.length > 0 && `${assignmentFiles.length} файл`}
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
                                Бекор кардан
                              </Button>
                              <Button onClick={handleSubmitAssignment} disabled={createAssignmentMutation.isPending}>
                                {createAssignmentMutation.isPending
                                  ? 'Эҷод шуда истодааст...'
                                  : 'Эҷод кардан'}
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
