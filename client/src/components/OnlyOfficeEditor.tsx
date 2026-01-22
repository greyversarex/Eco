import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, X } from 'lucide-react';

declare global {
  interface Window {
    DocSpace: {
      SDK: {
        initSystem: (config: any) => any;
        initManager: (config: any) => any;
        initEditor: (config: any) => any;
        initFrame: (config: any) => any;
        frames: Record<string, any>;
      };
    };
  }
}

interface OnlyOfficeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  fileId?: string;
  mode?: 'editor' | 'viewer' | 'manager';
  onSave?: (fileData: any) => void;
}

const DOCSPACE_URL = 'https://docspace-ytx0ft.onlyoffice.com';

export function OnlyOfficeEditor({ 
  isOpen, 
  onClose, 
  fileId,
  mode = 'manager',
  onSave 
}: OnlyOfficeEditorProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const frameInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      if (frameInstanceRef.current) {
        try {
          frameInstanceRef.current.destroyFrame?.();
        } catch (e) {
          console.log('Frame cleanup');
        }
        frameInstanceRef.current = null;
      }
      return;
    }

    const initDocSpace = async () => {
      setIsLoading(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 500));

      if (!window.DocSpace?.SDK) {
        setError('OnlyOffice SDK не загружен');
        setIsLoading(false);
        return;
      }

      try {
        const config = {
          frameId: 'onlyoffice-frame',
          width: '100%',
          height: '100%',
          events: {
            onAppReady: () => {
              console.log('DocSpace ready');
              setIsLoading(false);
            },
            onAppError: (e: any) => {
              console.error('DocSpace error:', e);
              setError('Хатогӣ ҳангоми боркунии DocSpace');
              setIsLoading(false);
            },
            onSelectCallback: (file: any) => {
              console.log('File selected:', file);
              if (onSave) {
                onSave(file);
              }
            },
            onCloseCallback: () => {
              onClose();
            }
          }
        };

        if (mode === 'editor' && fileId) {
          frameInstanceRef.current = window.DocSpace.SDK.initEditor({
            ...config,
            id: fileId,
          });
        } else if (mode === 'viewer' && fileId) {
          frameInstanceRef.current = window.DocSpace.SDK.initFrame({
            ...config,
            id: fileId,
            mode: 'viewer'
          });
        } else {
          frameInstanceRef.current = window.DocSpace.SDK.initManager({
            ...config,
            showMenu: true,
            showFilter: true,
            showHeader: true,
            viewAs: 'table'
          });
        }
      } catch (e: any) {
        console.error('Init error:', e);
        setError(e.message || 'Хатогӣ ҳангоми оғоз');
        setIsLoading(false);
      }
    };

    initDocSpace();

    return () => {
      if (frameInstanceRef.current) {
        try {
          frameInstanceRef.current.destroyFrame?.();
        } catch (e) {
          console.log('Frame cleanup on unmount');
        }
        frameInstanceRef.current = null;
      }
    };
  }, [isOpen, fileId, mode, onSave, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b flex flex-row items-center justify-between">
          <DialogTitle className="text-lg">
            {mode === 'manager' ? 'OnlyOffice DocSpace' : 'Таҳрири ҳуҷҷат'}
          </DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="flex-1 relative overflow-hidden" style={{ height: 'calc(95vh - 60px)' }}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Боркунии DocSpace...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
              <div className="flex flex-col items-center gap-3 text-center p-4">
                <p className="text-destructive">{error}</p>
                <p className="text-sm text-muted-foreground">
                  Лутфан санҷед, ки ба OnlyOffice DocSpace ворид шудаед
                </p>
                <Button variant="outline" onClick={() => window.open(DOCSPACE_URL, '_blank')}>
                  Кушодани DocSpace
                </Button>
              </div>
            </div>
          )}
          
          <div 
            id="onlyoffice-frame" 
            ref={frameRef}
            className="w-full h-full"
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
