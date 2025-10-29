import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation, type Language } from '@/lib/i18n';
import { ArrowLeft, Plus, LogOut, Trash2 } from 'lucide-react';
import bgImage from '@assets/eco-background-light.webp';
import logoImage from '@assets/logo-optimized.webp';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import type { Announcement } from '@shared/schema';
import { Footer } from '@/components/Footer';
import { format } from 'date-fns';

export default function AnnouncementsPage() {
  const [, setLocation] = useLocation();
  const [lang, setLang] = useState<Language>('tg');
  const t = useTranslation(lang);
  const { user } = useAuth();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const { data: announcements = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ['/api/announcements'],
  });

  // Mark announcements as read when page loads
  useEffect(() => {
    if (announcements.length > 0 && user?.department?.id) {
      const unreadAnnouncements = announcements.filter(
        (announcement) => !announcement.readBy.includes(user.department.id)
      );

      if (unreadAnnouncements.length > 0) {
        const markReadPromises = unreadAnnouncements.map((announcement) =>
          fetch(`/api/announcements/${announcement.id}/mark-read`, {
            method: 'POST',
            credentials: 'include',
          }).catch((error) => {
            console.error(`Failed to mark announcement ${announcement.id} as read:`, error);
          })
        );

        Promise.all(markReadPromises).then(() => {
          queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
          queryClient.invalidateQueries({ queryKey: ['/api/counters'] });
        });
      }
    }
  }, [announcements.map(a => a.id).join(','), user?.department?.id]);

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/announcements/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      queryClient.invalidateQueries({ queryKey: ['/api/counters'] });
      toast({
        title: lang === 'tg' ? 'Муваффақият' : 'Успешно',
        description: lang === 'tg' ? 'Эълон нест карда шуд' : 'Объявление удалено',
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

  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/announcements', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      toast({
        title: lang === 'tg' ? 'Муваффақият' : 'Успешно',
        description: lang === 'tg' ? 'Эълон эҷод шуд' : 'Объявление создано',
      });
      setIsDialogOpen(false);
      setTitle('');
      setContent('');
    },
    onError: (error: any) => {
      toast({
        title: lang === 'tg' ? 'Хато' : 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = () => {
    if (!title.trim()) {
      toast({
        title: lang === 'tg' ? 'Хато' : 'Ошибка',
        description: lang === 'tg' ? 'Сарлавҳаро ворид кунед' : 'Введите заголовок',
        variant: 'destructive',
      });
      return;
    }
    if (!content.trim()) {
      toast({
        title: lang === 'tg' ? 'Хато' : 'Ошибка',
        description: lang === 'tg' ? 'Мазмунро ворид кунед' : 'Введите содержание',
        variant: 'destructive',
      });
      return;
    }

    createAnnouncementMutation.mutate({ title, content });
  };

  const canCreate = user?.userType === 'department' && user.department?.name === 'Раёсати кадрҳо, коргузорӣ ва назорат';
  const canDelete = user?.userType === 'department' && user.department?.name === 'Раёсати назорати давлатии истифода ва ҳифзи ҳавои атмосфера';

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
                    {lang === 'tg' ? 'Эълонҳо' : 'Объявления'}
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
          <h2 className="text-2xl font-bold">{lang === 'tg' ? 'Рӯйхати эълонҳо' : 'Список объявлений'}</h2>
          {canCreate && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" data-testid="button-create-announcement">
                  <Plus className="h-4 w-4" />
                  {lang === 'tg' ? 'Эълон' : 'Объявление'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{lang === 'tg' ? 'Эҷоди эълон' : 'Создание объявления'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>{lang === 'tg' ? 'Сарлавҳа' : 'Заголовок'}</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={lang === 'tg' ? 'Сарлавҳаро ворид кунед' : 'Введите заголовок'}
                      data-testid="input-title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{lang === 'tg' ? 'Мазмун' : 'Содержание'}</Label>
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder={lang === 'tg' ? 'Мазмунро ворид кунед' : 'Введите содержание'}
                      rows={6}
                      data-testid="textarea-content"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      {lang === 'tg' ? 'Бекор кардан' : 'Отмена'}
                    </Button>
                    <Button onClick={handleSubmit} disabled={createAnnouncementMutation.isPending}>
                      {createAnnouncementMutation.isPending
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
        ) : announcements.length === 0 ? (
          <Card className="p-12 text-center bg-white">
            <p className="text-muted-foreground">
              {lang === 'tg' ? 'Ҳанӯз эълонҳо нестанд' : 'Объявлений пока нет'}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <Card key={announcement.id} className="bg-white" data-testid={`announcement-${announcement.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-xl font-semibold flex-1">{announcement.title}</h3>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDateTajik(new Date(announcement.createdAt))}
                      </div>
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAnnouncementMutation.mutate(announcement.id)}
                          disabled={deleteAnnouncementMutation.isPending}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          data-testid={`button-delete-${announcement.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-base leading-relaxed whitespace-pre-line">{announcement.content}</div>
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
