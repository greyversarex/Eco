import { Check, X } from 'lucide-react';
import { format } from 'date-fns';

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
    sm: 'w-24 h-24 text-xs',
    md: 'w-32 h-32 text-sm',
    lg: 'w-40 h-40 text-base'
  };
  
  const iconSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  };

  const formattedDate = approvedAt 
    ? format(new Date(approvedAt), 'dd.MM.yyyy')
    : format(new Date(), 'dd.MM.yyyy');

  return (
    <div 
      className={`
        ${sizeClasses[size]}
        relative flex flex-col items-center justify-center
        rounded-full border-4 
        ${isApproved 
          ? 'border-green-600 text-green-700 dark:border-green-500 dark:text-green-400' 
          : 'border-red-600 text-red-700 dark:border-red-500 dark:text-red-400'
        }
        transform rotate-[-12deg]
        shadow-lg
        bg-white/90 dark:bg-gray-900/90
        p-2
      `}
      style={{
        boxShadow: isApproved 
          ? '0 0 0 3px rgba(22, 163, 74, 0.3), inset 0 0 0 2px rgba(22, 163, 74, 0.2)'
          : '0 0 0 3px rgba(220, 38, 38, 0.3), inset 0 0 0 2px rgba(220, 38, 38, 0.2)'
      }}
    >
      <div className="absolute inset-2 rounded-full border-2 border-current opacity-50" />
      
      <div className="text-center z-10 flex flex-col items-center gap-0.5">
        {isApproved ? (
          <Check className={`${iconSizes[size]} stroke-[3]`} />
        ) : (
          <X className={`${iconSizes[size]} stroke-[3]`} />
        )}
        
        <div className="font-bold uppercase tracking-wide">
          {isApproved ? 'ИҶРО ШУД' : 'РАД ШУД'}
        </div>
        
        <div className="text-[0.65em] opacity-80 max-w-[80%] text-center truncate">
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
    <div className="flex gap-4">
      <button
        onClick={onApprove}
        disabled={isPending}
        className="
          group flex flex-col items-center gap-2 p-4 
          rounded-xl border-2 border-dashed border-green-400
          hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
        "
        data-testid="stamp-button-approve"
      >
        <div className="
          w-16 h-16 rounded-full 
          border-3 border-green-600 
          flex items-center justify-center
          group-hover:scale-110 transition-transform
          bg-white dark:bg-gray-900
        ">
          <Check className="h-8 w-8 text-green-600 stroke-[3]" />
        </div>
        <span className="font-semibold text-green-700 dark:text-green-400">
          ИҶРО ШУД
        </span>
        <span className="text-xs text-muted-foreground">Мӯҳр гузоштан</span>
      </button>

      <button
        onClick={onReject}
        disabled={isPending}
        className="
          group flex flex-col items-center gap-2 p-4 
          rounded-xl border-2 border-dashed border-red-400
          hover:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
        "
        data-testid="stamp-button-reject"
      >
        <div className="
          w-16 h-16 rounded-full 
          border-3 border-red-600 
          flex items-center justify-center
          group-hover:scale-110 transition-transform
          bg-white dark:bg-gray-900
        ">
          <X className="h-8 w-8 text-red-600 stroke-[3]" />
        </div>
        <span className="font-semibold text-red-700 dark:text-red-400">
          РАД ШУД
        </span>
        <span className="text-xs text-muted-foreground">Мӯҳр гузоштан</span>
      </button>
    </div>
  );
}
