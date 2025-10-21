import { Paperclip, CheckCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MessageListItemProps {
  id: string;
  subject: string;
  sender: string;
  date: string;
  isRead: boolean;
  hasAttachment: boolean;
  onClick: () => void;
  isSentMessage?: boolean;
}

export default function MessageListItem({
  id,
  subject,
  sender,
  date,
  isRead,
  hasAttachment,
  onClick,
  isSentMessage = false,
}: MessageListItemProps) {
  return (
    <div
      className={`flex items-center justify-between border-b border-border px-6 py-4 cursor-pointer hover-elevate ${
        !isRead && !isSentMessage ? 'bg-primary/5' : 'bg-background'
      }`}
      onClick={onClick}
      data-testid={`message-item-${id}`}
    >
      <div className="flex-1 min-w-0">
        <h3 className={`text-sm mb-1 ${!isRead && !isSentMessage ? 'font-semibold text-foreground' : 'font-normal text-foreground'}`}>
          {subject}
        </h3>
        <p className="text-sm text-muted-foreground">{sender}</p>
      </div>
      <div className="flex items-center gap-4 ml-4">
        {isSentMessage && isRead && (
          <Badge variant="outline" className="gap-1 bg-primary/10 text-primary border-primary/20" data-testid={`badge-read-${id}`}>
            <CheckCheck className="h-3 w-3" />
            <span className="text-xs">Прочитано</span>
          </Badge>
        )}
        {hasAttachment && (
          <Paperclip className="h-4 w-4 text-muted-foreground" data-testid={`icon-attachment-${id}`} />
        )}
        <span className="text-sm text-muted-foreground whitespace-nowrap">{date}</span>
      </div>
    </div>
  );
}
