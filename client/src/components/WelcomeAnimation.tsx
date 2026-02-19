import { useState, useEffect, useRef, useMemo } from 'react';

interface WelcomeAnimationProps {
  departmentName: string;
  departmentIconUrl?: string | null;
  onComplete: () => void;
}

export function WelcomeAnimation({ departmentName, departmentIconUrl, onComplete }: WelcomeAnimationProps) {
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const leafConfigs = useMemo(() => Array.from({ length: 25 }).map(() => ({
    x: Math.random() * 100,
    delay: Math.random() * 4,
    duration: 5 + Math.random() * 4,
    size: 28 + Math.random() * 32,
    swayAmount: 15 + Math.random() * 25,
    rotStart: Math.random() * 360,
    rotEnd: (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 360),
    opacity: 0.25 + Math.random() * 0.35,
    type: Math.floor(Math.random() * 4),
  })), []);

  useEffect(() => {
    const enterTimer = setTimeout(() => setPhase('show'), 100);
    const showTimer = setTimeout(() => setPhase('exit'), 2800);
    const exitTimer = setTimeout(() => onComplete(), 3600);
    return () => {
      clearTimeout(enterTimer);
      clearTimeout(showTimer);
      clearTimeout(exitTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-700 ${
        phase === 'exit' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background: 'linear-gradient(135deg, #065f46 0%, #047857 30%, #10b981 60%, #34d399 100%)',
      }}
    >
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${Math.random() * 250 + 80}px`,
              height: `${Math.random() * 250 + 80}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: 'rgba(255,255,255,0.08)',
              animation: `welcomeFloat ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {leafConfigs.map((leaf, i) => (
          <div
            key={`leaf-${i}`}
            className="absolute"
            style={{
              left: `${leaf.x}%`,
              top: '-60px',
              animation: `welcomeLeafFall ${leaf.duration}s ease-in-out infinite`,
              animationDelay: `${leaf.delay}s`,
              opacity: 0,
            }}
          >
            <svg
              width={leaf.size}
              height={leaf.size}
              viewBox="0 0 40 40"
              style={{
                filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.15))',
                animation: `welcomeLeafSway ${1.5 + Math.random()}s ease-in-out infinite alternate`,
                animationDelay: `${leaf.delay}s`,
              }}
            >
              {leaf.type === 0 && (
                <g>
                  <path d="M20 4 C12 10, 6 18, 8 30 C10 32, 14 33, 20 28 C26 33, 30 32, 32 30 C34 18, 28 10, 20 4Z"
                    fill={`rgba(255,255,255,${leaf.opacity})`} />
                  <path d="M20 8 L20 28" stroke={`rgba(255,255,255,${leaf.opacity * 0.7})`} strokeWidth="1" fill="none" />
                  <path d="M15 14 L20 18" stroke={`rgba(255,255,255,${leaf.opacity * 0.5})`} strokeWidth="0.8" fill="none" />
                  <path d="M25 14 L20 18" stroke={`rgba(255,255,255,${leaf.opacity * 0.5})`} strokeWidth="0.8" fill="none" />
                  <path d="M14 20 L20 23" stroke={`rgba(255,255,255,${leaf.opacity * 0.5})`} strokeWidth="0.8" fill="none" />
                  <path d="M26 20 L20 23" stroke={`rgba(255,255,255,${leaf.opacity * 0.5})`} strokeWidth="0.8" fill="none" />
                </g>
              )}
              {leaf.type === 1 && (
                <g>
                  <path d="M20 2 C8 8, 4 20, 10 32 C14 36, 20 34, 20 34 C20 34, 26 36, 30 32 C36 20, 32 8, 20 2Z"
                    fill={`rgba(255,255,255,${leaf.opacity})`} />
                  <path d="M20 6 Q18 20, 20 32" stroke={`rgba(255,255,255,${leaf.opacity * 0.6})`} strokeWidth="1" fill="none" />
                </g>
              )}
              {leaf.type === 2 && (
                <g>
                  <ellipse cx="20" cy="18" rx="12" ry="14"
                    fill={`rgba(255,255,255,${leaf.opacity})`} transform="rotate(-15 20 18)" />
                  <path d="M20 6 L18 30" stroke={`rgba(255,255,255,${leaf.opacity * 0.6})`} strokeWidth="0.8" fill="none" />
                  <path d="M13 12 L19 16" stroke={`rgba(255,255,255,${leaf.opacity * 0.5})`} strokeWidth="0.6" fill="none" />
                  <path d="M14 20 L19 22" stroke={`rgba(255,255,255,${leaf.opacity * 0.5})`} strokeWidth="0.6" fill="none" />
                </g>
              )}
              {leaf.type === 3 && (
                <g>
                  <path d="M20 3 C10 8, 5 15, 7 25 C9 30, 15 35, 20 35 L20 35 C25 35, 31 30, 33 25 C35 15, 30 8, 20 3Z"
                    fill={`rgba(255,255,255,${leaf.opacity})`} />
                  <path d="M20 5 L20 33" stroke={`rgba(255,255,255,${leaf.opacity * 0.6})`} strokeWidth="1" fill="none" />
                  <path d="M12 15 L20 19" stroke={`rgba(255,255,255,${leaf.opacity * 0.4})`} strokeWidth="0.7" fill="none" />
                  <path d="M28 15 L20 19" stroke={`rgba(255,255,255,${leaf.opacity * 0.4})`} strokeWidth="0.7" fill="none" />
                  <path d="M10 23 L20 26" stroke={`rgba(255,255,255,${leaf.opacity * 0.4})`} strokeWidth="0.7" fill="none" />
                  <path d="M30 23 L20 26" stroke={`rgba(255,255,255,${leaf.opacity * 0.4})`} strokeWidth="0.7" fill="none" />
                </g>
              )}
            </svg>
          </div>
        ))}
      </div>

      <div
        className={`text-center relative z-10 transition-all duration-700 ${
          phase === 'enter' ? 'scale-50 opacity-0 translate-y-8' : 'scale-100 opacity-100 translate-y-0'
        }`}
      >
        <div className="mb-4">
          <div
            className="inline-block"
            style={{
              animation: phase === 'show' ? 'welcomePulse 1.5s ease-in-out infinite' : 'none',
            }}
          >
            {departmentIconUrl ? (
              <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-3 border-white/50 shadow-lg bg-white/15">
                <img
                  src={departmentIconUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <svg className="w-20 h-20 mx-auto drop-shadow-lg" viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="40" r="36" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/>
                <rect x="25" y="28" width="30" height="24" rx="2" fill="rgba(255,255,255,0.8)"/>
                <rect x="28" y="22" width="24" height="10" rx="2" fill="rgba(255,255,255,0.6)"/>
                <circle cx="40" cy="38" r="5" fill="rgba(16,185,129,0.6)"/>
                <rect x="30" y="46" width="20" height="2" rx="1" fill="rgba(16,185,129,0.4)"/>
              </svg>
            )}
          </div>
        </div>

        <h1
          className="text-5xl sm:text-6xl font-bold text-white mb-3 drop-shadow-lg"
          style={{
            textShadow: '0 0 40px rgba(255,255,255,0.3), 0 4px 12px rgba(0,0,0,0.3)',
            fontFamily: "'Inter', 'Roboto', sans-serif",
          }}
        >
          Хуш омадед!
        </h1>

        <div
          className={`transition-all duration-500 delay-300 ${
            phase === 'enter' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
          }`}
        >
          <div className="h-0.5 w-32 mx-auto bg-white/40 rounded-full mb-4" />
          <p
            className="text-xl sm:text-2xl text-white/90 font-medium max-w-md mx-auto px-4 drop-shadow-md"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
          >
            {departmentName}
          </p>
        </div>

        <div
          className={`mt-6 flex justify-center gap-1.5 transition-all duration-500 delay-500 ${
            phase === 'enter' ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-white/60"
              style={{
                animation: 'welcomeBounce 1s ease-in-out infinite',
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes welcomeFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-20px) scale(1.05); }
        }
        @keyframes welcomeLeafFall {
          0% { transform: translateY(-60px); opacity: 0; }
          5% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateY(110vh); opacity: 0; }
        }
        @keyframes welcomeLeafSway {
          0% { transform: rotate(-25deg) translateX(-15px); }
          100% { transform: rotate(25deg) translateX(15px); }
        }
        @keyframes welcomePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes welcomeBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
