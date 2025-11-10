import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, RotateCcw, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface Message {
  id: number;
  subject: string;
  content: string;
  senderId: number;
  recipientId: number;
  createdAt: string;
  deletedAt: string | null;
  documentNumber: string | null;
}

interface Assignment {
  id: number;
  title: string;
  description: string;
  dueDate: string | null;
  createdAt: string;
  deletedAt: string | null;
  recipientIds: number[] | null;
}

interface Department {
  id: number;
  name: string;
}

const t = {
  trash: "Корзина",
  messages: "Паёмҳо",
  assignments: "Супоришҳо",
  restore: "Барқарор кардан",
  noDeletedMessages: "Паёмҳои бекоркардашуда нест",
  noDeletedAssignments: "Супоришҳои бекоркардашуда нест",
  loading: "Боргирӣ...",
  success: "Муваффақият",
  restoreSuccess: "Барқарор карда шуд",
  error: "Хатогӣ",
  restoreError: "Хатогӣ ҳангоми барқарор кардан",
  deletedOn: "Бекор карда шуд:",
  subject: "Мавзӯъ",
  from: "Аз",
  to: "Ба",
  title: "Сарлавҳа",
  dueDate: "Мӯҳлат",
  recipients: "Қабулкунандагон",
};

export default function TrashPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"messages" | "assignments">("messages");

  // Fetch deleted messages
  const { data: deletedMessages = [], isLoading: loadingMessages } = useQuery<Message[]>({
    queryKey: ['/api/trash/messages'],
  });

  // Fetch deleted assignments
  const { data: deletedAssignments = [], isLoading: loadingAssignments } = useQuery<Assignment[]>({
    queryKey: ['/api/trash/assignments'],
  });

  // Fetch departments for display names
  const { data: departments = [] } = useQuery<Omit<Department, 'accessCode'>[]>({
    queryKey: ['/api/departments/list'],
  });

  const getDepartmentName = (deptId: number) => {
    const dept = departments.find(d => d.id === deptId);
    return dept?.name || '';
  };

  // Restore message mutation
  const restoreMessageMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('POST', `/api/trash/messages/${id}/restore`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trash/messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      toast({
        title: t.success,
        description: t.restoreSuccess,
      });
    },
    onError: () => {
      toast({
        title: t.error,
        description: t.restoreError,
        variant: 'destructive',
      });
    },
  });

  // Restore assignment mutation
  const restoreAssignmentMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('POST', `/api/trash/assignments/${id}/restore`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trash/assignments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] });
      toast({
        title: t.success,
        description: t.restoreSuccess,
      });
    },
    onError: () => {
      toast({
        title: t.error,
        description: t.restoreError,
        variant: 'destructive',
      });
    },
  });

  const handleRestoreMessage = (id: number) => {
    restoreMessageMutation.mutate(id);
  };

  const handleRestoreAssignment = (id: number) => {
    restoreAssignmentMutation.mutate(id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation('/department/main')}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-md">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <h1 className="text-3xl font-bold">{t.trash}</h1>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "messages" | "assignments")}>
          <TabsList className="mb-6">
            <TabsTrigger value="messages" data-testid="tab-messages">
              {t.messages}
            </TabsTrigger>
            <TabsTrigger value="assignments" data-testid="tab-assignments">
              {t.assignments}
            </TabsTrigger>
          </TabsList>

          {/* Deleted Messages Tab */}
          <TabsContent value="messages">
            <Card className="p-6">
              {loadingMessages ? (
                <div className="flex items-center justify-center p-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">{t.loading}</p>
                  </div>
                </div>
              ) : deletedMessages.length === 0 ? (
                <div className="flex items-center justify-center p-12">
                  <p className="text-muted-foreground">{t.noDeletedMessages}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deletedMessages.map((message) => (
                    <div 
                      key={message.id} 
                      className="p-4 rounded-md border bg-card hover-elevate"
                      data-testid={`message-item-${message.id}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <h3 className="font-semibold text-lg">{message.subject}</h3>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div>{t.from}: {getDepartmentName(message.senderId)}</div>
                            <div>{t.to}: {getDepartmentName(message.recipientId)}</div>
                            {message.deletedAt && (
                              <div className="text-destructive">
                                {t.deletedOn} {format(new Date(message.deletedAt), 'dd.MM.yyyy HH:mm')}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleRestoreMessage(message.id)}
                          disabled={restoreMessageMutation.isPending}
                          data-testid={`button-restore-message-${message.id}`}
                          className="gap-2"
                        >
                          <RotateCcw className="h-4 w-4" />
                          {t.restore}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Deleted Assignments Tab */}
          <TabsContent value="assignments">
            <Card className="p-6">
              {loadingAssignments ? (
                <div className="flex items-center justify-center p-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">{t.loading}</p>
                  </div>
                </div>
              ) : deletedAssignments.length === 0 ? (
                <div className="flex items-center justify-center p-12">
                  <p className="text-muted-foreground">{t.noDeletedAssignments}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deletedAssignments.map((assignment) => (
                    <div 
                      key={assignment.id} 
                      className="p-4 rounded-md border bg-card hover-elevate"
                      data-testid={`assignment-item-${assignment.id}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <h3 className="font-semibold text-lg">{assignment.title}</h3>
                          <div className="text-sm text-muted-foreground space-y-1">
                            {assignment.dueDate && (
                              <div>{t.dueDate}: {format(new Date(assignment.dueDate), 'dd.MM.yyyy')}</div>
                            )}
                            {assignment.recipientIds && assignment.recipientIds.length > 0 && (
                              <div>{t.recipients}: {assignment.recipientIds.map(id => getDepartmentName(id)).join(', ')}</div>
                            )}
                            {assignment.deletedAt && (
                              <div className="text-destructive">
                                {t.deletedOn} {format(new Date(assignment.deletedAt), 'dd.MM.yyyy HH:mm')}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleRestoreAssignment(assignment.id)}
                          disabled={restoreAssignmentMutation.isPending}
                          data-testid={`button-restore-assignment-${assignment.id}`}
                          className="gap-2"
                        >
                          <RotateCcw className="h-4 w-4" />
                          {t.restore}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
