import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import * as LucideIcons from 'lucide-react';
import { Building2 } from 'lucide-react';

interface DepartmentCardProps {
  name: string;
  icon?: string;
  unreadCount: number;
  onClick: () => void;
}

// Convert kebab-case icon name to PascalCase component name
function getIconComponent(iconName: string = 'building-2') {
  // Convert kebab-case to PascalCase (e.g., 'cloud-rain' -> 'CloudRain')
  const pascalCase = iconName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  
  // Get the icon component from LucideIcons
  const IconComponent = (LucideIcons as any)[pascalCase];
  
  // Fallback to Building2 if icon not found
  return IconComponent || Building2;
}

export default function DepartmentCard({ name, icon, unreadCount, onClick }: DepartmentCardProps) {
  const IconComponent = getIconComponent(icon);
  
  const words = name.split(' ');
  const firstWord = words[0];
  const restOfWords = words.slice(1).join(' ');
  
  return (
    <Card
      className="relative cursor-pointer p-6 transition-all duration-200 hover:border-primary hover:shadow-md hover:bg-primary/5"
      onClick={onClick}
      data-testid={`card-department-${name}`}
    >
      {unreadCount > 0 && (
        <div 
          className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white text-xs font-semibold shadow-md"
          data-testid={`badge-unread-${name}`}
        >
          {unreadCount}
        </div>
      )}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0 mt-0.5">
          <IconComponent className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-medium text-foreground leading-snug">
            {firstWord}
            {restOfWords && (
              <>
                <br />
                {restOfWords}
              </>
            )}
          </h3>
        </div>
      </div>
    </Card>
  );
}
