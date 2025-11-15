import { useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import MessageListItem from '@/components/MessageListItem';
import { t } from '@/lib/i18n';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Message, Department } from '@shared/schema';
import bgImage from '@assets/eco-background-light.webp';
import logoImage from '@assets/logo-optimized.webp';

export default function AdminDepartmentMessages() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/admin/department/:id');
  const [trashDialogOpen, setTrashDialogOpen] = useState(false);
  const { toast } = useToast();

  const departmentId = params?.id ? parseInt(params.id) : null;

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ['/api/departments'],
  });

  const { data: allMessages = [], isLoading } = useQuery<Message[]>({
    queryKey: ['/api/messages'],
  });

  const { data: deletedMessages = [] } = useQuery<Message[]>({
    queryKey: [`/api/trash/messages/department/${departmentId}`],
    enabled: !!departmentId && trashDialogOpen,
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: async (messageId: number) => {
      return await apiRequest('DELETE', `/api/trash/messages/${messageId}/permanent`, undefined);
    },
    onSuccess: () => {
      toast({
        title: t.success,
        description: "Паём бутаври доимӣ нест карда шуд",
      });
      // Refetch both trash list and main messages list immediately
      queryClient.refetchQueries({ queryKey: [`/api/trash/messages/department/${departmentId}`] });
      queryClient.refetchQueries({ queryKey: ['/api/messages'] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: t.error,
        description: "Хатогӣ ҳангоми нест кардан",
      });
    },
  });

  const department = departments.find((d) => d.id === departmentId);

  // Filter messages for this department (including broadcast messages)
  const receivedMessages = allMessages.filter((msg) => 
    msg.recipientId === departmentId || 
    (msg.recipientIds && msg.recipientIds.includes(departmentId))
  );
  const sentMessages = allMessages.filter((msg) => msg.senderId === departmentId);

  const handleMessageClick = (messageId: number) => {
    console.log('Opening message:', messageId);
    setLocation(`/department/message/${messageId}?from=/admin/department/${departmentId}`);
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
                onClick={() => setLocation('/admin/departments')}
                data-testid="button-back"
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-start gap-2 sm:gap-3 min-w-0 pt-1">
                <img src={logoImage} alt="Логотип" className="hidden sm:block h-10 w-10 object-contain shrink-0" />
                <div className="min-w-0 text-left">
                  <h1 className="text-sm sm:text-base md:text-lg font-semibold text-foreground truncate">
                    {department?.name || 'Шуъба'}
                  </h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">Портали электронӣ - {t.adminPanel}</p>
                </div>
              </div>
            </div>
            <Dialog open={trashDialogOpen} onOpenChange={setTrashDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  data-testid="button-trash"
                  className="shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Сабади хурда ({department?.name})</DialogTitle>
                  <DialogDescription>
                    Паёмҳои нестшудаи ин шуъба. Шумо метавонед онҳоро бутаври доимӣ нест кунед.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 mt-4">
                  {deletedMessages.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Сабади хурда холӣ аст
                    </p>
                  ) : (
                    deletedMessages.map((message) => {
                      const senderDept = departments.find((d) => d.id === message.senderId);
                      const recipientDept = departments.find((d) => d.id === message.recipientId);
                      return (
                        <div
                          key={message.id}
                          className="flex items-center justify-between p-3 border rounded-md hover-elevate"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{message.subject}</p>
                            <p className="text-xs text-muted-foreground">
                              Аз: {senderDept?.name || 'Unknown'} → Ба: {recipientDept?.name || 'Unknown'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Нест шуд: {message.deletedAt ? new Date(message.deletedAt).toLocaleDateString('ru-RU') : ''}
                            </p>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => permanentDeleteMutation.mutate(message.id)}
                            disabled={permanentDeleteMutation.isPending}
                            data-testid={`button-delete-${message.id}`}
                          >
                            Нест кардан
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              </DialogContent>
            </Dialog>
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
                  Гирифташуда
                  {receivedMessages.length > 0 && (
                    <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs text-primary">
                      {receivedMessages.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="sent" data-testid="tab-sent">
                  Фиристодашуда
                  {sentMessages.length > 0 && (
                    <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs text-primary">
                      {sentMessages.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="received" className="mt-0">
              <div className="border-x border-b border-border bg-background/95 backdrop-blur-sm rounded-b-lg min-h-[400px]">
                {receivedMessages.length === 0 ? (
                  <div className="flex items-center justify-center p-12 text-center">
                    <p className="text-muted-foreground">
                      Паёмҳо нестанд
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/30">
                      <div className="col-span-5">Мавзуъ</div>
                      <div className="col-span-3">Фиристанда</div>
                      <div className="col-span-2">Рақами ҳуҷҷат</div>
                      <div className="col-span-2">Сана</div>
                    </div>
                    {receivedMessages.map((message) => {
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
                {sentMessages.length === 0 ? (
                  <div className="flex items-center justify-center p-12 text-center">
                    <p className="text-muted-foreground">
                      Паёмҳо нестанд
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/30">
                      <div className="col-span-5">Мавзуъ</div>
                      <div className="col-span-3">Қабулкунанда</div>
                      <div className="col-span-2">Рақами ҳуҷҷат</div>
                      <div className="col-span-2">Сана</div>
                    </div>
                    {sentMessages.map((message) => {
                      const recipientDept = departments.find((d) => d.id === message.recipientId);
                      return (
                        <MessageListItem
                          key={message.id}
                          id={message.id.toString()}
                          subject={message.subject}
                          sender={recipientDept?.name || 'Unknown'}
                          date={new Date(message.createdAt).toLocaleDateString('ru-RU')}
                          isRead={true}
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
          </Tabs>
        )}
      </main>
    </div>
  );
}
