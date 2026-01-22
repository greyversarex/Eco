import { Button } from '@/components/ui/button';
import { FileEdit, ExternalLink } from 'lucide-react';

const DOCSPACE_URL = 'https://docspace-ytx0ft.onlyoffice.com';

interface OnlyOfficeEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnlyOfficeEditor({ isOpen, onClose }: OnlyOfficeEditorProps) {
  if (isOpen) {
    window.open(DOCSPACE_URL, '_blank');
    onClose();
  }
  return null;
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
