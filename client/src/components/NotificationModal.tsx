import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CelebrationEffects, EffectType } from './CelebrationEffects';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface AdminNotification {
  id: number;
  title: string;
  message: string;
  positiveButtonText: string | null;
  negativeButtonText: string | null;
  effectType: string;
  isActive: boolean;
}

interface NotificationModalProps {
  notifications: AdminNotification[];
}

export function NotificationModal({ notifications }: NotificationModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showEffect, setShowEffect] = useState(false);
  const [currentEffect, setCurrentEffect] = useState<EffectType>('confetti');
  const [negativePos, setNegativePos] = useState({ x: 0, y: 0 });
  const [hasEscaped, setHasEscaped] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const notification = notifications[currentIndex];
  const isOpen = !!notification;

  const dismissMutation = useMutation({
    mutationFn: async ({ id, response }: { id: number; response?: string }) => {
      await apiRequest('POST', `/api/notifications/${id}/dismiss`, { response });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/pending'] });
    },
  });

  const handlePositive = useCallback(() => {
    if (!notification) return;
    setCurrentEffect(notification.effectType as EffectType);
    setShowEffect(true);
    dismissMutation.mutate({ id: notification.id, response: notification.positiveButtonText || 'positive' });
    setTimeout(() => {
      setShowEffect(false);
      if (currentIndex < notifications.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setHasEscaped(false);
      }
    }, 4000);
  }, [notification, currentIndex, notifications.length, dismissMutation]);

  const handleNegativeMouseEnter = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const maxX = rect.width - 150;
    const maxY = rect.height - 50;
    let newX = Math.random() * maxX;
    let newY = Math.random() * maxY;
    if (Math.abs(newX - negativePos.x) < 100) {
      newX = (newX + maxX / 2) % maxX;
    }
    if (Math.abs(newY - negativePos.y) < 50) {
      newY = (newY + maxY / 2) % maxY;
    }
    setNegativePos({ x: newX, y: newY });
    setHasEscaped(true);
  }, [negativePos]);

  useEffect(() => {
    setHasEscaped(false);
    setNegativePos({ x: 0, y: 0 });
  }, [currentIndex]);

  if (!isOpen) return null;

  const hasPositive = notification.positiveButtonText && notification.positiveButtonText.trim();
  const hasNegative = notification.negativeButtonText && notification.negativeButtonText.trim();

  return (
    <>
      {showEffect && (
        <CelebrationEffects
          effectType={currentEffect}
          duration={4000}
          onComplete={() => setShowEffect(false)}
        />
      )}
      <Dialog open={isOpen && !showEffect} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-lg p-0 overflow-hidden [&>button]:hidden"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div ref={containerRef} className="relative min-h-[300px]">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white" data-testid="text-notification-title">
                {notification.title}
              </h2>
            </div>

            <div className="px-6 py-6">
              <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap" data-testid="text-notification-message">
                {notification.message}
              </p>
            </div>

            <div className="px-6 pb-6 relative" style={{ minHeight: hasNegative ? '120px' : '60px' }}>
              <div className="flex justify-center gap-3">
                {hasPositive && (
                  <Button
                    onClick={handlePositive}
                    className="bg-green-600 hover:bg-green-700 text-white px-8"
                    data-testid="button-notification-positive"
                  >
                    {notification.positiveButtonText}
                  </Button>
                )}
              </div>

              {hasNegative && (
                <div
                  className="transition-all duration-300 ease-out"
                  style={hasEscaped ? {
                    position: 'absolute',
                    left: `${negativePos.x}px`,
                    top: `${negativePos.y}px`,
                    zIndex: 10,
                  } : {
                    display: 'flex',
                    justifyContent: 'center',
                    marginTop: '12px',
                  }}
                >
                  <Button
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50 px-8"
                    onMouseEnter={handleNegativeMouseEnter}
                    onTouchStart={handleNegativeMouseEnter}
                    data-testid="button-notification-negative"
                  >
                    {notification.negativeButtonText}
                  </Button>
                </div>
              )}

              {!hasPositive && !hasNegative && (
                <div className="flex justify-center">
                  <Button
                    onClick={() => {
                      dismissMutation.mutate({ id: notification.id });
                      if (currentIndex < notifications.length - 1) {
                        setCurrentIndex(prev => prev + 1);
                      }
                    }}
                    data-testid="button-notification-dismiss"
                  >
                    OK
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
