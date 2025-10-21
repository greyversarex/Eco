import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';

interface DepartmentCardProps {
  name: string;
  unreadCount: number;
  onClick: () => void;
}

export default function DepartmentCard({ name, unreadCount, onClick }: DepartmentCardProps) {
  return (
    <Card
      className="relative cursor-pointer p-6 hover-elevate active-elevate-2 transition-colors"
      onClick={onClick}
      data-testid={`card-department-${name}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Building2 className="h-5 w-5" />
        </div>
        <h3 className="text-base font-medium text-foreground flex-1">{name}</h3>
        {unreadCount > 0 && (
          <div 
            className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold shrink-0"
            data-testid={`badge-unread-${name}`}
          >
            {unreadCount}
          </div>
        )}
      </div>
    </Card>
  );
}
