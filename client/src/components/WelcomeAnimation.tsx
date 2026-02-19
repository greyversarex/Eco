import { useState, useEffect } from 'react';

interface WelcomeAnimationProps {
  departmentName: string;
  onComplete: () => void;
}

export function WelcomeAnimation({ departmentName, onComplete }: WelcomeAnimationProps) {
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter');

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
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-10"
            style={{
              width: `${Math.random() * 200 + 50}px`,
              height: `${Math.random() * 200 + 50}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: 'rgba(255,255,255,0.15)',
              animation: `welcomeFloat ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={`leaf-${i}`}
            className="absolute"
            style={{
              left: `${Math.random() * 100}%`,
              top: '-50px',
              animation: `welcomeLeafFall ${4 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
              fontSize: '24px',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2">
              <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 1 8-1 3.5-3.5 5-6 6.5" />
              <path d="M10.7 20.7a7 7 0 0 0 1.2-13.8" />
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
            <svg className="w-20 h-20 mx-auto drop-shadow-lg" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="36" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.5)" strokeWidth="2"/>
              <path d="M40 18c-2 4-8 10-8 18s6 14 8 16c2-2 8-8 8-16s-6-14-8-18z" fill="rgba(255,255,255,0.8)"/>
              <path d="M33 42c-4-2-10-2-14 2" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round"/>
              <path d="M47 42c4-2 10-2 14 2" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round"/>
              <path d="M40 36v20" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round"/>
            </svg>
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
          0% { transform: translateY(-50px) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
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
