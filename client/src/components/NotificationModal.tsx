import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { CelebrationEffects, EffectType } from './CelebrationEffects';
import { CheckCircle, X } from 'lucide-react';

interface AdminNotification {
  id: number;
  title: string;
  message: string;
  imageData: string | null;
  imageMimeType: string | null;
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

  if (!notification || !isOpen) return null;

  const hasPositive = notification.positiveButtonText && notification.positiveButtonText.trim();
  const hasNegative = notification.negativeButtonText && notification.negativeButtonText.trim();

  const modal = (
    <>
      {showEffect && (
        <CelebrationEffects
          effectType={currentEffect}
          duration={4000}
          onComplete={handleEffectComplete}
        />
      )}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-200"
          style={{
            background: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            boxShadow: '0 16px 40px -8px rgba(0,0,0,0.2), 0 6px 12px -4px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.5)',
            borderRadius: '16px',
          }}
        >
          {showThankYou ? (
            <div className="flex flex-col items-center justify-center py-12 px-6" style={{ minHeight: '280px' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(22,163,74,0.15)' }}>
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 text-center mb-2" data-testid="text-thank-you-title">
                Ташаккур!
              </h2>
              <p className="text-base text-gray-600 text-center" data-testid="text-thank-you-message">
                Ҷавоби Шумо қабул гардид!
              </p>
            </div>
          ) : (
            <div ref={containerRef} className="relative" style={{ minHeight: '280px' }}>
              <div className="px-6 py-4" style={{ background: 'linear-gradient(135deg, rgba(22,163,74,0.9), rgba(5,150,105,0.9))', borderRadius: '15px 15px 0 0' }}>
                <h2 className="text-xl font-bold text-white text-center" data-testid="text-notification-title">
                  {notification.title}
                </h2>
              </div>

              {notification.imageData && notification.imageMimeType && (
                <div className="px-4 pt-4">
                  <img
                    src={`data:${notification.imageMimeType};base64,${notification.imageData}`}
                    alt=""
                    className="w-full rounded-md object-contain"
                    style={{ maxHeight: '300px' }}
                    data-testid="img-notification-image"
                  />
                </div>
              )}

              <div className="px-6 py-4">
                <p className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap" data-testid="text-notification-message">
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

              </div>

              {!hasPositive && !hasNegative && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    onDismiss?.(notification.id);
                    advanceToNext();
                  }}
                  className="absolute top-2 right-2 text-white hover:bg-white/20 rounded-full"
                  data-testid="button-notification-close"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}

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
        </div>
      </div>
    </>
  );

  return createPortal(modal, document.body);
}
