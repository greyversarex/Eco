import { useOnlineStatus } from '@/hooks/use-offline';
import { WifiOff, Wifi } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <Badge variant="destructive" className="gap-1" data-testid="badge-offline">
      <WifiOff className="h-3 w-3" />
      Офлайн
    </Badge>
  );
}

export function OnlineStatusBadge() {
  const isOnline = useOnlineStatus();

  return (
    <Badge 
      variant={isOnline ? "default" : "destructive"} 
      className="gap-1"
      data-testid={isOnline ? "badge-online" : "badge-offline"}
    >
      {isOnline ? (
        <>
          <Wifi className="h-3 w-3" />
          Онлайн
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          Офлайн
        </>
      )}
    </Badge>
  );
}
