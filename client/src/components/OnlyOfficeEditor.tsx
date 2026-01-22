import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, ExternalLink } from 'lucide-react';

const DOCSPACE_URL = 'https://docspace-ytx0ft.onlyoffice.com';

interface OnlyOfficeEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnlyOfficeEditor({ isOpen, onClose }: OnlyOfficeEditorProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b flex flex-row items-center justify-between">
          <DialogTitle className="text-lg">OnlyOffice DocSpace</DialogTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => window.open(DOCSPACE_URL, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Дар табаи нав
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 relative" style={{ height: 'calc(95vh - 60px)' }}>
          <iframe
            src={DOCSPACE_URL}
            className="w-full h-full border-0"
            allow="clipboard-read; clipboard-write"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function OnlyOfficeButton({ 
  onClick, 
  variant = 'default',
  size = 'default',
  className = ''
}: {
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}) {
  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={onClick}
      className={className}
    >
      <svg 
        viewBox="0 0 24 24" 
        className="h-4 w-4 mr-2"
        fill="currentColor"
      >
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
      </svg>
      OnlyOffice
    </Button>
  );
}
