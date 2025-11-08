import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { t } from '@/lib/i18n';
import { ArrowLeft, Plus, LogOut, Download, Paperclip, X, Trash2, CalendarDays, Clock } from 'lucide-react';
import bgImage from '@assets/eco-background-light.webp';
import logoImage from '@assets/logo-optimized.webp';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import type { Assignment, Person, Department } from '@shared/schema';
import { Footer } from '@/components/Footer';
import { DatePicker } from '@/components/ui/date-picker';

const ASSIGNMENT_TOPICS = [
  'Нақшаи корӣ',
  'Протоколи назоратӣ',
  'Қарорҳои ҳайати мушовара',
  'Протоколҳои ҷаласаҳои ҳайати мушовара',
];


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
            
            // Calculate dynamic color percentages
            let greenPercent, yellowPercent, redPercent;
            
            if (progressPercent <= 50) {
              greenPercent = 33.33 - (progressPercent / 50 * 33.33);
              yellowPercent = 33.33 + (progressPercent / 50 * 16.67);
              redPercent = 33.33 + (progressPercent / 50 * 16.67);
            } else {
              greenPercent = 0;
              const secondHalfProgress = progressPercent - 50;
              yellowPercent = 50 - (secondHalfProgress / 50 * 50);
              redPercent = 50 + (secondHalfProgress / 50 * 50);
            }

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
      <div className="flex justify-between text-sm font-medium text-gray-600">
        <span>{daysPassed} рӯз гузашт</span>
        <span>{daysLeft} рӯз боқӣ</span>
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
  const [topic, setTopic] = useState('');
  const [content, setContent] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [selectedExecutors, setSelectedExecutors] = useState<string[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);
  const [deadline, setDeadline] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const { data: assignments = [], isLoading } = useQuery<Assignment[]>({
    queryKey: ['/api/assignments'],
  });

  const { data: departments = [], isLoading: loadingDepartments } = useQuery<Department[]>({
    queryKey: ['/api/departments/list'],
  });

  const { data: allPeople = [] } = useQuery<Person[]>({
    queryKey: ['/api/people'],
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
      setIsDialogOpen(false);
      setTopic('');
      setContent('');
      setDocumentNumber('');
      setSelectedExecutors([]);
      setSelectedRecipients([]);
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
    if (!topic) {
      toast({
        title: 'Хато',
        description: 'Мавзӯъро интихоб кунед',
        variant: 'destructive',
      });
      return;
    }
    if (selectedExecutors.length === 0) {
      toast({
        title: 'Хато',
        description: 'Иҷрокунандагонро интихоб кунед',
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
    if (!deadline) {
      toast({
        title: 'Хато',
        description: 'Мӯҳлати иҷроро муайян кунед',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    formData.append('topic', topic);
    if (content) {
      formData.append('content', content);
    }
    if (documentNumber) {
      formData.append('documentNumber', documentNumber);
    }
    formData.append('executors', JSON.stringify(selectedExecutors));
    formData.append('recipientIds', JSON.stringify(selectedRecipients));
    formData.append('deadline', deadline);
    
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });

    createAssignmentMutation.mutate(formData);
  };

  // Check permissions from database
  const canCreate = user?.userType === 'department' && user.department?.canCreateAssignment;
  const canDelete = user?.userType === 'department' && user.department?.canCreateAssignment;

  return (
    <div
      className="min-h-screen flex flex-col bg-cover bg-center bg-fixed relative"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0" style={{ background: 'rgba(255, 255, 255, 0.92)' }} />
      
      <header
        className="sticky top-0 z-50 border-b border-border/20 backdrop-blur-md relative"
        style={{ background: 'linear-gradient(135deg, #4a9d4a 0%, #5cb85c 50%, #6fca6f 100%)' }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
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
                  <p className="text-xs text-white/90 drop-shadow-sm">Портали электронӣ</p>
                </div>
              </button>
            </div>
            <Button
              size="sm"
              onClick={() => {
                fetch('/api/auth/logout', { method: 'POST' }).then(() => setLocation('/'));
              }}
              className="flex items-center gap-2 bg-red-500/90 hover:bg-red-600 text-white"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
              <span>Баромад</span>
            </Button>
          </div>
        </div>
      </header>

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
                  <DialogTitle>Эҷоди супориш</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Мавзӯъро интихоб кунед</Label>
                    <Select value={topic} onValueChange={setTopic}>
                      <SelectTrigger data-testid="select-topic">
                        <SelectValue placeholder="Интихоб кунед" />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSIGNMENT_TOPICS.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Мазмуни супоришҳои додашуда</Label>
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
                    <Label>Иҷрокунандагон</Label>
                    {selectedRecipients.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Аввал гирандаро интихоб кунед
                      </p>
                    ) : (
                      <>
                        <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
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
                                    <div key={person.id} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`executor-${person.id}`}
                                        checked={selectedExecutors.includes(person.name)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setSelectedExecutors([...selectedExecutors, person.name]);
                                          } else {
                                            setSelectedExecutors(selectedExecutors.filter(e => e !== person.name));
                                          }
                                        }}
                                        data-testid={`checkbox-executor-${person.id}`}
                                      />
                                      <label htmlFor={`executor-${person.id}`} className="text-sm cursor-pointer">
                                        {person.name}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                          {allPeople.filter(p => selectedRecipients.includes(p.departmentId)).length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Иҷрокунандае дар ин шуъбаҳо нест
                            </p>
                          )}
                        </div>
                        {selectedExecutors.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            Интихоб шуд: {selectedExecutors.length}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Гирандагон</Label>
                    {loadingDepartments ? (
                      <div className="text-sm text-muted-foreground">Боргирӣ...</div>
                    ) : (
                      <div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const allDeptIds = departments.map(dept => dept.id);
                            if (selectedRecipients.length === allDeptIds.length) {
                              setSelectedRecipients([]);
                            } else {
                              setSelectedRecipients(allDeptIds);
                            }
                          }}
                          className="mb-2"
                          data-testid="button-select-all-recipients"
                        >
                          {selectedRecipients.length === departments.length
                            ? 'Бекор кардан'
                            : 'Ҳамаро қайд кардан'}
                        </Button>
                        <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {departments
                              .sort((a: any, b: any) => {
                                const blockOrder = { upper: 0, middle: 1, lower: 2, district: 3 };
                                return blockOrder[a.block as keyof typeof blockOrder] - blockOrder[b.block as keyof typeof blockOrder];
                              })
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
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Бекор кардан
                    </Button>
                    <Button onClick={handleSubmit} disabled={createAssignmentMutation.isPending}>
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

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Боргирӣ...</p>
            </div>
          </div>
        ) : assignments.length === 0 ? (
          <Card className="p-12 text-center bg-white">
            <p className="text-muted-foreground">
              Ҳанӯз супоришҳо нестанд
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <Card key={assignment.id} className="bg-white" data-testid={`assignment-${assignment.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{assignment.topic}</h3>
                      <div className="text-sm text-muted-foreground mt-2">
                        <span className="font-medium">Иҷрокунандагон:</span>{' '}
                        {assignment.executors.join(', ')}
                      </div>
                      {assignment.content && (
                        <div className="mt-3">
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            Мазмуни супоришҳои додашуда:
                          </div>
                          <div className="text-sm text-foreground bg-white p-3 rounded-md border border-primary/20 whitespace-pre-wrap">
                            {assignment.content}
                          </div>
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
                  
                  {!assignment.isCompleted && new Date() <= new Date(assignment.deadline) && (
                    <Button
                      onClick={() => completeAssignmentMutation.mutate(assignment.id)}
                      disabled={completeAssignmentMutation.isPending}
                      className="mt-2"
                      data-testid={`button-complete-${assignment.id}`}
                    >
                      Иҷро шуд
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
