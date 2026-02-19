import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CelebrationEffects, EffectType } from './CelebrationEffects';
import { CheckCircle } from 'lucide-react';

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
  const [showThankYou, setShowThankYou] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [currentEffect, setCurrentEffect] = useState<EffectType>('confetti');
  const [negativePos, setNegativePos] = useState<{ x: number; y: number } | null>(null);
  const [negativeMoving, setNegativeMoving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const pendingDismissRef = useRef<{ id: number; response?: string } | null>(null);

  const notification = currentIndex < notifications.length ? notifications[currentIndex] : null;
  const isOpen = !!notification && !dismissed;

  const advanceToNext = useCallback(() => {
    if (pendingDismissRef.current) {
      onDismiss?.(pendingDismissRef.current.id, pendingDismissRef.current.response);
      pendingDismissRef.current = null;
    }
    if (currentIndex < notifications.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setNegativePos(null);
      setNegativeMoving(false);
      setShowEffect(false);
      setShowThankYou(false);
    } else {
      setDismissed(true);
    }
  }, [currentIndex, notifications.length, onDismiss]);

  const handlePositive = useCallback(() => {
    if (!notification) return;
    setCurrentEffect(notification.effectType as EffectType);
    setShowEffect(true);
    setShowThankYou(true);
    pendingDismissRef.current = { id: notification.id, response: notification.positiveButtonText || 'positive' };
  }, [notification]);

  const handleEffectComplete = useCallback(() => {
    setShowEffect(false);
    setShowThankYou(false);
    advanceToNext();
  }, [advanceToNext]);

  const handleNegativeMouseEnter = useCallback(() => {
    if (negativeMoving) return;
    setNegativeMoving(true);

    if (!containerRef.current) {
      setNegativeMoving(false);
      return;
    }
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

    setTimeout(() => setNegativeMoving(false), 350);
  }, [negativePos, negativeMoving]);

  useEffect(() => {
    setNegativePos(null);
    setNegativeMoving(false);
  }, [currentIndex]);

  if (!notification) return null;

  const hasPositive = notification.positiveButtonText && notification.positiveButtonText.trim();
  const hasNegative = notification.negativeButtonText && notification.negativeButtonText.trim();

  return (
    <>
      {showEffect && (
        <CelebrationEffects
          effectType={currentEffect}
          duration={4000}
          onComplete={handleEffectComplete}
        />
      )}
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-lg p-0 overflow-hidden [&>button]:hidden"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          {showThankYou ? (
            <div className="flex flex-col items-center justify-center py-12 px-6" style={{ minHeight: '280px' }}>
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-foreground text-center mb-2" data-testid="text-thank-you-title">
                Ташаккур!
              </h2>
              <p className="text-base text-muted-foreground text-center" data-testid="text-thank-you-message">
                Ҷавоби Шумо қабул гардид!
              </p>
            </div>
          ) : (
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
                      onClick={() => {
                        onDismiss?.(notification.id);
                        advanceToNext();
                      }}
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
                    pointerEvents: negativeMoving ? 'none' : 'auto',
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
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
