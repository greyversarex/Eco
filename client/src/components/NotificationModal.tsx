import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CelebrationEffects, EffectType } from './CelebrationEffects';

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
  onDismiss?: (id: number, response?: string) => void;
}

export function NotificationModal({ notifications, onDismiss }: NotificationModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showEffect, setShowEffect] = useState(false);
  const [currentEffect, setCurrentEffect] = useState<EffectType>('confetti');
  const [negativePos, setNegativePos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const negBtnRef = useRef<HTMLButtonElement>(null);

  const notification = notifications[currentIndex];
  const isOpen = !!notification;

  const handleDismissAndNext = useCallback((response?: string) => {
    if (!notification) return;
    onDismiss?.(notification.id, response);
    if (currentIndex < notifications.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setNegativePos(null);
    } else {
      setCurrentIndex(notifications.length);
    }
  }, [notification, currentIndex, notifications.length, onDismiss]);

  const handlePositive = useCallback(() => {
    if (!notification) return;
    setCurrentEffect(notification.effectType as EffectType);
    setShowEffect(true);
    handleDismissAndNext(notification.positiveButtonText || 'positive');
  }, [notification, handleDismissAndNext]);

  const handleNegativeMouseEnter = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const btnWidth = 140;
    const btnHeight = 40;
    const padding = 10;
    const headerHeight = 60;
    const maxX = rect.width - btnWidth - padding;
    const maxY = rect.height - btnHeight - padding;
    const minY = headerHeight;

    let attempts = 0;
    let newX: number, newY: number;
    do {
      newX = padding + Math.random() * (maxX - padding);
      newY = minY + Math.random() * (maxY - minY);
      attempts++;
    } while (
      negativePos &&
      Math.abs(newX - negativePos.x) < 80 &&
      Math.abs(newY - negativePos.y) < 40 &&
      attempts < 10
    );

    setNegativePos({ x: newX, y: newY });
  }, [negativePos]);

  useEffect(() => {
    setNegativePos(null);
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
          <div ref={containerRef} className="relative" style={{ minHeight: '280px' }}>
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

            <div className="px-6 pb-6">
              <div className="flex justify-center gap-3">
                {hasPositive && (
                  <Button
                    onClick={handlePositive}
                    className="bg-green-600 text-white px-8"
                    data-testid="button-notification-positive"
                  >
                    {notification.positiveButtonText}
                  </Button>
                )}
              </div>

              {hasNegative && !negativePos && (
                <div className="flex justify-center mt-3">
                  <Button
                    ref={negBtnRef}
                    variant="destructive"
                    className="px-8"
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
                    onClick={() => handleDismissAndNext()}
                    data-testid="button-notification-dismiss"
                  >
                    OK
                  </Button>
                </div>
              )}
            </div>

            {hasNegative && negativePos && (
              <div
                className="transition-all duration-300 ease-out"
                style={{
                  position: 'absolute',
                  left: `${negativePos.x}px`,
                  top: `${negativePos.y}px`,
                  zIndex: 50,
                }}
              >
                <Button
                  variant="destructive"
                  className="px-8 shadow-lg"
                  onMouseEnter={handleNegativeMouseEnter}
                  onTouchStart={handleNegativeMouseEnter}
                  data-testid="button-notification-negative"
                >
                  {notification.negativeButtonText}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
