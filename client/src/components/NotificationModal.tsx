import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { CelebrationEffects, EffectType } from './CelebrationEffects';
import { CheckCircle, X } from 'lucide-react';

interface NotificationButton {
  text: string;
  color: string;
  isEvasive: boolean;
  effect?: string;
}

interface AdminNotification {
  id: number;
  title: string;
  message: string;
  imageData: string | null;
  imageMimeType: string | null;
  buttons: NotificationButton[];
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
  const [buttonPositions, setButtonPositions] = useState<Record<number, { x: number; y: number } | null>>({});
  const [moving, setMoving] = useState(false);
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
      setButtonPositions({});
      setMoving(false);
      setShowEffect(false);
      setShowThankYou(false);
    } else {
      setDismissed(true);
    }
  }, [currentIndex, notifications.length, onDismiss]);

  const handleButtonClick = useCallback((btn: NotificationButton) => {
    if (!notification) return;
    setCurrentEffect((btn.effect as EffectType) || notification.effectType as EffectType);
    setShowEffect(true);
    setShowThankYou(true);
    pendingDismissRef.current = { id: notification.id, response: btn.text };
  }, [notification]);

  const handleEffectComplete = useCallback(() => {
    setShowEffect(false);
    setShowThankYou(false);
    advanceToNext();
  }, [advanceToNext]);

  const handleMoveButton = useCallback((index: number) => {
    if (moving || !notification) return;
    
    const btn = notification.buttons[index];
    if (!btn?.isEvasive) return;

    setMoving(true);

    if (!containerRef.current) {
      setMoving(false);
      return;
    }
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const btnWidth = 140;
    const btnHeight = 40;
    const padding = 20; 
    const headerHeight = 80; 
    const maxX = rect.width - btnWidth - padding;
    const maxY = rect.height - btnHeight - padding;
    const minY = headerHeight;

    const currentPos = buttonPositions[index];

    let attempts = 0;
    let newX: number, newY: number;
    do {
      newX = padding + Math.random() * (maxX - padding);
      newY = minY + Math.random() * (maxY - minY);
      attempts++;
    } while (
      currentPos &&
      Math.abs(newX - currentPos.x) < 150 && 
      Math.abs(newY - currentPos.y) < 80 && 
      attempts < 30 
    );

    setButtonPositions(prev => ({ ...prev, [index]: { x: newX, y: newY } }));

    setTimeout(() => setMoving(false), 100);
  }, [buttonPositions, moving, notification]);

  useEffect(() => {
    setButtonPositions({});
    setMoving(false);
  }, [currentIndex]);

  if (!notification || !isOpen) return null;

  const hasPositive = false;
  const hasNegative = false;

  const getColorClass = (color: string | null | undefined) => {
    const c = color || 'green';
    switch (c) {
      case 'red': return 'bg-red-600 hover:bg-red-700 text-white border-red-700';
      case 'orange': return 'bg-orange-500 hover:bg-orange-600 text-white border-orange-600';
      case 'yellow': return 'bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-500';
      case 'green':
      default: return 'bg-green-600 hover:bg-green-700 text-white border-green-700';
    }
  };

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

              <div className="px-6 pb-6 flex flex-col items-center gap-3">
                {notification.buttons?.map((btn, i) => {
                  const pos = buttonPositions[i];
                  return (
                    <div
                      key={i}
                      className={pos ? "transition-all duration-300 ease-out absolute" : "relative w-full flex justify-center"}
                      style={pos ? {
                        left: `${pos.x}px`,
                        top: `${pos.y}px`,
                        zIndex: 50,
                        pointerEvents: moving ? 'none' : 'auto',
                      } : {}}
                    >
                      <Button
                        onClick={() => handleButtonClick(btn)}
                        className={`${getColorClass(btn.color)} px-8 shadow-md relative z-10 min-w-[140px]`}
                        onMouseEnter={() => handleMoveButton(i)}
                        onTouchStart={() => handleMoveButton(i)}
                        data-testid={`button-notification-custom-${i}`}
                      >
                        {btn.text}
                      </Button>
                    </div>
                  );
                })}

                {(!notification.buttons || notification.buttons.length === 0) && (
                  <Button
                    onClick={() => {
                      onDismiss?.(notification.id);
                      advanceToNext();
                    }}
                    variant="outline"
                    className="px-8 rounded-full border-gray-300 text-gray-600 hover:bg-gray-100"
                    data-testid="button-notification-close"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Пӯшидан
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return createPortal(modal, document.body);
}
