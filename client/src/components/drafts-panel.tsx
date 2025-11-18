import { useDrafts } from '@/hooks/use-drafts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Send, RefreshCw, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

export function DraftsPanel() {
  const { drafts, isLoading, deleteDraft, syncDraft, syncAllPendingDrafts, pendingCount } = useDrafts();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Черновики</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Загрузка...</p>
        </CardContent>
      </Card>
    );
  }

  if (drafts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Черновики</CardTitle>
          <CardDescription>
            Сохранённые сообщения для отправки при восстановлении связи
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Нет черновиков</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'syncing':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      case 'synced':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Ожидает</Badge>;
      case 'syncing':
        return <Badge variant="default">Отправка...</Badge>;
      case 'failed':
        return <Badge variant="destructive">Ошибка</Badge>;
      case 'synced':
        return <Badge variant="default">Отправлено</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle>Черновики</CardTitle>
            <CardDescription>
              {drafts.length} {drafts.length === 1 ? 'черновик' : 'черновиков'}
              {pendingCount > 0 && ` • ${pendingCount} ожидают отправки`}
            </CardDescription>
          </div>
          {pendingCount > 0 && (
            <Button
              onClick={syncAllPendingDrafts}
              size="sm"
              data-testid="button-sync-all-drafts"
            >
              <Send className="h-4 w-4 mr-2" />
              Отправить все
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {drafts.map((draft, index) => (
              <div key={draft.id}>
                {index > 0 && <Separator className="my-4" />}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate" data-testid={`text-draft-subject-${draft.id}`}>
                        {draft.subject || 'Без темы'}
                      </h4>
                      <p className="text-sm text-muted-foreground truncate">
                        {draft.content.substring(0, 100)}
                        {draft.content.length > 100 && '...'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(draft.syncStatus)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(draft.syncStatus)}
                    <Badge variant="outline" className="text-xs">
                      {format(new Date(draft.createdAt), 'dd MMM, HH:mm', { locale: ru })}
                    </Badge>
                    {draft.recipientIds.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {draft.recipientIds.length} {draft.recipientIds.length === 1 ? 'получатель' : 'получателей'}
                      </Badge>
                    )}
                    {draft.attachments && draft.attachments.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {draft.attachments.length} файл(ов)
                      </Badge>
                    )}
                  </div>

                  {draft.errorMessage && (
                    <p className="text-xs text-destructive">
                      Ошибка: {draft.errorMessage}
                    </p>
                  )}

                  <div className="flex gap-2">
                    {draft.syncStatus === 'pending' && (
                      <Button
                        onClick={() => syncDraft(draft)}
                        size="sm"
                        variant="outline"
                        data-testid={`button-send-draft-${draft.id}`}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Отправить
                      </Button>
                    )}
                    {draft.syncStatus === 'failed' && (
                      <Button
                        onClick={() => syncDraft(draft)}
                        size="sm"
                        variant="outline"
                        data-testid={`button-retry-draft-${draft.id}`}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Повторить
                      </Button>
                    )}
                    <Button
                      onClick={() => deleteDraft(draft.id)}
                      size="sm"
                      variant="ghost"
                      data-testid={`button-delete-draft-${draft.id}`}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Удалить
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
