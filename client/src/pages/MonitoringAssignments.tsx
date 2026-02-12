import { useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Building2, Calendar, Clock, Users, Check, X, Paperclip, Download, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { Department } from '@shared/schema';
import bgImage from '@assets/eco-background-light.webp';
import logoImage from '@assets/logo-optimized.webp';
import { PageHeader, PageHeaderContainer, PageHeaderLeft, PageHeaderRight } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';

interface AssignmentWithDetails {
  id: number;
  subject: string;
  content: string;
  senderId: number;
  recipientIds: number[] | null;
  deadline: string;
  createdAt: string;
  isCompleted: boolean;
  approvalStatus: string | null;
  executorNames?: string[];
  topicName?: string;
  documentNumber?: string | null;
  attachments?: { id: number; file_name: string; fileSize: number }[];
}

function getStampInfo(assignment: AssignmentWithDetails): { type: 'approved' | 'rejected' | 'overdue'; label: string } | null {
  if (assignment.approvalStatus === 'approved' || assignment.isCompleted) {
    return { type: 'approved', label: 'ИҶРО ШУД' };
  }
  if (assignment.approvalStatus === 'rejected') {
    return { type: 'rejected', label: 'РАД ШУД' };
  }
  const deadlineDate = new Date(assignment.deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (today > deadlineDate) {
    return { type: 'overdue', label: 'ИҶРОНАШУДА' };
  }
  return null;
}

function StampBadge({ stamp }: { stamp: { type: 'approved' | 'rejected' | 'overdue'; label: string } }) {
  const isGreen = stamp.type === 'approved';
  return (
    <div 
      className={`
        w-14 h-14 rounded-full flex flex-col items-center justify-center
        transform rotate-[-12deg] font-bold shrink-0
        ${isGreen ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}
      `}
      style={{
        borderWidth: '3px',
        borderStyle: 'solid',
        borderColor: isGreen ? '#16a34a' : '#dc2626',
        boxShadow: isGreen
          ? '0 0 8px rgba(22, 163, 74, 0.4)'
          : '0 0 8px rgba(220, 38, 38, 0.4)'
      }}
    >
      {isGreen ? (
        <Check className="h-5 w-5 stroke-[3]" />
      ) : (
        <X className="h-5 w-5 stroke-[3]" />
      )}
      <span className="text-[7px] leading-tight text-center font-bold">
        {stamp.label}
      </span>
    </div>
  );
}

export default function MonitoringAssignments() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/department/monitoring/assignments/:id');
  const departmentId = params?.id ? parseInt(params.id) : null;
  const [activeTab, setActiveTab] = useState('sent');

  const { data: departments = [] } = useQuery<Omit<Department, 'accessCode'>[]>({
    queryKey: ['/api/departments/all'],
  });

  const department = departments.find((d) => d.id === departmentId);

  const { data: assignments = [], isLoading } = useQuery<AssignmentWithDetails[]>({
    queryKey: [`/api/monitoring/department/${departmentId}/assignments`],
    enabled: !!departmentId,
  });

  const sentAssignments = assignments.filter(a => a.senderId === departmentId);
  const receivedAssignments = assignments.filter(a => a.recipientIds?.includes(departmentId!) && a.senderId !== departmentId);

  const getDepartmentName = (id: number) => departments.find(d => d.id === id)?.name || 'Номаълум';

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const isOverdue = (deadline: string, isCompleted: boolean, approvalStatus: string | null) => {
    if (isCompleted || approvalStatus === 'approved') return false;
    const d = new Date(deadline);
    d.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today > d;
  };

  const renderAssignment = (assignment: AssignmentWithDetails) => {
    const stamp = getStampInfo(assignment);
    const overdue = isOverdue(assignment.deadline, assignment.isCompleted, assignment.approvalStatus);

    return (
      <Card key={assignment.id} className={`${overdue ? 'border-red-300' : ''}`} data-testid={`card-monitoring-assignment-${assignment.id}`}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {assignment.documentNumber && (
                  <Badge variant="outline" className="shrink-0 text-xs">
                    №{assignment.documentNumber}
                  </Badge>
                )}
                <h3 className="font-semibold text-base truncate">{assignment.subject}</h3>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {getDepartmentName(assignment.senderId)}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(assignment.createdAt)}
                </span>
                <span className={`flex items-center gap-1 ${overdue ? 'text-red-600 font-medium' : ''}`}>
                  <Clock className="h-3.5 w-3.5" />
                  {formatDate(assignment.deadline)}
                  {overdue && <AlertTriangle className="h-3.5 w-3.5" />}
                </span>
              </div>
              {assignment.recipientIds && assignment.recipientIds.length > 0 && (
                <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                  <Users className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">
                    {assignment.recipientIds.map(id => getDepartmentName(id)).join(', ')}
                  </span>
                </div>
              )}
            </div>
            {stamp && <StampBadge stamp={stamp} />}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {assignment.content && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {assignment.content.replace(/<[^>]*>/g, '').substring(0, 200)}
            </p>
          )}
          {assignment.attachments && assignment.attachments.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Paperclip className="h-3.5 w-3.5" />
              <span>{assignment.attachments.length} файл(ҳо)</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed relative"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0" style={{ background: 'rgba(255, 255, 255, 0.92)' }} />
      <PageHeader variant="department">
        <PageHeaderContainer className="px-3 sm:px-4 md:px-6 lg:px-8">
          <PageHeaderLeft className="gap-2 sm:gap-4 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation(`/department/messages/${departmentId}?from=monitoring`)}
              data-testid="button-back"
              className="shrink-0 text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <button 
              onClick={() => setLocation(`/department/messages/${departmentId}?from=monitoring`)}
              className="flex items-start gap-2 sm:gap-3 min-w-0 hover:opacity-80 transition-opacity pt-1"
              data-testid="button-home"
            >
              <img src={logoImage} alt="Логотип" className="hidden sm:block h-10 w-10 object-contain shrink-0 drop-shadow-md" />
              <div className="min-w-0 text-left">
                <h1 className="text-sm sm:text-base md:text-lg font-semibold text-white drop-shadow-md truncate">
                  {department?.name || 'Шуъба'} - Супоришҳо
                </h1>
                <p className="text-xs text-white/90 drop-shadow-sm hidden sm:block">EcoDoc - Портали электронӣ</p>
              </div>
            </button>
          </PageHeaderLeft>
        </PageHeaderContainer>
      </PageHeader>

      <main className="mx-auto max-w-6xl relative z-10 py-6 px-4 sm:px-0">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Боргирӣ...</p>
            </div>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="bg-background/95 backdrop-blur-sm border-x border-t border-border rounded-t-lg">
              <TabsList className="w-full grid grid-cols-2 h-12">
                <TabsTrigger value="sent" data-testid="tab-sent-assignments">
                  Ирсолшуда
                  {sentAssignments.length > 0 && (
                    <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs text-primary">
                      {sentAssignments.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="received" data-testid="tab-received-assignments">
                  Воридшуда
                  {receivedAssignments.length > 0 && (
                    <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs text-primary">
                      {receivedAssignments.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="sent" className="mt-0">
              <div className="border-x border-b border-border bg-background/95 backdrop-blur-sm rounded-b-lg min-h-[400px] p-4 space-y-3">
                {sentAssignments.length === 0 ? (
                  <div className="flex items-center justify-center p-12 text-center">
                    <p className="text-muted-foreground">Супоришҳо нестанд</p>
                  </div>
                ) : (
                  sentAssignments.map(renderAssignment)
                )}
              </div>
            </TabsContent>

            <TabsContent value="received" className="mt-0">
              <div className="border-x border-b border-border bg-background/95 backdrop-blur-sm rounded-b-lg min-h-[400px] p-4 space-y-3">
                {receivedAssignments.length === 0 ? (
                  <div className="flex items-center justify-center p-12 text-center">
                    <p className="text-muted-foreground">Супоришҳо нестанд</p>
                  </div>
                ) : (
                  receivedAssignments.map(renderAssignment)
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
