import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation, type Language } from '@/lib/i18n';
import { ArrowLeft, Plus, LogOut, Download, Paperclip, X, Trash2 } from 'lucide-react';
import bgImage from '@assets/eco-background-light.webp';
import logoImage from '@assets/logo-optimized.webp';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import type { Assignment } from '@shared/schema';
import { Footer } from '@/components/Footer';
import { DatePicker } from '@/components/ui/date-picker';

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

  return (
    <div className="space-y-3">
      <div className="flex gap-4 flex-wrap items-center">
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground font-bold">Мӯҳлати иҷро:</div>
          <div className="bg-gray-100 px-4 py-2 rounded-lg border border-gray-200">
            <div className="text-base font-semibold text-gray-800">{formatDate(deadline)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground font-bold">Боқӣ монд:</div>
          <div className="bg-gray-100 px-4 py-2 rounded-lg border border-gray-200 flex items-baseline gap-1 pl-[16px] pr-[16px] pt-[5px] pb-[5px]">
            <div className="text-2xl font-bold text-gray-800">{isCompleted ? '-' : (isOverdue ? '0' : daysLeft)}</div>
            <div className="text-sm text-muted-foreground">рӯз</div>
          </div>
        </div>
        {isCompleted && (
          <div className="text-green-600 font-semibold">Иҷрошуда!</div>
        )}
        {isOverdue && !isCompleted && (
          <div className="text-red-600 font-semibold">Иҷронашуда!</div>
        )}
      </div>
      <div>
        <div className="text-xs mb-1 font-medium text-muted-foreground">Индикатори иҷроиш:</div>
        <div className="flex gap-[2px] h-8 items-center">
          {Array.from({ length: totalDays }).map((_, index) => {
            // Determine segment color based on whether it's a past or future day
            let segmentColor = '';
            
            if (isCompleted) {
              segmentColor = 'bg-green-500'; // All green if completed
            } else if (index < daysPassed) {
              segmentColor = 'bg-red-500'; // Red for past days
            } else {
              segmentColor = 'bg-green-500'; // Green for future days
            }
            
            return (
              <div
                key={index}
                className={`flex-1 h-full rounded-sm ${segmentColor} transition-all duration-300`}
                data-testid={`progress-segment-${index}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function AssignmentsPage() {
  const [, setLocation] = useLocation();
  const [lang, setLang] = useState<Language>('tg');
  const t = useTranslation(lang);
  const { user } = useAuth();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [selectedExecutors, setSelectedExecutors] = useState<string[]>([]);
  const [deadline, setDeadline] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const { data: assignments = [], isLoading } = useQuery<Assignment[]>({
    queryKey: ['/api/assignments'],
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
      setIsDialogOpen(false);
      setTopic('');
      setSelectedExecutors([]);
      setDeadline('');
      setSelectedFiles([]);
    },
    onError: (error: any) => {
      toast({
        title: lang === 'tg' ? 'Хато' : 'Ошибка',
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
        title: lang === 'tg' ? 'Муваффақият' : 'Успешно',
        description: lang === 'tg' ? 'Супориш иҷро шуд' : 'Поручение выполнено',
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
        title: lang === 'tg' ? 'Муваффақият' : 'Успешно',
        description: lang === 'tg' ? 'Супориш нест карда шуд' : 'Поручение удалено',
      });
    },
    onError: (error: any) => {
      toast({
        title: lang === 'tg' ? 'Хато' : 'Ошибка',
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
          title: lang === 'tg' ? 'Хато' : 'Ошибка',
          description: lang === 'tg' ? 'Шумо танҳо то 5 файл метавонед илова кунед' : 'Вы можете добавить только до 5 файлов',
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
    if (!deadline) {
      toast({
        title: lang === 'tg' ? 'Хато' : 'Ошибка',
        description: lang === 'tg' ? 'Мӯҳлати иҷроро муайян кунед' : 'Укажите срок выполнения',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    formData.append('topic', topic);
    formData.append('executors', JSON.stringify(selectedExecutors));
    formData.append('deadline', deadline);
    
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });

    createAssignmentMutation.mutate(formData);
  };

  const canCreate = user?.userType === 'department' && user.department?.name === 'Раёсати кадрҳо, коргузорӣ ва назорат';
  const canDelete = user?.userType === 'department' && (
    user.department?.name === 'Раёсати назорати давлатии истифода ва ҳифзи ҳавои атмосфера' ||
    user.department?.name === 'Раёсати кадрҳо, коргузорӣ ва назорат'
  );

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
                    {lang === 'tg' ? 'Супоришҳо' : 'Поручения'}
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
              <span>{lang === 'tg' ? 'Баромад' : 'Выход'}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-8 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">{lang === 'tg' ? 'Рӯйхати супоришҳо' : 'Список поручений'}</h2>
          {canCreate && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" data-testid="button-create-assignment">
                  <Plus className="h-4 w-4" />
                  {lang === 'tg' ? 'Супориш' : 'Поручение'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{lang === 'tg' ? 'Эҷоди супориш' : 'Создание поручения'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>{lang === 'tg' ? 'Мавзӯъро интихоб кунед' : 'Выберите тему'}</Label>
                    <Select value={topic} onValueChange={setTopic}>
                      <SelectTrigger data-testid="select-topic">
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
                    <Label>{lang === 'tg' ? 'Иҷрокунандагон' : 'Исполнители'}</Label>
                    <div className="border rounded-md p-4 max-h-60 overflow-y-auto space-y-2">
                      {EXECUTORS_LIST.map((executor) => (
                        <div key={executor} className="flex items-center space-x-2">
                          <Checkbox
                            id={executor}
                            checked={selectedExecutors.includes(executor)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedExecutors([...selectedExecutors, executor]);
                              } else {
                                setSelectedExecutors(selectedExecutors.filter(e => e !== executor));
                              }
                            }}
                            data-testid={`checkbox-executor-${executor}`}
                          />
                          <label htmlFor={executor} className="text-sm cursor-pointer">{executor}</label>
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
                    <Label>{lang === 'tg' ? 'Мӯҳлати иҷро' : 'Срок выполнения'}</Label>
                    <DatePicker
                      value={deadline}
                      onChange={setDeadline}
                      placeholder={lang === 'tg' ? 'Санаро интихоб кунед' : 'Выберите дату'}
                      data-testid="datepicker-deadline"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{lang === 'tg' ? 'Файлҳо' : 'Файлы'}</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="default"
                        onClick={() => document.getElementById('assignment-file-input')?.click()}
                        className="gap-2"
                        data-testid="button-select-files"
                      >
                        <Paperclip className="h-4 w-4" />
                        {lang === 'tg' ? 'Интихоби файл' : 'Выбрать файл'}
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {selectedFiles.length > 0 && `${selectedFiles.length} ${lang === 'tg' ? 'файл' : 'файлов'}`}
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
                      {lang === 'tg' ? 'Бекор кардан' : 'Отмена'}
                    </Button>
                    <Button onClick={handleSubmit} disabled={createAssignmentMutation.isPending}>
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

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">{lang === 'tg' ? 'Боргирӣ...' : 'Загрузка...'}</p>
            </div>
          </div>
        ) : assignments.length === 0 ? (
          <Card className="p-12 text-center bg-white">
            <p className="text-muted-foreground">
              {lang === 'tg' ? 'Ҳанӯз супоришҳо нестанд' : 'Поручений пока нет'}
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
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">{lang === 'tg' ? 'Иҷрокунандагон:' : 'Исполнители:'}</span>{' '}
                        {assignment.executors.join(', ')}
                      </div>
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
                          {lang === 'tg' ? 'Файлҳои замимашуда' : 'Прикрепленные файлы'}
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
                  
                  {!assignment.isCompleted && (
                    <Button
                      onClick={() => completeAssignmentMutation.mutate(assignment.id)}
                      disabled={completeAssignmentMutation.isPending}
                      className="mt-2"
                      data-testid={`button-complete-${assignment.id}`}
                    >
                      {lang === 'tg' ? 'Иҷро шуд' : 'Выполнено'}
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
