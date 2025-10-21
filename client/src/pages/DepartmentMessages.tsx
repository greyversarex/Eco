import { useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import MessageListItem from '@/components/MessageListItem';
import { useTranslation, type Language } from '@/lib/i18n';
import { ArrowLeft, Leaf } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { Message, Department } from '@shared/schema';
import bgImage from '@assets/eco-background-light.webp';

export default function DepartmentMessages() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/department/messages/:id');
  const [lang, setLang] = useState<Language>('tg');
  const t = useTranslation(lang);

  const departmentId = params?.id ? parseInt(params.id) : null;

  const { data: departments = [] } = useQuery<Omit<Department, 'accessCode'>[]>({
    queryKey: ['/api/departments/list'],
  });

  const { data: messages, isLoading } = useQuery<{ received: Message[]; sent: Message[] }>({
    queryKey: ['/api/messages/department', departmentId],
    enabled: !!departmentId,
  });

  const department = departments.find((d) => d.id === departmentId);

  const handleMessageClick = (messageId: number) => {
    console.log('Opening message:', messageId);
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
                <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
                  <Leaf className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-base md:text-lg font-semibold text-foreground truncate">
                    {department?.name || (lang === 'tg' ? 'Шуъба' : 'Отдел')}
                  </h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">ЭкоТочикистон</p>
                </div>
              </div>
            </div>
            <LanguageSwitcher currentLang={lang} onLanguageChange={setLang} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl relative z-10 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">{lang === 'tg' ? 'Боргирӣ...' : 'Загрузка...'}</p>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="received" className="w-full">
            <div className="bg-background/95 backdrop-blur-sm border-x border-t border-border rounded-t-lg">
              <TabsList className="w-full grid grid-cols-2 h-12">
                <TabsTrigger value="received" data-testid="tab-received">
                  {lang === 'tg' ? 'Гирифташуда' : 'Полученные'}
                  {messages?.received && messages.received.length > 0 && (
                    <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs text-primary">
                      {messages.received.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="sent" data-testid="tab-sent">
                  {lang === 'tg' ? 'Фиристодашуда' : 'Отправленные'}
                  {messages?.sent && messages.sent.length > 0 && (
                    <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs text-primary">
                      {messages.sent.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="received" className="mt-0">
              <div className="border-x border-b border-border bg-background/95 backdrop-blur-sm rounded-b-lg min-h-[400px]">
                {!messages?.received || messages.received.length === 0 ? (
                  <div className="flex items-center justify-center p-12 text-center">
                    <p className="text-muted-foreground">
                      {lang === 'tg' ? 'Паёмҳо нестанд' : 'Нет сообщений'}
                    </p>
                  </div>
                ) : (
                  messages.received.map((message) => {
                    const senderDept = departments.find((d) => d.id === message.senderId);
                    return (
                      <MessageListItem
                        key={message.id}
                        id={message.id.toString()}
                        subject={message.subject}
                        sender={senderDept?.name || 'Unknown'}
                        date={new Date(message.createdAt).toLocaleDateString('ru-RU')}
                        isRead={message.isRead}
                        hasAttachment={!!message.attachmentUrl}
                        onClick={() => handleMessageClick(message.id)}
                      />
                    );
                  })
                )}
              </div>
            </TabsContent>

            <TabsContent value="sent" className="mt-0">
              <div className="border-x border-b border-border bg-background/95 backdrop-blur-sm rounded-b-lg min-h-[400px]">
                {!messages?.sent || messages.sent.length === 0 ? (
                  <div className="flex items-center justify-center p-12 text-center">
                    <p className="text-muted-foreground">
                      {lang === 'tg' ? 'Паёмҳо нестанд' : 'Нет сообщений'}
                    </p>
                  </div>
                ) : (
                  messages.sent.map((message) => {
                    const recipientDept = departments.find((d) => d.id === message.recipientId);
                    return (
                      <MessageListItem
                        key={message.id}
                        id={message.id.toString()}
                        subject={message.subject}
                        sender={recipientDept?.name || 'Unknown'}
                        date={new Date(message.createdAt).toLocaleDateString('ru-RU')}
                        isRead={message.isRead}
                        hasAttachment={!!message.attachmentUrl}
                        onClick={() => handleMessageClick(message.id)}
                        isSentMessage={true}
                      />
                    );
                  })
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
