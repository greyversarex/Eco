import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import MessageListItem from '@/components/MessageListItem';
import { useTranslation, type Language } from '@/lib/i18n';
import { ArrowLeft } from 'lucide-react';
import bgImage from '@assets/eco-background-light.webp';
import logoImage from '@assets/logo-optimized.webp';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import type { Message, Department } from '@shared/schema';
import { format } from 'date-fns';

export default function Inbox() {
  const [location, setLocation] = useLocation();
  const [lang, setLang] = useState<Language>('tg');
  const t = useTranslation(lang);
  const { user } = useAuth();

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
      date: format(new Date(msg.documentDate), 'dd.MM.yyyy'),
      isRead: msg.isRead,
      hasAttachment: !!msg.attachmentUrl,
      isSentMessage: isOutbox,
    }));
  }, [filteredMessages, isOutbox, departments]);

  const handleMessageClick = (messageId: string) => {
    setLocation(`/department/message/${messageId}`);
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
                <img src={logoImage} alt="Логотип" className="hidden sm:block h-10 w-10 object-contain shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">{pageTitle}</h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">ЭкоТоҷикистон</p>
                </div>
              </div>
            </div>
            <LanguageSwitcher currentLang={lang} onLanguageChange={setLang} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl relative z-10">
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
            formattedMessages.map((message) => (
              <MessageListItem
                key={message.id}
                {...message}
                onClick={() => handleMessageClick(message.id)}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}
