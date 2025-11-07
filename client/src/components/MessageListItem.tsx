import { Paperclip, CheckCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface MessageListItemProps {
  id: string;
  subject: string;
  sender: string;
  date: string;
  isRead: boolean;
  hasAttachment: boolean;
  onClick: () => void;
  isSentMessage?: boolean;
  selectable?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  documentNumber?: string;
  content?: string;
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
  selectable = false,
  isSelected = false,
  onToggleSelect,
  documentNumber,
  content,
}: MessageListItemProps) {
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelect?.();
  };

  const handleItemClick = () => {
    // In delete mode, only checkbox should work
    if (!selectable) {
      onClick();
    }
  };

  return (
    <div
      className={`flex items-center border border-border px-6 py-4 transition-all duration-200 rounded-lg mb-2 ${
        !selectable && !isSelected ? 'cursor-pointer hover:border-primary hover:shadow-lg hover:bg-primary/10 hover:scale-[1.02]' : ''
      } ${
        selectable && !isSelected ? 'cursor-default' : ''
      } ${
        !isRead && !isSentMessage ? 'bg-primary/5' : 'bg-background'
      } ${isSelected ? 'bg-primary/10' : ''}`}
      onClick={handleItemClick}
      data-testid={`message-item-${id}`}
    >
      {selectable && (
        <div className="mr-3" onClick={handleCheckboxClick}>
          <Checkbox 
            checked={isSelected} 
            data-testid={`checkbox-message-${id}`}
          />
        </div>
      )}
      {/* Document Number */}
      <div className="w-20 sm:w-32 shrink-0 text-center">
        <p className={`text-xs sm:text-sm truncate ${!isRead && !isSentMessage ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
          {documentNumber || '—'}
        </p>
      </div>
      {/* Vertical separator */}
      <div className="hidden sm:block h-12 w-px bg-border mx-2 sm:mx-4 shrink-0" />
      {/* Subject and Content */}
      <div className="flex-1 min-w-0 space-y-1 mx-2">
        <h3 className={`text-xs sm:text-sm truncate ${!isRead && !isSentMessage ? 'font-semibold text-foreground' : 'font-normal text-foreground'}`}>
          {subject}
        </h3>
        {content && (
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
            {content}
          </p>
        )}
      </div>
      {/* Sender, Date and Icons */}
      <div className="flex items-center gap-3 ml-4 shrink-0">
        <span className="hidden sm:inline text-sm text-muted-foreground w-32 text-right">{sender}</span>
        <span className="text-xs sm:text-sm text-muted-foreground w-24 text-right ml-[-4px] mr-[-4px] mt-[0px] mb-[0px] pt-[0px] pb-[0px] pl-[-10px] pr-[-10px]">{date}</span>
        <div className="flex items-center gap-2 w-20 justify-end">
          {isSentMessage && isRead && (
            <Badge variant="outline" className="gap-1 bg-primary/10 text-primary border-primary/20 hidden sm:flex" data-testid={`badge-read-${id}`}>
              <CheckCheck className="h-3 w-3" />
              <span className="text-xs">Прочитано</span>
            </Badge>
          )}
          {hasAttachment && (
            <Paperclip className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" data-testid={`icon-attachment-${id}`} />
          )}
        </div>
      </div>
    </div>
  );
}
