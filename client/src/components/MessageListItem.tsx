import { Paperclip, CheckCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MessageListItemProps {
  id: string;
  subject: string;
  sender: string;
  recipientNames?: string[]; // For broadcast messages in outbox
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
  recipientNames,
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
  // Render recipient names as badges for broadcast messages
  const renderRecipients = () => {
    if (!recipientNames || recipientNames.length === 0) {
      return <span className="text-sm text-muted-foreground">{sender}</span>;
    }
    
    if (recipientNames.length === 1) {
      return <span className="text-sm text-muted-foreground">{recipientNames[0]}</span>;
    }
    
    // Show first 2 recipients + overflow count with tooltip
    const visibleRecipients = recipientNames.slice(0, 2);
    const hiddenCount = recipientNames.length - 2;
    
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {visibleRecipients.map((name, idx) => (
          <Badge 
            key={idx} 
            variant="outline" 
            className="text-xs py-0 px-2 bg-primary/5 text-foreground border-primary/20"
          >
            {name}
          </Badge>
        ))}
        {hiddenCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Badge 
                  variant="outline" 
                  className="text-xs py-0 px-2 cursor-help bg-primary/10 text-foreground border-primary/30 hover-elevate"
                  data-testid="badge-recipients-overflow"
                >
                  +{hiddenCount}
                </Badge>
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs" side="bottom" align="start">
              <div className="space-y-1">
                <p className="text-xs font-semibold mb-2">Дигар қабулкунандагон:</p>
                {recipientNames.slice(2).map((name, idx) => (
                  <div key={idx} className="text-sm py-1 px-2 rounded bg-primary/10">
                    • {name}
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    );
  };
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelect?.();
  };

  const handleItemClick = () => {
    if (!selectable) {
      onClick();
    }
  };

  return (
    <>
      {/* Mobile View */}
      <div
        className={`sm:hidden border border-border px-4 py-3 transition-all duration-200 rounded-lg mb-2 ${
          !selectable && !isSelected ? 'cursor-pointer hover:border-primary hover:shadow-lg hover:bg-primary/10' : ''
        } ${
          !isRead && !isSentMessage ? 'bg-primary/5' : 'bg-background'
        } ${isSelected ? 'bg-primary/10' : ''}`}
        onClick={handleItemClick}
        data-testid={`message-item-${id}`}
      >
        {selectable && (
          <div className="mb-2" onClick={handleCheckboxClick}>
            <Checkbox checked={isSelected} data-testid={`checkbox-message-${id}`} />
          </div>
        )}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`text-sm flex-1 ${!isRead && !isSentMessage ? 'font-semibold' : 'font-normal'}`}>
              {subject}
            </h3>
            {hasAttachment && <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />}
          </div>
          {content && (
            <p className="text-xs text-muted-foreground line-clamp-2">{content}</p>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span>{documentNumber || '—'}</span>
            <span>{date}</span>
          </div>
        </div>
      </div>

      {/* Desktop View - Grid Layout */}
      <div
        className={`hidden sm:grid border border-border px-6 py-4 transition-all duration-200 rounded-lg mb-2 items-center gap-x-4 ${
          !selectable && !isSelected ? 'cursor-pointer hover:border-primary hover:shadow-lg hover:bg-primary/10 hover:scale-[1.01]' : ''
        } ${
          !isRead && !isSentMessage ? 'bg-primary/5' : 'bg-background'
        } ${isSelected ? 'bg-primary/10' : ''}`}
        style={{
          gridTemplateColumns: selectable 
            ? 'auto 120px 1fr 150px 130px 80px'
            : '120px 1fr 150px 130px 80px'
        }}
        onClick={handleItemClick}
        data-testid={`message-item-${id}`}
      >
        {selectable && (
          <div onClick={handleCheckboxClick}>
            <Checkbox checked={isSelected} data-testid={`checkbox-message-${id}`} />
          </div>
        )}
        
        {/* Document Number */}
        <div className="text-center">
          <p className={`text-sm ${!isRead && !isSentMessage ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
            {documentNumber || '—'}
          </p>
        </div>
        
        {/* Subject and Content */}
        <div className="min-w-0 space-y-1 pl-2">
          <h3 className={`text-sm truncate ${!isRead && !isSentMessage ? 'font-semibold text-foreground' : 'font-normal text-foreground'}`}>
            {subject}
          </h3>
          {content && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {content}
            </p>
          )}
        </div>
        
        {/* Sender/Recipients */}
        <div>
          {renderRecipients()}
        </div>
        
        {/* Date */}
        <div>
          <span className="text-sm text-muted-foreground">{date}</span>
        </div>
        
        {/* Icons */}
        <div className="flex items-center gap-2 justify-end">
          {isSentMessage && isRead && (
            <Badge variant="outline" className="gap-1 bg-primary/10 text-primary border-primary/20" data-testid={`badge-read-${id}`}>
              <CheckCheck className="h-3 w-3" />
              <span className="text-xs">Хондашуд</span>
            </Badge>
          )}
          {hasAttachment && (
            <Paperclip className="h-4 w-4 text-muted-foreground" data-testid={`icon-attachment-${id}`} />
          )}
        </div>
      </div>
    </>
  );
}
