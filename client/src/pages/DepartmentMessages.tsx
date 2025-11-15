import { useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MessageListItem from '@/components/MessageListItem';
import { t } from '@/lib/i18n';
import { ArrowLeft, PenSquare } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { Message, Department } from '@shared/schema';
import bgImage from '@assets/eco-background-light.webp';
import logoImage from '@assets/logo-optimized.webp';

export default function DepartmentMessages() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/department/messages/:id');

  const departmentId = params?.id ? parseInt(params.id) : null;
  
  // Check if coming from monitoring page
  const urlParams = new URLSearchParams(window.location.search);
  const fromMonitoring = urlParams.get('from') === 'monitoring';
  const backUrl = fromMonitoring ? '/department/monitoring' : '/department/main';

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
    setLocation(`/department/message/${messageId}?from=/department/messages/${departmentId}`);
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
                onClick={() => setLocation(backUrl)}
                data-testid="button-back"
                className="shrink-0 text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <button 
                onClick={() => setLocation(backUrl)}
                className="flex items-start gap-2 sm:gap-3 min-w-0 hover:opacity-80 transition-opacity pt-1"
                data-testid="button-home"
              >
                <img src={logoImage} alt="Логотип" className="hidden sm:block h-10 w-10 object-contain shrink-0 drop-shadow-md" />
                <div className="min-w-0 text-left">
                  <h1 className="text-sm sm:text-base md:text-lg font-semibold text-white drop-shadow-md truncate">
                    {department?.name || 'Шуъба'}
                  </h1>
                  <p className="text-xs text-white/90 drop-shadow-sm hidden sm:block">Портали электронӣ</p>
                </div>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setLocation('/department/compose')}
                data-testid="button-compose"
                className="hidden md:flex items-center gap-2 bg-white/20 text-white hover:bg-white/30 border border-white/30"
              >
                <PenSquare className="h-4 w-4" />
                <span>Ҳуҷҷати нав</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl relative z-10 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Боргирӣ...</p>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="received" className="w-full">
            <div className="bg-background/95 backdrop-blur-sm border-x border-t border-border rounded-t-lg">
              <TabsList className="w-full grid grid-cols-2 h-12">
                <TabsTrigger value="received" data-testid="tab-received">
                  Воридшуда
                  {messages?.received && messages.received.length > 0 && (
                    <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs text-primary">
                      {messages.received.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="sent" data-testid="tab-sent">
                  Ирсолшуда
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
                      Паёмҳо нестанд
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Column Headers - Received */}
                    <div 
                      className="hidden sm:grid border-b border-border px-6 py-3 bg-muted/30 font-semibold text-sm text-muted-foreground items-center gap-x-4"
                      style={{
                        gridTemplateColumns: '120px 1fr 180px 130px 80px'
                      }}
                    >
                      {/* Document Number Header */}
                      <div className="text-center">
                        Рақами ҳуҷҷат
                      </div>
                      
                      {/* Subject Header */}
                      <div className="min-w-0 pl-2">
                        Мавзӯъ ва мундариҷа
                      </div>
                      
                      {/* Sender Header */}
                      <div>
                        Фиристанда
                      </div>
                      
                      {/* Date Header */}
                      <div>
                        Сана
                      </div>
                      
                      {/* Icons Header */}
                      <div />
                    </div>
                    {messages.received.map((message) => {
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
                        documentNumber={message.documentNumber}
                      />
                    );
                  })}
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="sent" className="mt-0">
              <div className="border-x border-b border-border bg-background/95 backdrop-blur-sm rounded-b-lg min-h-[400px]">
                {!messages?.sent || messages.sent.length === 0 ? (
                  <div className="flex items-center justify-center p-12 text-center">
                    <p className="text-muted-foreground">
                      Паёмҳо нестанд
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Column Headers - Sent */}
                    <div 
                      className="hidden sm:grid border-b border-border px-6 py-3 bg-muted/30 font-semibold text-sm text-muted-foreground items-center gap-x-4"
                      style={{
                        gridTemplateColumns: '120px 1fr 180px 130px 80px'
                      }}
                    >
                      {/* Document Number Header */}
                      <div className="text-center">
                        Рақами ҳуҷҷат
                      </div>
                      
                      {/* Subject Header */}
                      <div className="min-w-0 pl-2">
                        Мавзӯъ ва мундариҷа
                      </div>
                      
                      {/* Recipient Header */}
                      <div>
                        Қабулкунанда
                      </div>
                      
                      {/* Date Header */}
                      <div>
                        Сана
                      </div>
                      
                      {/* Icons Header */}
                      <div />
                    </div>
                    {messages.sent.map((message) => {
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
                        documentNumber={message.documentNumber}
                      />
                    );
                  })}
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
