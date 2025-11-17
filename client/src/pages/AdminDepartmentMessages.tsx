import { useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import MessageListItem from '@/components/MessageListItem';
import { t } from '@/lib/i18n';
import { PageHeader, PageHeaderContainer, PageHeaderLeft, PageHeaderRight } from '@/components/PageHeader';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Message, Department, Assignment, Announcement } from '@shared/schema';
import bgImage from '@assets/eco-background-light.webp';
import logoImage from '@assets/logo-optimized.webp';
import { format } from 'date-fns';

export default function AdminDepartmentMessages() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/admin/department/:id');
  const [trashDialogOpen, setTrashDialogOpen] = useState(false);
  const [trashTab, setTrashTab] = useState<'messages' | 'assignments' | 'announcements'>('messages');
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

  const { data: deletedAssignments = [] } = useQuery<Assignment[]>({
    queryKey: [`/api/trash/assignments/department/${departmentId}`],
    enabled: !!departmentId && trashDialogOpen,
  });

  const { data: deletedAnnouncements = [] } = useQuery<Announcement[]>({
    queryKey: [`/api/trash/announcements/department/${departmentId}`],
    enabled: !!departmentId && trashDialogOpen,
  });

  const permanentDeleteMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      return await apiRequest('DELETE', `/api/trash/messages/${messageId}/permanent`, undefined);
    },
    onSuccess: () => {
      toast({
        title: "Муваффақият",
        description: "Паём бутаври доимӣ нест карда шуд",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/trash/messages/department/${departmentId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Хатогӣ",
        description: "Хатогӣ ҳангоми нест кардан",
      });
    },
  });

  const permanentDeleteAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: number) => {
      return await apiRequest('DELETE', `/api/trash/assignments/${assignmentId}/permanent`, undefined);
    },
    onSuccess: () => {
      toast({
        title: "Муваффақият",
        description: "Супориш бутаври доимӣ нест карда шуд",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/trash/assignments/department/${departmentId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Хатогӣ",
        description: "Хатогӣ ҳангоми нест кардан",
      });
    },
  });

  const permanentDeleteAnnouncementMutation = useMutation({
    mutationFn: async (announcementId: number) => {
      return await apiRequest('DELETE', `/api/trash/announcements/${announcementId}/permanent`, undefined);
    },
    onSuccess: () => {
      toast({
        title: "Муваффақият",
        description: "Эълон бутаври доимӣ нест карда шуд",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/trash/announcements/department/${departmentId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Хатогӣ",
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
      <PageHeader variant="admin">
        <PageHeaderContainer>
          <PageHeaderLeft>
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
          </PageHeaderLeft>
          <PageHeaderRight>
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
                    Ҳуҷҷатҳо, супоришҳо ва эълонҳои нестшудаи ин шуъба. Шумо метавонед онҳоро бутаври доимӣ нест кунед.
                  </DialogDescription>
                </DialogHeader>

                {/* Section Filter Buttons */}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant={trashTab === 'messages' ? 'default' : 'outline'}
                    onClick={() => setTrashTab('messages')}
                    size="sm"
                    data-testid="button-filter-messages"
                    className="flex-1"
                  >
                    Ҳуҷҷатҳо
                    {deletedMessages.length > 0 && (
                      <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs">
                        {deletedMessages.length}
                      </span>
                    )}
                  </Button>
                  <Button
                    variant={trashTab === 'assignments' ? 'default' : 'outline'}
                    onClick={() => setTrashTab('assignments')}
                    size="sm"
                    data-testid="button-filter-assignments"
                    className="flex-1"
                  >
                    Супоришҳо
                    {deletedAssignments.length > 0 && (
                      <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs">
                        {deletedAssignments.length}
                      </span>
                    )}
                  </Button>
                  <Button
                    variant={trashTab === 'announcements' ? 'default' : 'outline'}
                    onClick={() => setTrashTab('announcements')}
                    size="sm"
                    data-testid="button-filter-announcements"
                    className="flex-1"
                  >
                    Эълонҳо
                    {deletedAnnouncements.length > 0 && (
                      <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs">
                        {deletedAnnouncements.length}
                      </span>
                    )}
                  </Button>
                </div>

                <div className="space-y-2 mt-4">
                  {/* Messages Section */}
                  {trashTab === 'messages' && (
                    <>
                      {deletedMessages.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          Ҳуҷҷатҳои нестшуда нест
                        </p>
                      ) : (
                        deletedMessages.map((message) => {
                          const senderDept = departments.find((d) => d.id === message.senderId);
                          const senderName = message.senderId === null ? 'Системавӣ' : (senderDept?.name || 'Номаълум');
                          
                          let recipientName = '';
                          if (message.recipientIds && message.recipientIds.length > 0) {
                            const recipientNames = message.recipientIds
                              .map((id: number) => departments.find((d) => d.id === id)?.name)
                              .filter((name: string | undefined): name is string => !!name);
                            recipientName = recipientNames.length > 0 ? recipientNames.join(', ') : 'Номаълум';
                          } else if (message.recipientId) {
                            const recipientDept = departments.find((d) => d.id === message.recipientId);
                            recipientName = recipientDept?.name || 'Номаълум';
                          } else {
                            recipientName = 'Ҳама шуъбаҳо';
                          }
                          
                          return (
                            <div key={message.id} className="flex items-center justify-between p-3 border rounded-md hover-elevate">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{message.subject}</p>
                                <p className="text-xs text-muted-foreground">
                                  Аз: {senderName} → Ба: {recipientName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Нест шуд: {message.deletedAt ? new Date(message.deletedAt).toLocaleDateString('ru-RU') : ''}
                                </p>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => permanentDeleteMessageMutation.mutate(message.id)}
                                disabled={permanentDeleteMessageMutation.isPending}
                                data-testid={`button-delete-message-${message.id}`}
                              >
                                Нест кардан
                              </Button>
                            </div>
                          );
                        })
                      )}
                    </>
                  )}

                  {/* Assignments Section */}
                  {trashTab === 'assignments' && (
                    <>
                      {deletedAssignments.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          Супоришҳои нестшуда нест
                        </p>
                      ) : (
                        deletedAssignments.map((assignment) => {
                          const senderName = assignment.senderId 
                            ? departments.find(d => d.id === assignment.senderId)?.name || 'Номаълум'
                            : 'Системавӣ';
                          
                          const recipientNames = assignment.recipientIds
                            ? assignment.recipientIds
                                .map(id => departments.find(d => d.id === id)?.name)
                                .filter((name): name is string => !!name)
                            : [];

                          return (
                            <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-md hover-elevate">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{assignment.topic}</p>
                                <p className="text-xs text-muted-foreground">
                                  Аз: {senderName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Қабулкунандагон: {recipientNames.length > 0 ? recipientNames.join(', ') : 'Номаълум'}
                                </p>
                                {assignment.deadline && (
                                  <p className="text-xs text-muted-foreground">
                                    Мӯҳлат: {format(new Date(assignment.deadline), 'dd.MM.yyyy')}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  Нест шуд: {assignment.deletedAt ? new Date(assignment.deletedAt).toLocaleDateString('ru-RU') : ''}
                                </p>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => permanentDeleteAssignmentMutation.mutate(assignment.id)}
                                disabled={permanentDeleteAssignmentMutation.isPending}
                                data-testid={`button-delete-assignment-${assignment.id}`}
                              >
                                Нест кардан
                              </Button>
                            </div>
                          );
                        })
                      )}
                    </>
                  )}

                  {/* Announcements Section */}
                  {trashTab === 'announcements' && (
                    <>
                      {deletedAnnouncements.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          Эълонҳои нестшуда нест
                        </p>
                      ) : (
                        deletedAnnouncements.map((announcement) => {
                          const recipientNames = announcement.recipientIds
                            ? announcement.recipientIds
                                .map(id => departments.find(d => d.id === id)?.name)
                                .filter((name): name is string => !!name)
                            : [];

                          return (
                            <div key={announcement.id} className="flex items-center justify-between p-3 border rounded-md hover-elevate">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{announcement.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  Барои: {recipientNames.length > 0 ? recipientNames.join(', ') : 'Ҳама шуъбаҳо'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Нест шуд: {announcement.deletedAt ? new Date(announcement.deletedAt).toLocaleDateString('ru-RU') : ''}
                                </p>
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => permanentDeleteAnnouncementMutation.mutate(announcement.id)}
                                disabled={permanentDeleteAnnouncementMutation.isPending}
                                data-testid={`button-delete-announcement-${announcement.id}`}
                              >
                                Нест кардан
                              </Button>
                            </div>
                          );
                        })
                      )}
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </PageHeaderRight>
        </PageHeaderContainer>
      </PageHeader>

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
                    {receivedMessages.map((message) => {
                      const senderDept = departments.find((d) => d.id === message.senderId);
                      const senderName = message.senderId === null 
                        ? 'Системавӣ' 
                        : (senderDept?.name || 'Номаълум');
                      return (
                        <MessageListItem
                          key={message.id}
                          id={message.id.toString()}
                          subject={message.subject}
                          sender={senderName}
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
                    {sentMessages.map((message) => {
                      let recipientNames: string[] = [];
                      
                      // Check recipientIds array first (broadcast to multiple departments)
                      if (message.recipientIds && message.recipientIds.length > 0) {
                        recipientNames = message.recipientIds
                          .map((id: number) => departments.find((d) => d.id === id)?.name)
                          .filter((name: string | undefined): name is string => !!name);
                      } else if (message.recipientId) {
                        // Single recipient (legacy)
                        const recipientDept = departments.find((d) => d.id === message.recipientId);
                        if (recipientDept?.name) {
                          recipientNames = [recipientDept.name];
                        }
                      } else {
                        // Broadcast to all departments (recipientId and recipientIds both null/empty)
                        recipientNames = ['Ҳама шуъбаҳо'];
                      }
                      
                      return (
                        <MessageListItem
                          key={message.id}
                          id={message.id.toString()}
                          subject={message.subject}
                          sender={recipientNames.join(', ')}
                          recipientNames={recipientNames}
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
