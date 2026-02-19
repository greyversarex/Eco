import { useState, useEffect, useRef, useMemo } from 'react';

interface WelcomeAnimationProps {
  departmentName: string;
  departmentIconUrl?: string | null;
  onComplete: () => void;
}

const LEAF_COLORS = [
  { fill: '#2d8a4e', vein: '#1a6b35', shadow: '#1a5c30' },
  { fill: '#3a9d5e', vein: '#2a7d45', shadow: '#1f6b38' },
  { fill: '#4aad6e', vein: '#35884f', shadow: '#2a7542' },
  { fill: '#228b45', vein: '#186830', shadow: '#145a28' },
  { fill: '#56b870', vein: '#3d9454', shadow: '#2f8045' },
  { fill: '#1e7a3a', vein: '#14602c', shadow: '#0f5024' },
];

export function WelcomeAnimation({ departmentName, departmentIconUrl, onComplete }: WelcomeAnimationProps) {
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter');

  const leafConfigs = useMemo(() => Array.from({ length: 45 }).map(() => {
    const color = LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)];
    return {
      x: Math.random() * 100,
      delay: Math.random() * 4,
      duration: 5 + Math.random() * 5,
      size: 30 + Math.random() * 35,
      swayDuration: 1.5 + Math.random() * 1.5,
      color,
      type: Math.floor(Math.random() * 5),
      flipX: Math.random() > 0.5,
    };
  }), []);

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
              top: '-70px',
              animation: `welcomeLeafFall ${leaf.duration}s ease-in-out infinite`,
              animationDelay: `${leaf.delay}s`,
              opacity: 0,
              transform: leaf.flipX ? 'scaleX(-1)' : 'none',
            }}
          >
            <svg
              width={leaf.size}
              height={leaf.size}
              viewBox="0 0 50 50"
              style={{
                filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.25))',
                animation: `welcomeLeafSway ${leaf.swayDuration}s ease-in-out infinite alternate`,
                animationDelay: `${leaf.delay}s`,
              }}
            >
              {leaf.type === 0 && (
                <g>
                  <path d="M25 3 C15 10, 6 20, 9 35 C11 38, 16 40, 25 33 C34 40, 39 38, 41 35 C44 20, 35 10, 25 3Z"
                    fill={leaf.color.fill} />
                  <path d="M25 3 C15 10, 6 20, 9 35 C11 38, 16 40, 25 33 C34 40, 39 38, 41 35 C44 20, 35 10, 25 3Z"
                    fill="url(#leafGrad0)" opacity="0.3" />
                  <path d="M25 7 L25 33" stroke={leaf.color.vein} strokeWidth="1.2" fill="none" />
                  <path d="M18 14 L25 19" stroke={leaf.color.vein} strokeWidth="0.8" fill="none" opacity="0.7" />
                  <path d="M32 14 L25 19" stroke={leaf.color.vein} strokeWidth="0.8" fill="none" opacity="0.7" />
                  <path d="M15 22 L25 26" stroke={leaf.color.vein} strokeWidth="0.8" fill="none" opacity="0.6" />
                  <path d="M35 22 L25 26" stroke={leaf.color.vein} strokeWidth="0.8" fill="none" opacity="0.6" />
                  <path d="M17 29 L25 31" stroke={leaf.color.vein} strokeWidth="0.6" fill="none" opacity="0.5" />
                  <path d="M33 29 L25 31" stroke={leaf.color.vein} strokeWidth="0.6" fill="none" opacity="0.5" />
                </g>
              )}
              {leaf.type === 1 && (
                <g>
                  <path d="M25 2 C10 10, 4 22, 12 38 C16 42, 22 40, 25 40 C28 40, 34 42, 38 38 C46 22, 40 10, 25 2Z"
                    fill={leaf.color.fill} />
                  <path d="M25 2 C10 10, 4 22, 12 38 C16 42, 22 40, 25 40 C28 40, 34 42, 38 38 C46 22, 40 10, 25 2Z"
                    fill="url(#leafGrad1)" opacity="0.25" />
                  <path d="M25 5 Q23 22, 25 38" stroke={leaf.color.vein} strokeWidth="1.1" fill="none" />
                  <path d="M16 13 Q21 17, 25 18" stroke={leaf.color.vein} strokeWidth="0.7" fill="none" opacity="0.6" />
                  <path d="M34 13 Q29 17, 25 18" stroke={leaf.color.vein} strokeWidth="0.7" fill="none" opacity="0.6" />
                  <path d="M12 24 Q19 26, 24 27" stroke={leaf.color.vein} strokeWidth="0.7" fill="none" opacity="0.5" />
                  <path d="M38 24 Q31 26, 26 27" stroke={leaf.color.vein} strokeWidth="0.7" fill="none" opacity="0.5" />
                </g>
              )}
              {leaf.type === 2 && (
                <g>
                  <ellipse cx="25" cy="22" rx="15" ry="18"
                    fill={leaf.color.fill} transform="rotate(-10 25 22)" />
                  <ellipse cx="25" cy="22" rx="15" ry="18"
                    fill="url(#leafGrad2)" opacity="0.2" transform="rotate(-10 25 22)" />
                  <path d="M25 5 Q23 22, 24 38" stroke={leaf.color.vein} strokeWidth="1" fill="none" />
                  <path d="M15 12 L24 17" stroke={leaf.color.vein} strokeWidth="0.7" fill="none" opacity="0.6" />
                  <path d="M14 22 L23 25" stroke={leaf.color.vein} strokeWidth="0.6" fill="none" opacity="0.5" />
                  <path d="M16 30 L23 31" stroke={leaf.color.vein} strokeWidth="0.6" fill="none" opacity="0.5" />
                  <path d="M34 14 L25 18" stroke={leaf.color.vein} strokeWidth="0.7" fill="none" opacity="0.6" />
                  <path d="M35 24 L25 26" stroke={leaf.color.vein} strokeWidth="0.6" fill="none" opacity="0.5" />
                </g>
              )}
              {leaf.type === 3 && (
                <g>
                  <path d="M25 2 C12 8, 5 18, 8 30 C10 36, 18 44, 25 44 C32 44, 40 36, 42 30 C45 18, 38 8, 25 2Z"
                    fill={leaf.color.fill} />
                  <path d="M25 2 C12 8, 5 18, 8 30 C10 36, 18 44, 25 44 C32 44, 40 36, 42 30 C45 18, 38 8, 25 2Z"
                    fill="url(#leafGrad3)" opacity="0.25" />
                  <path d="M25 5 L25 42" stroke={leaf.color.vein} strokeWidth="1.2" fill="none" />
                  <path d="M14 14 L25 20" stroke={leaf.color.vein} strokeWidth="0.8" fill="none" opacity="0.6" />
                  <path d="M36 14 L25 20" stroke={leaf.color.vein} strokeWidth="0.8" fill="none" opacity="0.6" />
                  <path d="M11 24 L25 28" stroke={leaf.color.vein} strokeWidth="0.7" fill="none" opacity="0.5" />
                  <path d="M39 24 L25 28" stroke={leaf.color.vein} strokeWidth="0.7" fill="none" opacity="0.5" />
                  <path d="M14 33 L25 35" stroke={leaf.color.vein} strokeWidth="0.6" fill="none" opacity="0.4" />
                  <path d="M36 33 L25 35" stroke={leaf.color.vein} strokeWidth="0.6" fill="none" opacity="0.4" />
                </g>
              )}
              {leaf.type === 4 && (
                <g>
                  <path d="M8 25 C8 12, 18 3, 25 3 C32 3, 42 12, 42 25 C42 32, 38 38, 33 42 L25 46 L17 42 C12 38, 8 32, 8 25Z"
                    fill={leaf.color.fill} />
                  <path d="M8 25 C8 12, 18 3, 25 3 C32 3, 42 12, 42 25 C42 32, 38 38, 33 42 L25 46 L17 42 C12 38, 8 32, 8 25Z"
                    fill="url(#leafGrad4)" opacity="0.2" />
                  <path d="M25 6 L25 44" stroke={leaf.color.vein} strokeWidth="1" fill="none" />
                  <path d="M13 16 L25 22" stroke={leaf.color.vein} strokeWidth="0.7" fill="none" opacity="0.5" />
                  <path d="M37 16 L25 22" stroke={leaf.color.vein} strokeWidth="0.7" fill="none" opacity="0.5" />
                  <path d="M10 28 L25 30" stroke={leaf.color.vein} strokeWidth="0.6" fill="none" opacity="0.4" />
                  <path d="M40 28 L25 30" stroke={leaf.color.vein} strokeWidth="0.6" fill="none" opacity="0.4" />
                </g>
              )}
              <defs>
                <radialGradient id="leafGrad0" cx="30%" cy="30%"><stop offset="0%" stopColor="#fff" /><stop offset="100%" stopColor="transparent" /></radialGradient>
                <radialGradient id="leafGrad1" cx="30%" cy="30%"><stop offset="0%" stopColor="#fff" /><stop offset="100%" stopColor="transparent" /></radialGradient>
                <radialGradient id="leafGrad2" cx="30%" cy="30%"><stop offset="0%" stopColor="#fff" /><stop offset="100%" stopColor="transparent" /></radialGradient>
                <radialGradient id="leafGrad3" cx="30%" cy="30%"><stop offset="0%" stopColor="#fff" /><stop offset="100%" stopColor="transparent" /></radialGradient>
                <radialGradient id="leafGrad4" cx="30%" cy="30%"><stop offset="0%" stopColor="#fff" /><stop offset="100%" stopColor="transparent" /></radialGradient>
              </defs>
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
          0% { transform: translateY(-70px); opacity: 0; }
          5% { opacity: 0.9; }
          85% { opacity: 0.9; }
          100% { transform: translateY(110vh); opacity: 0; }
        }
        @keyframes welcomeLeafSway {
          0% { transform: rotate(-30deg) translateX(-18px); }
          100% { transform: rotate(30deg) translateX(18px); }
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
