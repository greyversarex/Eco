import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import * as LucideIcons from 'lucide-react';
import { Building2 } from 'lucide-react';
import { useDepartmentIcon } from '@/hooks/use-department-icon';
import { useState, useRef, useEffect } from 'react';

interface DepartmentCardProps {
  departmentId: number;
  name: string;
  icon?: string;
  unreadCount: number;
  onClick: () => void;
  iconVersion?: number;
}

function getIconComponent(iconName: string = 'building-2') {
  const pascalCase = iconName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
  
  const IconComponent = (LucideIcons as any)[pascalCase];
  return IconComponent || Building2;
}

export default function DepartmentCard({ departmentId, name, icon, unreadCount, onClick, iconVersion }: DepartmentCardProps) {
  const { iconUrl } = useDepartmentIcon(departmentId, iconVersion);
  const IconComponent = getIconComponent(icon);
  const [showPreview, setShowPreview] = useState(false);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  
  const words = name.split(' ');
  const firstWord = words[0];
  const restOfWords = words.slice(1).join(' ');

  const handleMouseEnter = () => {
    if (!iconUrl) return;
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    setShowPreview(true);
  };

  const handleMouseLeave = () => {
    hideTimeout.current = setTimeout(() => setShowPreview(false), 200);
  };

  useEffect(() => {
    return () => {
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
  }, []);
  
  return (
    <Card
      className="relative cursor-pointer p-6 transition-all duration-200 hover:border-primary hover:shadow-md hover:bg-primary/5 bg-white"
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
        <div
          ref={iconRef}
          className="relative flex h-10 w-10 items-center justify-center rounded-md bg-white shrink-0 mt-0.5 overflow-hidden"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {iconUrl ? (
            <img 
              src={iconUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground rounded-md">
              <IconComponent className="h-5 w-5" />
            </div>
          )}
          {showPreview && iconUrl && (
            <div
              className="absolute z-50 left-0 top-full mt-2 rounded-xl shadow-2xl border-2 border-white/80 overflow-hidden bg-white"
              style={{ width: 200, height: 200 }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <img
                src={iconUrl}
                alt={name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
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
