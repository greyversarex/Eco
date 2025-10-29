import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import MessageListItem from '@/components/MessageListItem';
import { useTranslation, type Language } from '@/lib/i18n';
import { ArrowLeft, Trash2, LogOut } from 'lucide-react';
import bgImage from '@assets/eco-background-light.webp';
import logoImage from '@assets/logo-optimized.webp';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import type { Message, Department } from '@shared/schema';
import { format } from 'date-fns';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Footer } from '@/components/Footer';

export default function Inbox() {
  const [location, setLocation] = useLocation();
  const [lang, setLang] = useState<Language>('tg');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const t = useTranslation(lang);
  const { user } = useAuth();
  const { toast } = useToast();

  const isOutbox = location === '/department/outbox';
  const pageTitle = isOutbox ? t.outbox : t.inbox;

  const { data: messages = [], isLoading: loadingMessages } = useQuery<Message[]>({
    queryKey: ['/api/messages'],
  });

  const { data: departments = [], isLoading: loadingDepartments } = useQuery<Omit<Department, 'accessCode'>[]>({
    queryKey: ['/api/departments/list'],
  });

  const getDepartmentName = (deptId: number) => {
    const dept = departments.find(d => d.id === deptId);
    return dept?.name || '';
  };

  const filteredMessages = useMemo(() => {
    if (!user || user.userType !== 'department') return [];
    if (!Array.isArray(messages)) return [];
    
    const currentDeptId = user.department.id;
    
    if (isOutbox) {
      return messages.filter(msg => msg.senderId === currentDeptId);
    } else {
      return messages.filter(msg => msg.recipientId === currentDeptId);
    }
  }, [messages, user, isOutbox]);

  const formattedMessages = useMemo(() => {
    return filteredMessages.map(msg => ({
      id: msg.id.toString(),
      subject: msg.subject,
      sender: isOutbox 
        ? getDepartmentName(msg.recipientId)
        : getDepartmentName(msg.senderId),
      date: format(new Date(msg.documentDate), 'd. M. yyyy'),
      isRead: msg.isRead,
      hasAttachment: !!msg.attachmentUrl,
      isSentMessage: isOutbox,
    }));
  }, [filteredMessages, isOutbox, departments]);

  const bulkDeleteMutation = useMutation({
    mutationFn: async (messageIds: number[]) => {
      return apiRequest('POST', '/api/messages/bulk-delete', { messageIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      setSelectedIds(new Set());
      setIsDeleteMode(false);
      toast({
        title: lang === 'tg' ? 'Муваффақият' : 'Успешно',
        description: lang === 'tg' ? 'Паёмҳо нест карда шуданд' : 'Сообщения удалены',
      });
    },
    onError: () => {
      toast({
        title: lang === 'tg' ? 'Хатогӣ' : 'Ошибка',
        description: lang === 'tg' ? 'Хатогӣ ҳангоми нест кардан' : 'Ошибка при удалении',
        variant: 'destructive',
      });
    },
  });

  const handleToggleSelect = (messageId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === formattedMessages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(formattedMessages.map(m => m.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    
    const confirmMessage = lang === 'tg' 
      ? `Шумо мутмаин ҳастед, ки мехоҳед ${selectedIds.size} паёмро нест кунед?`
      : `Вы уверены, что хотите удалить ${selectedIds.size} сообщений?`;
    
    if (confirm(confirmMessage)) {
      const messageIds = Array.from(selectedIds).map(id => parseInt(id, 10));
      bulkDeleteMutation.mutate(messageIds);
    }
  };
  
  const handleToggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode);
    if (isDeleteMode) {
      setSelectedIds(new Set());
    }
  };

  const handleMessageClick = (messageId: string) => {
    const fromPath = isOutbox ? '/department/outbox' : '/department/inbox';
    setLocation(`/department/message/${messageId}?from=${fromPath}`);
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
                <img src={logoImage} alt="Логотип" className="hidden sm:block h-10 w-10 object-contain shrink-0 drop-shadow-md" />
                <div className="min-w-0 text-left">
                  <h1 className="text-base sm:text-lg font-semibold text-white drop-shadow-md truncate">{pageTitle}</h1>
                  <p className="text-xs text-white/90 drop-shadow-sm hidden sm:block">Портали электронӣ</p>
                </div>
              </button>
            </div>
            <div className="flex items-center gap-2">
              {!isDeleteMode ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleDeleteMode}
                  data-testid="button-toggle-delete"
                  className="gap-1 text-white hover:bg-red-500/20"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {lang === 'tg' ? 'Нест кардан' : 'Удалить'}
                  </span>
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={selectedIds.size === 0 || bulkDeleteMutation.isPending}
                    data-testid="button-bulk-delete"
                    className="gap-1 text-white hover:bg-green-600/20"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {lang === 'tg' ? 'Нест кардан' : 'Удалить'} {selectedIds.size > 0 && `(${selectedIds.size})`}
                    </span>
                    <span className="sm:hidden">{selectedIds.size > 0 && `(${selectedIds.size})`}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleDeleteMode}
                    data-testid="button-cancel-delete"
                    className="gap-1 text-white hover:bg-white/20"
                  >
                    {lang === 'tg' ? 'Бекор кардан' : 'Отмена'}
                  </Button>
                </>
              )}
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

      <main className="mx-auto max-w-6xl relative z-10">
        <div className="border-x border-border bg-background/95 backdrop-blur-sm min-h-screen">
          {loadingMessages || loadingDepartments ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-muted-foreground">{lang === 'tg' ? 'Боргирӣ...' : 'Загрузка...'}</p>
              </div>
            </div>
          ) : formattedMessages.length === 0 ? (
            <div className="flex items-center justify-center p-12">
              <p className="text-muted-foreground">
                {lang === 'tg' ? 'Паёме нест' : 'Нет сообщений'}
              </p>
            </div>
          ) : (
            <>
              {isDeleteMode && (
                <div className="border-b border-border px-4 py-2 bg-muted/30">
                  <Button
                    size="sm"
                    onClick={handleSelectAll}
                    data-testid="button-select-all"
                    className="gap-2 bg-green-600 text-white hover:bg-green-700 border-0 font-medium shadow-sm"
                  >
                    {selectedIds.size === formattedMessages.length
                      ? (lang === 'tg' ? 'Бекор кардани интихоб' : 'Снять выделение')
                      : (lang === 'tg' ? 'Ҳамаро қайд кардан' : 'Выбрать все')}
                  </Button>
                </div>
              )}
              {formattedMessages.map((message) => (
                <MessageListItem
                  key={message.id}
                  {...message}
                  onClick={() => handleMessageClick(message.id)}
                  selectable={isDeleteMode}
                  isSelected={selectedIds.has(message.id)}
                  onToggleSelect={() => handleToggleSelect(message.id)}
                />
              ))}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
