import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { t } from '@/lib/i18n';
import { ArrowLeft, Plus, LogOut, Download, Paperclip, X, Trash2, CalendarDays, Clock, CheckCircle2, MessageSquare, Check, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { DocumentEditor } from '@/components/DocumentEditor';
import DOMPurify from 'isomorphic-dompurify';
import bgImage from '@assets/eco-background-light.webp';
import logoImage from '@assets/logo-optimized.webp';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { apiFetch } from '@/lib/api-config';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import type { Assignment, Person, Department, DocumentType, DocumentTemplate } from '@shared/schema';
import { Footer } from '@/components/Footer';
import { DatePicker } from '@/components/ui/date-picker';
import { PageHeader, PageHeaderContainer, PageHeaderLeft, PageHeaderRight } from '@/components/PageHeader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ComposeMessageModal } from '@/components/ComposeMessageModal';

// Progress indicator component with segmented daily view
function AssignmentProgress({ createdAt, deadline, isCompleted }: { createdAt: Date; deadline: Date; isCompleted: boolean }) {
  const now = new Date();
  
  // Normalize dates to start of day for accurate day counting
  const startDate = new Date(createdAt);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(deadline);
  endDate.setHours(0, 0, 0, 0);
  
  const currentDate = new Date(now);
  currentDate.setHours(0, 0, 0, 0);
  
  // Calculate total days between creation and deadline
  const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  
  // Calculate days passed and days left
  const daysPassed = Math.max(0, Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)));
  
  const isOverdue = currentDate > endDate && !isCompleted;

  const formatDate = (date: Date) => {
    const monthsTajik = [
      'январ', 'феврал', 'март', 'апрел', 'май', 'июн',
      'июл', 'август', 'сентябр', 'октябр', 'ноябр', 'декабр'
    ];
    const day = date.getDate();
    const month = monthsTajik[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Calculate progress percentage (0-100)
  const progressPercent = isCompleted ? 100 : Math.min(100, (daysPassed / totalDays) * 100);

  return (
    <div className="space-y-2 pt-[0px] pb-[0px] mt-[9px] mb-[9px]">
      <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
        <div>
          <div className="text-sm text-muted-foreground font-bold mb-1.5">Мӯҳлати иҷро:</div>
          <div className="px-4 py-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-md hover:shadow-lg transition-all duration-200 inline-flex items-center gap-2.5 mt-[0px] mb-[0px] ml-[0px] mr-[0px] pl-[16px] pr-[16px] pt-[7px] pb-[7px]">
            <CalendarDays className="w-4 h-4 text-white" />
            <div className="text-sm font-semibold text-white">{formatDate(deadline)}</div>
          </div>
        </div>
        
        <div>
          <div className="text-sm text-muted-foreground font-bold mb-1.5">Боқӣ монд:</div>
          <div className="px-4 py-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-md hover:shadow-lg transition-all duration-200 inline-flex items-center gap-2.5 pt-[7px] pb-[7px]">
            <Clock className="w-4 h-4 text-white" />
            <div className="text-sm font-semibold text-white">{isCompleted ? '-' : (isOverdue ? '0' : daysLeft)} рӯз</div>
          </div>
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <div className="text-sm text-muted-foreground font-bold mb-1.5">Индикатори иҷроиш</div>
          {(() => {
            // Special cases: completed or overdue
            if (isCompleted) {
              return (
                <div 
                  className="h-8 rounded-lg shadow-lg transition-all duration-700 ease-out"
                  style={{
                    background: '#22c55e',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 2px rgba(255, 255, 255, 0.3)'
                  }}
                />
              );
            }
            
            if (isOverdue) {
              return (
                <div 
                  className="h-8 rounded-lg shadow-lg transition-all duration-700 ease-out"
                  style={{
                    background: '#ef4444',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 2px rgba(255, 255, 255, 0.3)'
                  }}
                />
              );
            }
            
            // Calculate dynamic color percentages using three-phase interpolation
            // Phase 1 (0-33.33%): Green depletes from 33.33% to 0%, yellow and red grow equally to 50%
            // Phase 2 (33.33-66.66%): Green=0, yellow depletes from 50% to 0%, red grows to 100%
            // Phase 3 (66.66-100%): Green=0, yellow=0, red=100%
            
            const normalizedProgress = progressPercent / 100;
            let green, yellow, red;
            
            if (normalizedProgress < 1/3) {
              // Phase 1: Green drains, yellow and red grow proportionally
              green = 1/3 - normalizedProgress;
              yellow = 1/3 + normalizedProgress / 2;
              red = 1/3 + normalizedProgress / 2;
            } else if (normalizedProgress < 2/3) {
              // Phase 2: Green=0, yellow drains, red grows
              green = 0;
              const phaseProgress = (normalizedProgress - 1/3) * 3;
              yellow = 0.5 * (1 - phaseProgress);
              red = 1 - yellow;
            } else {
              // Phase 3: Only red remains (100%)
              green = 0;
              yellow = 0;
              red = 1;
            }
            
            // Convert to percentages with safety bounds
            const greenPercent = Math.max(0, Math.min(100, green * 100));
            const yellowPercent = Math.max(0, Math.min(100, yellow * 100));
            const redPercent = Math.max(0, Math.min(100, red * 100));

            const gradientStops = [];
            let currentPos = 0;
            
            if (greenPercent > 0) {
              gradientStops.push(`#22c55e ${currentPos}%`);
              currentPos += greenPercent;
              gradientStops.push(`#22c55e ${currentPos}%`);
            }
            
            if (yellowPercent > 0) {
              if (greenPercent > 0) {
                gradientStops.push(`#facc15 ${currentPos + 2}%`);
              } else {
                gradientStops.push(`#facc15 ${currentPos}%`);
              }
              currentPos += yellowPercent;
              gradientStops.push(`#facc15 ${currentPos}%`);
            }
            
            if (redPercent > 0) {
              if (yellowPercent > 0) {
                gradientStops.push(`#ef4444 ${currentPos + 2}%`);
              } else {
                gradientStops.push(`#ef4444 ${currentPos}%`);
              }
              currentPos += redPercent;
              gradientStops.push(`#ef4444 ${currentPos}%`);
            }

            return (
              <div 
                className="h-8 rounded-lg shadow-lg transition-all duration-700 ease-out"
                style={{
                  background: `linear-gradient(to right, ${gradientStops.join(', ')})`,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 2px rgba(255, 255, 255, 0.3)'
                }}
              />
            );
          })()}
        </div>
      </div>
      {isCompleted && (
        <div className="text-green-600 font-semibold">Иҷрошуда!</div>
      )}
      {isOverdue && !isCompleted && (
        <div className="text-red-600 font-semibold">Иҷронашуда!</div>
      )}
    </div>
  );
}

export default function AssignmentsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [documentTypeId, setDocumentTypeId] = useState<string>('');
  const [content, setContent] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);
  const [selectedExecutorIds, setSelectedExecutorIds] = useState<number[]>([]);
  const [deadline, setDeadline] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showAllInvited, setShowAllInvited] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'overdue' | 'completed'>('all');
  const [documentTypeFilterId, setDocumentTypeFilterId] = useState<string>('');
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyAssignmentId, setReplyAssignmentId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyDocumentContent, setReplyDocumentContent] = useState('');
  const [replyDocumentFilename, setReplyDocumentFilename] = useState('Ҳуҷҷат');
  const [showReplyDocumentEditor, setShowReplyDocumentEditor] = useState(false);
  const [templatePopoverOpen, setTemplatePopoverOpen] = useState(false);
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
  const [recipientSearch, setRecipientSearch] = useState('');
  const [composeMessageDialogOpen, setComposeMessageDialogOpen] = useState(false);
  const [composeForAssignment, setComposeForAssignment] = useState<Assignment | null>(null);

  const { data: assignments = [], isLoading } = useQuery<Assignment[]>({
    queryKey: ['/api/assignments'],
  });

  const { data: allDepartments = [], isLoading: loadingDepartments, dataUpdatedAt } = useQuery<Department[]>({
    queryKey: ['/api/departments/all'],
  });

  // Filter out subdepartments - only show main departments for recipient selection
  const departments = allDepartments.filter(d => !d.parentDepartmentId);

  const { data: allPeople = [] } = useQuery<Person[]>({
    queryKey: ['/api/people'],
  });

  const { data: documentTypes = [] } = useQuery<DocumentType[]>({
    queryKey: ['/api/document-types'],
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: documentTemplates = [] } = useQuery<DocumentTemplate[]>({
    queryKey: ['/api/document-templates'],
  });

  // Filter assignments by document type
  const filteredAssignments = documentTypeFilterId && documentTypeFilterId !== 'all'
    ? assignments.filter(a => a.documentTypeId?.toString() === documentTypeFilterId)
    : assignments;

  const createAssignmentMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await apiFetch('/api/assignments', {
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
      setIsDialogOpen(false);
      setDocumentTypeId('');
      setContent('');
      setDocumentNumber('');
      setSelectedRecipients([]);
      setSelectedExecutorIds([]);
      setDeadline('');
      setSelectedFiles([]);
    },
    onError: (error: any) => {
      toast({
        title: 'Хато',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const completeAssignmentMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('PATCH', `/api/assignments/${id}/complete`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/counters'] });
      toast({
        title: 'Муваффақият',
        description: 'Супориш иҷро шуд',
      });
    },
  });

  const replyAssignmentMutation = useMutation({
    mutationFn: async ({ id, replyText, documentContent, documentFilename, files }: { id: number; replyText: string; documentContent?: string; documentFilename?: string; files?: File[] }) => {
      const formData = new FormData();
      formData.append('replyText', replyText);
      if (documentContent) {
        formData.append('documentContent', documentContent);
        formData.append('documentFilename', documentFilename || 'Ҳуҷҷат');
      }
      if (files && files.length > 0) {
        for (const file of files) {
          formData.append('files', file);
        }
      }
      
      const response = await apiFetch(`/api/assignments/${id}/replies`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit reply');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      setReplyDialogOpen(false);
      setReplyAssignmentId(null);
      setReplyText('');
      setReplyDocumentContent('');
      setReplyDocumentFilename('Ҳуҷҷат');
      setShowReplyDocumentEditor(false);
      setReplyFiles([]);
      toast({
        title: 'Муваффақият',
        description: 'Ҷавоб фиристода шуд',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Хато',
        description: error.message || 'Ҷавоб фиристода нашуд',
        variant: 'destructive',
      });
    },
  });

  // Check if current user is a "Даъват" (invited executor) for an assignment
  const isUserDaavat = (assignment: Assignment) => {
    if (user?.userType !== 'department' || !user.department?.id) return false;
    // Find any person from user's department that is in the executorIds
    const userDeptPeople = allPeople.filter(p => p.departmentId === user.department?.id);
    return userDeptPeople.some(p => assignment.executorIds?.includes(p.id));
  };

  // Get reply for a specific person by their department
  const getReplyForDepartment = (assignment: Assignment, departmentId: number) => {
    return assignment.replies?.find(r => r.responderDepartmentId === departmentId);
  };

  // Handle Даъват reply - open compose message dialog
  const handleDaavatReply = (assignment: Assignment) => {
    // Даъват теперь тоже использует простой диалог ответа
    setReplyAssignmentId(assignment.id);
    setReplyDialogOpen(true);
  };

  const approveAssignmentMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: 'approved' | 'rejected' }) => {
      return await apiRequest('PATCH', `/api/assignments/${id}/approve`, { status });
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      toast({
        title: status === 'approved' ? 'Иҷро шуд' : 'Рад шуд',
        description: status === 'approved' 
          ? 'Супориш тасдиқ карда шуд' 
          : 'Супориш рад карда шуд',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Хато',
        description: error.message || 'Хатогӣ ҳангоми тасдиқ',
        variant: 'destructive',
      });
    },
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/assignments/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/counters'] });
      toast({
        title: 'Муваффақият',
        description: 'Супориш бекор карда шуд',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Хато',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      if (selectedFiles.length + filesArray.length > 5) {
        toast({
          title: 'Хато',
          description: 'Шумо танҳо то 5 файл метавонед илова кунед',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFiles([...selectedFiles, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!documentTypeId) {
      toast({
        title: 'Хато',
        description: 'Намуди ҳуҷҷатро интихоб кунед',
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
    if (!deadline) {
      toast({
        title: 'Хато',
        description: 'Мӯҳлати иҷроро муайян кунед',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    formData.append('documentTypeId', documentTypeId);
    if (content) {
      formData.append('content', content);
    }
    if (documentNumber) {
      formData.append('documentNumber', documentNumber);
    }
    formData.append('recipientIds', JSON.stringify(selectedRecipients));
    formData.append('executorIds', JSON.stringify(selectedExecutorIds));
    formData.append('deadline', deadline);
    
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });

    createAssignmentMutation.mutate(formData);
  };

  // Check permissions from database
  const canCreate = user?.userType === 'department' && user.department?.canCreateAssignment;
  const canDelete = user?.userType === 'department' && user.department?.canCreateAssignment;

  // Helper to get document type name
  const getDocTypeName = (assignment: Assignment) => {
    if (assignment.documentTypeId) {
      const docType = documentTypes.find(dt => dt.id === assignment.documentTypeId);
      return docType?.name || 'Номаълум';
    }
    return assignment.topic || 'Номаълум';
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-cover bg-center bg-fixed relative"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0" style={{ background: 'rgba(255, 255, 255, 0.92)' }} />
      
      <PageHeader variant="department">
        <PageHeaderContainer>
          <PageHeaderLeft>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/department/main')}
              className="text-white hover:bg-white/20"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <button onClick={() => setLocation('/department/main')} className="flex items-center gap-3">
              <img src={logoImage} alt="Логотип" className="h-10 w-10 object-contain drop-shadow-md" />
              <div>
                <h1 className="text-lg font-semibold text-white drop-shadow-md">
                  Супоришҳо
                </h1>
                <p className="text-xs text-white/90 drop-shadow-sm">EcoDoc - Портали электронӣ</p>
              </div>
            </button>
          </PageHeaderLeft>
          <PageHeaderRight>
            <Button
              size="sm"
              onClick={() => {
                apiFetch('/api/auth/logout', { method: 'POST' }).then(() => setLocation('/'));
              }}
              className="flex items-center gap-2 bg-red-500/90 hover:bg-red-600 text-white"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
              <span>Баромад</span>
            </Button>
          </PageHeaderRight>
        </PageHeaderContainer>
      </PageHeader>

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Рӯйхати супоришҳо</h2>
          {canCreate && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" data-testid="button-create-assignment">
                  <Plus className="h-4 w-4" />
                  Супориш
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Вазифагузорӣ</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Намуди ҳуҷҷат <span className="text-destructive">*</span></Label>
                    <Select 
                      value={documentTypeId} 
                      onValueChange={setDocumentTypeId}
                    >
                      <SelectTrigger data-testid="select-document-type">
                        <SelectValue placeholder="Намуди ҳуҷҷатро интихоб кунед" />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypes.map((docType) => (
                          <SelectItem 
                            key={docType.id} 
                            value={docType.id.toString()}
                          >
                            {docType.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Мазмун</Label>
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Шарҳи иловагӣ..."
                      className="min-h-[100px]"
                      data-testid="textarea-content"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assignment-document-number">
                      Рақами ҳуҷҷат
                    </Label>
                    <Input
                      id="assignment-document-number"
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      placeholder="Рақами ҳуҷҷат"
                      data-testid="input-assignment-document-number"
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
                        <Input
                          placeholder="Ҷустуҷӯ..."
                          value={recipientSearch}
                          onChange={(e) => setRecipientSearch(e.target.value)}
                          className="mb-2"
                          data-testid="input-recipient-search"
                        />
                        <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {departments
                              .filter((dept: any) => 
                                !recipientSearch || dept.name.toLowerCase().includes(recipientSearch.toLowerCase())
                              )
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
                                        // Remove department and clear its executors
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

                  {/* Даъват (Приглашенные) - только ПЕРВЫЙ выбранный человек */}
                  {selectedExecutorIds.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Даъват</Label>
                        <span className="text-xs text-muted-foreground">
                          Интихоб шуд: {selectedExecutorIds.length}
                        </span>
                      </div>
                      <div className="border rounded-md p-4">
                        <div className="space-y-2">
                          {(() => {
                            // Только первый выбранный человек в Даъват
                            const firstPerson = allPeople.find(p => p.id === selectedExecutorIds[0]);
                            if (!firstPerson) return null;
                            const dept = departments.find(d => d.id === firstPerson.departmentId);
                            
                            return (
                              <div className="flex items-center justify-between space-x-2 py-1">
                                <div className="flex items-center space-x-2 flex-1">
                                  <Checkbox
                                    id={`invited-${firstPerson.id}`}
                                    checked={true}
                                    onCheckedChange={() => {
                                      setSelectedExecutorIds(selectedExecutorIds.filter(id => id !== firstPerson.id));
                                    }}
                                    data-testid={`checkbox-invited-${firstPerson.id}`}
                                  />
                                  <label htmlFor={`invited-${firstPerson.id}`} className="text-sm cursor-pointer flex-1">
                                    {firstPerson.name}
                                  </label>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {dept?.name || 'Номаълум'}
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Иҷрокунандагон (Исполнители) - показывает всех людей, кроме первого выбранного (который в Даъват) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Иҷрокунандагон</Label>
                      {selectedRecipients.length > 0 && (() => {
                        // Первый выбранный человек (в Даъват) исключен из списка
                        const firstSelectedId = selectedExecutorIds[0];
                        const allAvailablePeople = allPeople.filter(p => 
                          selectedRecipients.includes(p.departmentId!) && p.id !== firstSelectedId && !selectedExecutorIds.includes(p.id)
                        );
                        if (allAvailablePeople.length <= 1) return null;
                        return (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const allPeopleIds = allPeople
                                .filter(p => selectedRecipients.includes(p.departmentId!) && p.id !== firstSelectedId)
                                .map(p => p.id);
                              setSelectedExecutorIds(Array.from(new Set([...selectedExecutorIds, ...allPeopleIds])));
                            }}
                            className="text-xs h-7"
                            data-testid="button-select-all-executors"
                          >
                            Ҳамаро интихоб кардан
                          </Button>
                        );
                      })()}
                    </div>
                    {selectedRecipients.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Аввал қабулкунандаро интихоб кунед
                      </p>
                    ) : (
                      <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                        {selectedRecipients.map(recipientId => {
                          const dept = departments.find(d => d.id === recipientId);
                          // Первый выбранный человек показывается в Даъват, не здесь
                          const firstSelectedId = selectedExecutorIds[0];
                          const peopleInDept = allPeople.filter(p => 
                            p.departmentId === recipientId && p.id !== firstSelectedId
                          );
                          
                          if (peopleInDept.length === 0) return null;
                          
                          return (
                            <div key={recipientId} className="mb-4 last:mb-0">
                              <div className="text-sm font-semibold text-gray-700 mb-2">
                                {dept?.name || 'Номаълум'}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-2">
                                {peopleInDept.map(person => {
                                  // Чекбокс отмечен если человек выбран (кроме первого)
                                  const isChecked = selectedExecutorIds.includes(person.id);
                                  return (
                                    <div key={person.id} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`executor-${person.id}`}
                                        checked={isChecked}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setSelectedExecutorIds([...selectedExecutorIds, person.id]);
                                          } else {
                                            setSelectedExecutorIds(selectedExecutorIds.filter(id => id !== person.id));
                                          }
                                        }}
                                        data-testid={`checkbox-executor-${person.id}`}
                                      />
                                      <label htmlFor={`executor-${person.id}`} className="text-sm cursor-pointer">
                                        {person.name}
                                      </label>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                        {allPeople.filter(p => p.departmentId !== null && selectedRecipients.includes(p.departmentId) && p.id !== selectedExecutorIds[0]).length === 0 && (
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
                      value={deadline}
                      onChange={setDeadline}
                      placeholder="Санаро интихоб кунед"
                      data-testid="datepicker-deadline"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Файлҳо</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="default"
                        onClick={() => document.getElementById('assignment-file-input')?.click()}
                        className="gap-2"
                        data-testid="button-select-files"
                      >
                        <Paperclip className="h-4 w-4" />
                        Интихоби файл
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {selectedFiles.length > 0 && `${selectedFiles.length} файл`}
                      </span>
                    </div>
                    <input
                      id="assignment-file-input"
                      type="file"
                      multiple
                      accept="*/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    {selectedFiles.length > 0 && (
                      <div className="space-y-2 mt-2">
                        {selectedFiles.map((file, index) => (
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
                    <Button onClick={handleSubmit} disabled={createAssignmentMutation.isPending}>
                      {createAssignmentMutation.isPending
                        ? 'Эҷод шуда истодааст...'
                        : 'Эҷод кардан'}
                    </Button>
                    <Button variant="destructive" onClick={() => setIsDialogOpen(false)}>
                      Бекор кардан
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Reply Dialog with Document Editor */}
          <Dialog open={replyDialogOpen} onOpenChange={(open) => {
            setReplyDialogOpen(open);
            if (!open) {
              setReplyAssignmentId(null);
              setReplyText('');
              setReplyDocumentContent('');
              setShowReplyDocumentEditor(false);
              setReplyFiles([]);
            }
          }}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Ҷавоб додан</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Тавсифи мухтасар</Label>
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Ҷавоби худро нависед..."
                    className="min-h-[80px]"
                    data-testid="textarea-reply"
                  />
                </div>
                
                <div className="space-y-2">
                  {!showReplyDocumentEditor ? (
                    documentTemplates.length > 0 ? (
                      <Popover open={templatePopoverOpen} onOpenChange={setTemplatePopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            data-testid="button-create-document"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Сохтани ҳуҷҷат
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-0" align="start">
                          <div className="max-h-[200px] overflow-y-auto">
                            {documentTemplates.map((template) => (
                              <button
                                key={template.id}
                                type="button"
                                className="w-full text-left px-3 py-2 hover:bg-accent text-sm border-b last:border-b-0"
                                onClick={() => {
                                  setReplyDocumentContent(template.htmlContent || '');
                                  setReplyDocumentFilename(template.name || 'Ҳуҷҷат');
                                  setShowReplyDocumentEditor(true);
                                  setTemplatePopoverOpen(false);
                                }}
                                data-testid={`button-template-${template.id}`}
                              >
                                {template.name}
                              </button>
                            ))}
                            <button
                              type="button"
                              className="w-full text-left px-3 py-2 hover:bg-accent text-sm text-muted-foreground"
                              onClick={() => {
                                setReplyDocumentContent('');
                                setReplyDocumentFilename('Ҳуҷҷат');
                                setShowReplyDocumentEditor(true);
                                setTemplatePopoverOpen(false);
                              }}
                              data-testid="button-new-document"
                            >
                              <Plus className="h-3 w-3 inline mr-1" />
                              Ҳуҷҷати нав
                            </button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowReplyDocumentEditor(true)}
                        className="w-full"
                        data-testid="button-create-document"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Сохтани ҳуҷҷат
                      </Button>
                    )
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <Label>Ҳуҷҷат</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowReplyDocumentEditor(false);
                            setReplyDocumentContent('');
                            setReplyDocumentFilename('Ҳуҷҷат');
                          }}
                          data-testid="button-close-document-editor"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Input
                          value={replyDocumentFilename}
                          onChange={(e) => setReplyDocumentFilename(e.target.value)}
                          placeholder="Номи ҳуҷҷат"
                          className="flex-1"
                          data-testid="input-document-filename"
                        />
                        <span className="text-sm text-muted-foreground">.docx</span>
                      </div>
                      <div className="border rounded-lg overflow-hidden">
                        <DocumentEditor
                          content={replyDocumentContent}
                          onChange={setReplyDocumentContent}
                          readOnly={false}
                        />
                      </div>
                    </>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Файлҳо (то 5 файл)</Label>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id="reply-file-upload"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          if (replyFiles.length + files.length <= 5) {
                            setReplyFiles(prev => [...prev, ...files]);
                          } else {
                            toast({
                              title: 'Хато',
                              description: 'Ҳадди аксар 5 файл иҷозат дода мешавад',
                              variant: 'destructive',
                            });
                          }
                          e.target.value = '';
                        }}
                        data-testid="input-reply-files"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('reply-file-upload')?.click()}
                        disabled={replyFiles.length >= 5}
                        data-testid="button-add-reply-files"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Илова кардан
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {replyFiles.length}/5 файл
                      </span>
                    </div>
                    {replyFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {replyFiles.map((file, index) => (
                          <div key={index} className="flex items-center gap-2 bg-accent px-3 py-1 rounded-md">
                            <Paperclip className="h-3 w-3" />
                            <span className="text-sm truncate max-w-[150px]">{file.name}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5"
                              onClick={() => setReplyFiles(prev => prev.filter((_, i) => i !== index))}
                              data-testid={`button-remove-reply-file-${index}`}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setReplyDialogOpen(false);
                      setReplyAssignmentId(null);
                      setReplyText('');
                      setReplyDocumentContent('');
                      setReplyDocumentFilename('Ҳуҷҷат');
                      setShowReplyDocumentEditor(false);
                      setReplyFiles([]);
                    }}
                    data-testid="button-cancel-reply"
                  >
                    Бекор кардан
                  </Button>
                  <Button
                    onClick={() => {
                      if (replyAssignmentId && replyText.trim()) {
                        replyAssignmentMutation.mutate({ 
                          id: replyAssignmentId, 
                          replyText: replyText.trim(),
                          documentContent: replyDocumentContent || undefined,
                          documentFilename: replyDocumentFilename || 'Ҳуҷҷат',
                          files: replyFiles.length > 0 ? replyFiles : undefined
                        });
                      }
                    }}
                    disabled={!replyText.trim() || replyAssignmentMutation.isPending}
                    data-testid="button-submit-reply"
                  >
                    {replyAssignmentMutation.isPending ? 'Фиристодан...' : 'Ҷавоб додан'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Compose Message Modal for Даъват */}
          <ComposeMessageModal
            isOpen={composeMessageDialogOpen}
            onClose={() => {
              setComposeMessageDialogOpen(false);
              setComposeForAssignment(null);
            }}
            defaultRecipientId={composeForAssignment?.senderId ?? undefined}
            assignmentId={composeForAssignment?.id}
            onSuccess={() => {
              setComposeForAssignment(null);
            }}
          />
        </div>

        <div className="space-y-4">
          <div className="flex gap-3 flex-wrap items-center">
            <Button
              variant={activeFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setActiveFilter('all')}
              data-testid="tab-all-assignments"
              className="transition-all hover:ring-2 hover:ring-primary hover:ring-offset-2"
            >
              Ҳама ({filteredAssignments.filter(a => !a.isCompleted && new Date(a.deadline) >= new Date(new Date().setHours(0,0,0,0))).length})
            </Button>
            <Button
              variant={activeFilter === 'overdue' ? 'default' : 'outline'}
              onClick={() => setActiveFilter('overdue')}
              data-testid="tab-overdue-assignments"
              className="transition-all hover:ring-2 hover:ring-primary hover:ring-offset-2"
            >
              Иҷронашуда ({filteredAssignments.filter(a => !a.isCompleted && new Date(a.deadline) < new Date(new Date().setHours(0,0,0,0))).length})
            </Button>
            <Button
              variant={activeFilter === 'completed' ? 'default' : 'outline'}
              onClick={() => setActiveFilter('completed')}
              data-testid="tab-completed-assignments"
              className="transition-all hover:ring-2 hover:ring-primary hover:ring-offset-2"
            >
              Иҷрошуда ({filteredAssignments.filter(a => a.isCompleted).length})
            </Button>
            <div className="ml-auto">
              <Select
                value={documentTypeFilterId}
                onValueChange={setDocumentTypeFilterId}
              >
                <SelectTrigger className="w-48" data-testid="select-assignment-document-type-filter">
                  <SelectValue placeholder="Намуди ҳуҷҷат" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Ҳама</SelectItem>
                  {documentTypes.map((dt) => (
                    <SelectItem key={dt.id} value={dt.id.toString()}>
                      {dt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {activeFilter === 'all' && (
            <div>
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Боргирӣ...</p>
                </div>
              </div>
            ) : filteredAssignments.filter(a => !a.isCompleted && new Date(a.deadline) >= new Date(new Date().setHours(0,0,0,0))).length === 0 ? (
              <Card className="p-12 text-center bg-white">
                <p className="text-muted-foreground">
                  Ҳанӯз супоришҳо нестанд
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredAssignments.filter(a => !a.isCompleted && new Date(a.deadline) >= new Date(new Date().setHours(0,0,0,0))).map((assignment) => (
              <Card key={assignment.id} className="bg-white" data-testid={`assignment-${assignment.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-3 flex-wrap mb-2">
                        <h3 className="text-lg font-semibold">{getDocTypeName(assignment)}</h3>
                        {assignment.documentNumber && (
                          <span className="text-sm text-muted-foreground">
                            <span className="font-medium">Рақами ҳуҷҷат:</span> {assignment.documentNumber}
                          </span>
                        )}
                      </div>
                      {assignment.content && (
                        <div className="mt-3">
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            Мазмун:
                          </div>
                          <div className="text-sm text-foreground bg-white p-3 rounded-md border border-primary/20 whitespace-pre-wrap">
                            {assignment.content}
                          </div>
                        </div>
                      )}
                      
                      {/* Даъват (Приглашенные исполнители) */}
                      {assignment.executors && assignment.executors.length > 0 && assignment.executorIds && (
                        <div className="text-sm text-muted-foreground mt-2">
                          <span className="font-medium">Даъват:</span>{' '}
                          <TooltipProvider>
                            {assignment.executorIds.map((personId, index) => {
                              const personName = assignment.executors[index];
                              const person = allPeople.find(p => p.id === personId);
                              const reply = person && assignment.replies?.find(r => r.responderDepartmentId === person.departmentId);
                              return (
                                <span key={personId}>
                                  {index > 0 && ', '}
                                  {reply ? (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="inline-flex items-center gap-0.5 text-green-600 cursor-pointer drop-shadow-[0_0_6px_rgba(34,197,94,0.6)]">
                                          <CheckCircle2 className="h-3 w-3" />
                                          {personName}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs">
                                        <p className="font-medium">Ҷавоб:</p>
                                        <p>{reply.replyText}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  ) : (
                                    <span>{personName}</span>
                                  )}
                                </span>
                              );
                            })}
                          </TooltipProvider>
                        </div>
                      )}
                      
                      {/* Иҷрокунандагон (Все люди из департаментов) */}
                      {assignment.allDepartmentExecutors && assignment.allDepartmentExecutors.length > 0 && (
                        <div className="text-sm text-muted-foreground mt-2">
                          <span className="font-medium">Иҷрокунандагон:</span>{' '}
                          <TooltipProvider>
                            {assignment.allDepartmentExecutorIds?.map((personId, index) => {
                              const personName = assignment.allDepartmentExecutors[index];
                              const person = allPeople.find(p => p.id === personId);
                              const reply = person && assignment.replies?.find(r => r.responderDepartmentId === person.departmentId);
                              return (
                                <span key={personId}>
                                  {index > 0 && ', '}
                                  {reply ? (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="inline-flex items-center gap-0.5 text-green-600 cursor-pointer drop-shadow-[0_0_6px_rgba(34,197,94,0.6)]">
                                          <CheckCircle2 className="h-3 w-3" />
                                          {personName}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs">
                                        <p className="font-medium">Ҷавоб:</p>
                                        <p>{reply.replyText}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  ) : (
                                    <span>{personName}</span>
                                  )}
                                </span>
                              );
                            })}
                          </TooltipProvider>
                        </div>
                      )}
                    </div>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAssignmentMutation.mutate(assignment.id)}
                        disabled={deleteAssignmentMutation.isPending}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        data-testid={`button-delete-assignment-${assignment.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AssignmentProgress createdAt={new Date(assignment.createdAt)} deadline={new Date(assignment.deadline)} isCompleted={assignment.isCompleted} />
                  
                  {assignment.attachments && assignment.attachments.length > 0 && (
                    <div className="pt-3 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            Файлҳои замимашуда
                            {' '}({assignment.attachments.length})
                          </span>
                        </div>
                        {assignment.approvalStatus && (
                          <div 
                            className={`
                              w-14 h-14 rounded-full flex flex-col items-center justify-center
                              transform rotate-[-12deg] font-bold shrink-0
                              ${assignment.approvalStatus === 'approved' 
                                ? 'text-green-600 bg-green-50' 
                                : 'text-red-600 bg-red-50'
                              }
                            `}
                            style={{
                              borderWidth: '3px',
                              borderStyle: 'solid',
                              borderColor: assignment.approvalStatus === 'approved' ? '#16a34a' : '#dc2626',
                              boxShadow: assignment.approvalStatus === 'approved'
                                ? '0 0 8px rgba(22, 163, 74, 0.4)'
                                : '0 0 8px rgba(220, 38, 38, 0.4)'
                            }}
                          >
                            {assignment.approvalStatus === 'approved' ? (
                              <Check className="h-5 w-5 stroke-[3]" />
                            ) : (
                              <X className="h-5 w-5 stroke-[3]" />
                            )}
                            <span className="text-[7px] leading-tight text-center font-bold">
                              {assignment.approvalStatus === 'approved' ? 'ИҶРО ШУД' : 'РАД ШУД'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {assignment.attachments.map((attachment) => (
                          <a
                            key={attachment.id}
                            href={`/api/assignment-attachments/${attachment.id}`}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-md text-sm transition-colors"
                            data-testid={`button-download-attachment-${attachment.id}`}
                          >
                            <Download className="h-4 w-4" />
                            <span className="truncate max-w-[200px]">{attachment.file_name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({(attachment.fileSize / 1024).toFixed(1)} KB)
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2 mt-2">
                    {!assignment.approvalStatus && user?.userType === 'department' && user.department?.id === assignment.senderId && (
                      <>
                        <Button
                          onClick={() => approveAssignmentMutation.mutate({ id: assignment.id, status: 'approved' })}
                          disabled={approveAssignmentMutation.isPending}
                          className="gap-1 bg-green-600 hover:bg-green-700 text-white"
                          data-testid={`button-approve-${assignment.id}`}
                        >
                          <Check className="h-4 w-4" />
                          Иҷро шуд
                        </Button>
                        <Button
                          onClick={() => approveAssignmentMutation.mutate({ id: assignment.id, status: 'rejected' })}
                          disabled={approveAssignmentMutation.isPending}
                          className="gap-1 bg-red-600 hover:bg-red-700 text-white"
                          data-testid={`button-reject-${assignment.id}`}
                        >
                          <X className="h-4 w-4" />
                          Рад шуд
                        </Button>
                      </>
                    )}
                    {!assignment.isCompleted && user?.userType === 'department' && user.department?.id !== assignment.senderId && assignment.recipientIds?.includes(user.department?.id || 0) && !assignment.replies?.some(r => r.responderDepartmentId === user.department?.id) && (
                      isUserDaavat(assignment) ? (
                        <Button
                          variant="outline"
                          onClick={() => handleDaavatReply(assignment)}
                          data-testid={`button-reply-daavat-${assignment.id}`}
                          className="border-green-500 text-green-600 hover:bg-green-50"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Ҷавоб додан
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setReplyAssignmentId(assignment.id);
                            setReplyDialogOpen(true);
                          }}
                          data-testid={`button-reply-${assignment.id}`}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Ҷавоб додан
                        </Button>
                      )
                    )}
                    {user?.userType === 'department' && assignment.replies?.some(r => r.responderDepartmentId === user?.department?.id) && (
                      <span className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        Ҷавоб дода шуд
                      </span>
                    )}
                  </div>
                </CardContent>
                
                {/* Collapsible Replies Section */}
                {assignment.replies && assignment.replies.length > 0 && (
                  <div className="border-t">
                    <Button
                      variant="ghost"
                      className="w-full flex items-center justify-between py-3 px-6 hover:bg-gray-50"
                      onClick={() => {
                        setExpandedReplies(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(assignment.id)) {
                            newSet.delete(assignment.id);
                          } else {
                            newSet.add(assignment.id);
                          }
                          return newSet;
                        });
                      }}
                      data-testid={`button-toggle-replies-${assignment.id}`}
                    >
                      <span className="text-sm font-medium">
                        Ҷавобҳо ({assignment.replies.length})
                      </span>
                      {expandedReplies.has(assignment.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                    
                    {expandedReplies.has(assignment.id) && (
                      <div className="px-6 pb-4 space-y-3">
                        {[...assignment.replies]
                          .sort((a, b) => {
                            const aDaavat = assignment.executorIds?.some(eId => {
                              const person = allPeople.find(p => p.id === eId);
                              return person?.departmentId === a.responderDepartmentId;
                            }) || false;
                            const bDaavat = assignment.executorIds?.some(eId => {
                              const person = allPeople.find(p => p.id === eId);
                              return person?.departmentId === b.responderDepartmentId;
                            }) || false;
                            if (aDaavat && !bDaavat) return -1;
                            if (!aDaavat && bDaavat) return 1;
                            return 0;
                          })
                          .map((reply) => {
                            const responderDept = allDepartments.find(d => d.id === reply.responderDepartmentId);
                            const responderPerson = reply.responderPersonId ? allPeople.find(p => p.id === reply.responderPersonId) : null;
                            const isDaavatReply = assignment.executorIds?.some(eId => {
                              const person = allPeople.find(p => p.id === eId);
                              return person?.departmentId === reply.responderDepartmentId;
                            });
                            // Show person name if responderPersonId is set, otherwise show department name
                            const responderName = responderPerson?.name || responderDept?.name || 'Номаълум';
                            return (
                              <div 
                                key={reply.id} 
                                className={`p-3 rounded-lg border ${isDaavatReply ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}
                                data-testid={`reply-${reply.id}`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{responderName}</span>
                                    {isDaavatReply && (
                                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Даъват</span>
                                    )}
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(reply.createdAt).toLocaleDateString('ru-RU')}
                                  </span>
                                </div>
                                <p className="text-sm">{reply.replyText}</p>
                                {reply.attachments && reply.attachments.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {reply.attachments.map((att: any) => (
                                      <a
                                        key={att.id}
                                        href={`/api/assignment-reply-attachments/${att.id}`}
                                        className="flex items-center gap-1 text-xs bg-white border rounded px-2 py-1 hover:bg-gray-100"
                                        data-testid={`button-download-reply-attachment-${att.id}`}
                                      >
                                        <Download className="h-3 w-3" />
                                        {att.filename}
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}
              </Card>
                ))}
              </div>
            )}
          </div>
          )}

          {activeFilter === 'overdue' && (
            <div>
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Боргирӣ...</p>
                </div>
              </div>
            ) : filteredAssignments.filter(a => !a.isCompleted && new Date(a.deadline) < new Date(new Date().setHours(0,0,0,0))).length === 0 ? (
              <Card className="p-12 text-center bg-white">
                <p className="text-muted-foreground">
                  Супоришҳои иҷронашуда нестанд
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredAssignments.filter(a => !a.isCompleted && new Date(a.deadline) < new Date(new Date().setHours(0,0,0,0))).map((assignment) => (
              <Card key={assignment.id} className="bg-white" data-testid={`assignment-${assignment.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-3 flex-wrap mb-2">
                        <h3 className="text-lg font-semibold">{getDocTypeName(assignment)}</h3>
                        {assignment.documentNumber && (
                          <span className="text-sm text-muted-foreground">
                            <span className="font-medium">Рақами ҳуҷҷат:</span> {assignment.documentNumber}
                          </span>
                        )}
                      </div>
                      {assignment.content && (
                        <div className="mt-3">
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            Мазмун:
                          </div>
                          <div className="text-sm text-foreground bg-white p-3 rounded-md border border-primary/20 whitespace-pre-wrap">
                            {assignment.content}
                          </div>
                        </div>
                      )}
                      
                      {/* Даъват (Приглашенные исполнители) */}
                      {assignment.executors && assignment.executors.length > 0 && assignment.executorIds && (
                        <div className="text-sm text-muted-foreground mt-2">
                          <span className="font-medium">Даъват:</span>{' '}
                          <TooltipProvider>
                            {assignment.executorIds.map((personId, index) => {
                              const personName = assignment.executors[index];
                              const person = allPeople.find(p => p.id === personId);
                              const reply = person && assignment.replies?.find(r => r.responderDepartmentId === person.departmentId);
                              return (
                                <span key={personId}>
                                  {index > 0 && ', '}
                                  {reply ? (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="inline-flex items-center gap-0.5 text-green-600 cursor-pointer drop-shadow-[0_0_6px_rgba(34,197,94,0.6)]">
                                          <CheckCircle2 className="h-3 w-3" />
                                          {personName}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs">
                                        <p className="font-medium">Ҷавоб:</p>
                                        <p>{reply.replyText}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  ) : (
                                    <span>{personName}</span>
                                  )}
                                </span>
                              );
                            })}
                          </TooltipProvider>
                        </div>
                      )}
                      
                      {/* Иҷрокунандагон (Все люди из департаментов) */}
                      {assignment.allDepartmentExecutors && assignment.allDepartmentExecutors.length > 0 && (
                        <div className="text-sm text-muted-foreground mt-2">
                          <span className="font-medium">Иҷрокунандагон:</span>{' '}
                          <TooltipProvider>
                            {assignment.allDepartmentExecutorIds?.map((personId, index) => {
                              const personName = assignment.allDepartmentExecutors[index];
                              const person = allPeople.find(p => p.id === personId);
                              const reply = person && assignment.replies?.find(r => r.responderDepartmentId === person.departmentId);
                              return (
                                <span key={personId}>
                                  {index > 0 && ', '}
                                  {reply ? (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="inline-flex items-center gap-0.5 text-green-600 cursor-pointer drop-shadow-[0_0_6px_rgba(34,197,94,0.6)]">
                                          <CheckCircle2 className="h-3 w-3" />
                                          {personName}
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs">
                                        <p className="font-medium">Ҷавоб:</p>
                                        <p>{reply.replyText}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  ) : (
                                    <span>{personName}</span>
                                  )}
                                </span>
                              );
                            })}
                          </TooltipProvider>
                        </div>
                      )}
                    </div>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAssignmentMutation.mutate(assignment.id)}
                        disabled={deleteAssignmentMutation.isPending}
                        data-testid={`button-delete-${assignment.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AssignmentProgress createdAt={new Date(assignment.createdAt)} deadline={new Date(assignment.deadline)} isCompleted={assignment.isCompleted} />
                  
                  {assignment.attachments && assignment.attachments.length > 0 && (
                    <div className="pt-3 border-t">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            Файлҳои замимашуда
                            {' '}({assignment.attachments.length})
                          </span>
                        </div>
                        {assignment.approvalStatus && (
                          <div 
                            className={`
                              w-14 h-14 rounded-full flex flex-col items-center justify-center
                              transform rotate-[-12deg] font-bold shrink-0
                              ${assignment.approvalStatus === 'approved' 
                                ? 'text-green-600 bg-green-50' 
                                : 'text-red-600 bg-red-50'
                              }
                            `}
                            style={{
                              borderWidth: '3px',
                              borderStyle: 'solid',
                              borderColor: assignment.approvalStatus === 'approved' ? '#16a34a' : '#dc2626',
                              boxShadow: assignment.approvalStatus === 'approved'
                                ? '0 0 8px rgba(22, 163, 74, 0.4)'
                                : '0 0 8px rgba(220, 38, 38, 0.4)'
                            }}
                          >
                            {assignment.approvalStatus === 'approved' ? (
                              <Check className="h-5 w-5 stroke-[3]" />
                            ) : (
                              <X className="h-5 w-5 stroke-[3]" />
                            )}
                            <span className="text-[7px] leading-tight text-center font-bold">
                              {assignment.approvalStatus === 'approved' ? 'ИҶРО ШУД' : 'РАД ШУД'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {assignment.attachments.map((attachment) => (
                          <a
                            key={attachment.id}
                            href={`/api/assignment-attachments/${attachment.id}`}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-md text-sm transition-colors"
                            data-testid={`button-download-attachment-${attachment.id}`}
                          >
                            <Download className="h-4 w-4" />
                            <span className="truncate max-w-[200px]">{attachment.file_name}</span>
                            <span className="text-xs text-muted-foreground">
                              ({(attachment.fileSize / 1024).toFixed(1)} KB)
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2 mt-2">
                    {!assignment.isCompleted && user?.userType === 'department' && user.department?.id !== assignment.senderId && assignment.recipientIds?.includes(user.department?.id || 0) && !assignment.replies?.some(r => r.responderDepartmentId === user.department?.id) && (
                      isUserDaavat(assignment) ? (
                        <Button
                          variant="outline"
                          onClick={() => handleDaavatReply(assignment)}
                          data-testid={`button-reply-daavat-${assignment.id}`}
                          className="border-green-500 text-green-600 hover:bg-green-50"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Ҷавоб додан
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setReplyAssignmentId(assignment.id);
                            setReplyDialogOpen(true);
                          }}
                          data-testid={`button-reply-${assignment.id}`}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Ҷавоб додан
                        </Button>
                      )
                    )}
                    {user?.userType === 'department' && assignment.replies?.some(r => r.responderDepartmentId === user?.department?.id) && (
                      <span className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        Ҷавоб дода шуд
                      </span>
                    )}
                  </div>
                </CardContent>
                
                {/* Collapsible Replies Section */}
                {assignment.replies && assignment.replies.length > 0 && (
                  <div className="border-t">
                    <Button
                      variant="ghost"
                      className="w-full flex items-center justify-between py-3 px-6 hover:bg-gray-50"
                      onClick={() => {
                        setExpandedReplies(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(assignment.id)) {
                            newSet.delete(assignment.id);
                          } else {
                            newSet.add(assignment.id);
                          }
                          return newSet;
                        });
                      }}
                      data-testid={`button-toggle-replies-overdue-${assignment.id}`}
                    >
                      <span className="text-sm font-medium">
                        Ҷавобҳо ({assignment.replies.length})
                      </span>
                      {expandedReplies.has(assignment.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                    
                    {expandedReplies.has(assignment.id) && (
                      <div className="px-6 pb-4 space-y-3">
                        {[...assignment.replies]
                          .sort((a, b) => {
                            const aDaavat = assignment.executorIds?.some(eId => {
                              const person = allPeople.find(p => p.id === eId);
                              return person?.departmentId === a.responderDepartmentId;
                            }) || false;
                            const bDaavat = assignment.executorIds?.some(eId => {
                              const person = allPeople.find(p => p.id === eId);
                              return person?.departmentId === b.responderDepartmentId;
                            }) || false;
                            if (aDaavat && !bDaavat) return -1;
                            if (!aDaavat && bDaavat) return 1;
                            return 0;
                          })
                          .map((reply) => {
                            const responderDept = allDepartments.find(d => d.id === reply.responderDepartmentId);
                            const responderPerson = reply.responderPersonId ? allPeople.find(p => p.id === reply.responderPersonId) : null;
                            const isDaavatReply = assignment.executorIds?.some(eId => {
                              const person = allPeople.find(p => p.id === eId);
                              return person?.departmentId === reply.responderDepartmentId;
                            });
                            // Show person name if responderPersonId is set, otherwise show department name
                            const responderName = responderPerson?.name || responderDept?.name || 'Номаълум';
                            return (
                              <div 
                                key={reply.id} 
                                className={`p-3 rounded-lg border ${isDaavatReply ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}
                                data-testid={`reply-overdue-${reply.id}`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{responderName}</span>
                                    {isDaavatReply && (
                                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Даъват</span>
                                    )}
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(reply.createdAt).toLocaleDateString('ru-RU')}
                                  </span>
                                </div>
                                <p className="text-sm">{reply.replyText}</p>
                                {reply.attachments && reply.attachments.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {reply.attachments.map((att: any) => (
                                      <a
                                        key={att.id}
                                        href={`/api/assignment-reply-attachments/${att.id}`}
                                        className="flex items-center gap-1 text-xs bg-white border rounded px-2 py-1 hover:bg-gray-100"
                                        data-testid={`button-download-reply-attachment-overdue-${att.id}`}
                                      >
                                        <Download className="h-3 w-3" />
                                        {att.filename}
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}
              </Card>
                ))}
              </div>
            )}
          </div>
          )}

          {activeFilter === 'completed' && (
            <div>
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Боргирӣ...</p>
                </div>
              </div>
            ) : filteredAssignments.filter(a => a.isCompleted).length === 0 ? (
              <Card className="p-12 text-center bg-white">
                <p className="text-muted-foreground">
                  Супоришҳои иҷрошуда нестанд
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredAssignments.filter(a => a.isCompleted).map((assignment) => (
                  <Card key={assignment.id} className="bg-white" data-testid={`assignment-${assignment.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-baseline gap-3 flex-wrap mb-2">
                            <h3 className="text-lg font-semibold">{getDocTypeName(assignment)}</h3>
                            {assignment.documentNumber && (
                              <span className="text-sm text-muted-foreground">
                                <span className="font-medium">Рақами ҳуҷҷат:</span> {assignment.documentNumber}
                              </span>
                            )}
                          </div>
                          {assignment.content && (
                            <div className="mt-3">
                              <div className="text-sm font-medium text-gray-900 mb-1">
                                Мазмун:
                              </div>
                              <div className="text-sm text-foreground bg-white p-3 rounded-md border border-primary/20 whitespace-pre-wrap">
                                {assignment.content}
                              </div>
                            </div>
                          )}
                          
                          {/* Даъват (Приглашенные исполнители) */}
                          {assignment.executors && assignment.executors.length > 0 && (
                            <div className="text-sm text-muted-foreground mt-2">
                              <span className="font-medium">Даъват:</span>{' '}
                              {assignment.executors.join(', ')}
                            </div>
                          )}
                          
                          {/* Иҷрокунандагон (Все люди из департаментов) */}
                          {assignment.allDepartmentExecutors && assignment.allDepartmentExecutors.length > 0 && (
                            <div className="text-sm text-muted-foreground mt-2">
                              <span className="font-medium">Иҷрокунандагон:</span>{' '}
                              {assignment.allDepartmentExecutors.join(', ')}
                            </div>
                          )}
                        </div>
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteAssignmentMutation.mutate(assignment.id)}
                            disabled={deleteAssignmentMutation.isPending}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            data-testid={`button-delete-assignment-${assignment.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <AssignmentProgress createdAt={new Date(assignment.createdAt)} deadline={new Date(assignment.deadline)} isCompleted={assignment.isCompleted} />
                      
                      {assignment.attachments && assignment.attachments.length > 0 && (
                        <div className="pt-3 border-t">
                          <div className="flex items-center gap-2 mb-2">
                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              Файлҳои замимашуда
                              {' '}({assignment.attachments.length})
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {assignment.attachments.map((attachment) => (
                              <a
                                key={attachment.id}
                                href={`/api/assignment-attachments/${attachment.id}`}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-md text-sm transition-colors"
                                data-testid={`button-download-attachment-${attachment.id}`}
                              >
                                <Download className="h-4 w-4" />
                                <span className="truncate max-w-[200px]">{attachment.file_name}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({(attachment.fileSize / 1024).toFixed(1)} KB)
                                </span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Show reply status for completed assignments */}
                      {user?.userType === 'department' && assignment.replies?.some(r => r.responderDepartmentId === user?.department?.id) && (
                        <div className="flex gap-2 mt-2">
                          <span className="text-sm text-green-600 flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" />
                            Ҷавоб дода шуд
                          </span>
                        </div>
                      )}
                    </CardContent>
                    
                    {/* Collapsible Replies Section */}
                    {assignment.replies && assignment.replies.length > 0 && (
                      <div className="border-t">
                        <Button
                          variant="ghost"
                          className="w-full flex items-center justify-between py-3 px-6 hover:bg-gray-50"
                          onClick={() => {
                            setExpandedReplies(prev => {
                              const newSet = new Set(prev);
                              if (newSet.has(assignment.id)) {
                                newSet.delete(assignment.id);
                              } else {
                                newSet.add(assignment.id);
                              }
                              return newSet;
                            });
                          }}
                          data-testid={`button-toggle-replies-completed-${assignment.id}`}
                        >
                          <span className="text-sm font-medium">
                            Ҷавобҳо ({assignment.replies.length})
                          </span>
                          {expandedReplies.has(assignment.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                        
                        {expandedReplies.has(assignment.id) && (
                          <div className="px-6 pb-4 space-y-3">
                            {[...assignment.replies]
                              .sort((a, b) => {
                                const aDaavat = assignment.executorIds?.some(eId => {
                                  const person = allPeople.find(p => p.id === eId);
                                  return person?.departmentId === a.responderDepartmentId;
                                }) || false;
                                const bDaavat = assignment.executorIds?.some(eId => {
                                  const person = allPeople.find(p => p.id === eId);
                                  return person?.departmentId === b.responderDepartmentId;
                                }) || false;
                                if (aDaavat && !bDaavat) return -1;
                                if (!aDaavat && bDaavat) return 1;
                                return 0;
                              })
                              .map((reply) => {
                                const responderDept = allDepartments.find(d => d.id === reply.responderDepartmentId);
                                const responderPerson = reply.responderPersonId ? allPeople.find(p => p.id === reply.responderPersonId) : null;
                                const isDaavatReply = assignment.executorIds?.some(eId => {
                                  const person = allPeople.find(p => p.id === eId);
                                  return person?.departmentId === reply.responderDepartmentId;
                                });
                                // Show person name if responderPersonId is set, otherwise show department name
                                const responderName = responderPerson?.name || responderDept?.name || 'Номаълум';
                                return (
                                  <div 
                                    key={reply.id} 
                                    className={`p-3 rounded-lg border ${isDaavatReply ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}
                                    data-testid={`reply-completed-${reply.id}`}
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm">{responderName}</span>
                                        {isDaavatReply && (
                                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Даъват</span>
                                        )}
                                      </div>
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(reply.createdAt).toLocaleDateString('ru-RU')}
                                      </span>
                                    </div>
                                    <p className="text-sm">{reply.replyText}</p>
                                    {reply.attachments && reply.attachments.length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {reply.attachments.map((att: any) => (
                                          <a
                                            key={att.id}
                                            href={`/api/assignment-reply-attachments/${att.id}`}
                                            className="flex items-center gap-1 text-xs bg-white border rounded px-2 py-1 hover:bg-gray-100"
                                            data-testid={`button-download-reply-attachment-completed-${att.id}`}
                                          >
                                            <Download className="h-3 w-3" />
                                            {att.filename}
                                          </a>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
