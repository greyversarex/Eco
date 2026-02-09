import { Check, X, Stamp } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

interface DocumentStampProps {
  status: 'approved' | 'rejected';
  departmentName: string;
  approvedAt?: Date | string;
  size?: 'sm' | 'md' | 'lg';
}

export function DocumentStamp({ 
  status, 
  departmentName, 
  approvedAt,
  size = 'md' 
}: DocumentStampProps) {
  const isApproved = status === 'approved';
  const sizeClasses = {
    sm: 'w-28 text-xs px-3 py-2',
    md: 'w-36 text-sm px-4 py-3',
    lg: 'w-44 text-base px-5 py-4'
  };
  
  const iconSizes = {
    sm: 'h-5 w-5',
    md: 'h-7 w-7',
    lg: 'h-9 w-9'
  };

  const formattedDate = approvedAt 
    ? format(new Date(approvedAt), 'dd.MM.yyyy')
    : format(new Date(), 'dd.MM.yyyy');

  return (
    <div 
      className={`
        ${sizeClasses[size]}
        relative flex flex-col items-center justify-center
        rounded-md border-4 
        ${isApproved 
          ? 'border-green-600 text-green-700 dark:border-green-500 dark:text-green-400' 
          : 'border-red-600 text-red-700 dark:border-red-500 dark:text-red-400'
        }
        transform rotate-[-3deg]
        shadow-lg
        bg-white/90 dark:bg-gray-900/90
      `}
      style={{
        boxShadow: isApproved 
          ? '0 0 0 3px rgba(22, 163, 74, 0.3), inset 0 0 0 2px rgba(22, 163, 74, 0.2)'
          : '0 0 0 3px rgba(220, 38, 38, 0.3), inset 0 0 0 2px rgba(220, 38, 38, 0.2)'
      }}
      data-testid={`stamp-${status}`}
    >
      <div className="absolute inset-2 rounded border-2 border-current opacity-50" />
      
      <div className="text-center z-10 flex flex-col items-center gap-0.5">
        {isApproved ? (
          <Check className={`${iconSizes[size]} stroke-[3]`} />
        ) : (
          <X className={`${iconSizes[size]} stroke-[3]`} />
        )}
        
        <div className="font-bold uppercase tracking-wide">
          {isApproved ? 'ИҶОЗАТ' : 'РАДШУДА'}
        </div>
        
        <div className="text-[0.65em] opacity-80 max-w-[90%] text-center line-clamp-2">
          {departmentName}
        </div>
        
        <div className="text-[0.6em] opacity-70 font-mono">
          {formattedDate}
        </div>
      </div>
    </div>
  );
}

interface StampButtonsProps {
  onApprove: () => void;
  onReject: () => void;
  isPending?: boolean;
}

export function StampButtons({ onApprove, onReject, isPending }: StampButtonsProps) {
  return (
    <div className="flex gap-2">
      <Button
        onClick={onApprove}
        disabled={isPending}
        className="gap-1 bg-green-600 hover:bg-green-700 text-white"
        data-testid="stamp-button-approve"
      >
        <Check className="h-4 w-4" />
        Иҷозат
      </Button>
      <Button
        onClick={onReject}
        disabled={isPending}
        className="gap-1 bg-red-600 hover:bg-red-700 text-white"
        data-testid="stamp-button-reject"
      >
        <X className="h-4 w-4" />
        Радшуда
      </Button>
    </div>
  );
}
