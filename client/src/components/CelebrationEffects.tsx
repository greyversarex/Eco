import { useEffect, useRef, useCallback } from 'react';

export const EFFECT_TYPES = [
  { id: 'confetti', name: 'Конфетти' },
  { id: 'fireworks', name: 'Фейерверк' },
  { id: 'stars', name: 'Звёзды' },
  { id: 'hearts', name: 'Сердечки' },
  { id: 'snowflakes', name: 'Снежинки' },
  { id: 'bubbles', name: 'Пузырьки' },
  { id: 'sparkles', name: 'Искры' },
  { id: 'ribbons', name: 'Ленточки' },
  { id: 'flowers', name: 'Цветы' },
  { id: 'rainbowRain', name: 'Радужный дождь' },
  { id: 'coins', name: 'Монеты' },
  { id: 'butterflies', name: 'Бабочки' },
  { id: 'leaves', name: 'Листья' },
  { id: 'lightning', name: 'Молнии' },
  { id: 'balloons', name: 'Воздушные шары' },
  { id: 'diamonds', name: 'Бриллианты' },
  { id: 'music', name: 'Музыкальные ноты' },
  { id: 'fire', name: 'Огонь' },
  { id: 'matrix', name: 'Матрица' },
  { id: 'aurora', name: 'Северное сияние' },
] as const;

export type EffectType = typeof EFFECT_TYPES[number]['id'];

interface CelebrationEffectsProps {
  effectType: EffectType;
  duration?: number;
  onComplete?: () => void;
}

const COLORS = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#ff0088', '#88ff00', '#0088ff'];
const PASTEL = ['#FFB3BA', '#BAFFC9', '#BAE1FF', '#FFFFBA', '#E8BAFF', '#FFDFBA'];

function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function CelebrationEffects({ effectType, duration = 4000, onComplete }: CelebrationEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  const animate = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number) => {
    interface Particle {
      x: number; y: number; vx: number; vy: number;
      size: number; color: string; rotation: number; rotSpeed: number;
      life: number; maxLife: number; shape: string; opacity: number;
      phase?: number;
    }
    const particles: Particle[] = [];
    const startTime = Date.now();

    function createParticles() {
      const count = effectType === 'aurora' ? 3 : effectType === 'matrix' ? 15 : 8;
      for (let i = 0; i < count; i++) {
        const p: Particle = {
          x: Math.random() * w,
          y: effectType === 'balloons' ? h + 20 : effectType === 'bubbles' ? h + 20 : -20,
          vx: (Math.random() - 0.5) * 4,
          vy: effectType === 'balloons' ? -(Math.random() * 2 + 1) : effectType === 'bubbles' ? -(Math.random() * 1.5 + 0.5) : Math.random() * 3 + 1,
          size: Math.random() * 12 + 6,
          color: randomFrom(COLORS),
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.15,
          life: 0,
          maxLife: 60 + Math.random() * 60,
          shape: effectType,
          opacity: 1,
          phase: Math.random() * Math.PI * 2,
        };

        switch (effectType) {
          case 'fireworks':
            p.x = Math.random() * w;
            p.y = h * 0.3 + Math.random() * h * 0.3;
            p.vx = (Math.random() - 0.5) * 8;
            p.vy = (Math.random() - 0.5) * 8;
            p.size = Math.random() * 4 + 2;
            p.maxLife = 30 + Math.random() * 30;
            break;
          case 'hearts':
            p.color = randomFrom(['#ff1744', '#e91e63', '#f44336', '#ff5252', '#ff4081']);
            p.size = Math.random() * 15 + 8;
            break;
          case 'snowflakes':
            p.color = randomFrom(['#ffffff', '#e3f2fd', '#bbdefb', '#90caf9']);
            p.vy = Math.random() * 1.5 + 0.5;
            p.vx = (Math.random() - 0.5) * 1;
            p.size = Math.random() * 10 + 4;
            break;
          case 'flowers':
            p.color = randomFrom(['#ff69b4', '#ffb6c1', '#ff1493', '#db7093', '#ffc0cb', '#f06292']);
            p.size = Math.random() * 14 + 8;
            break;
          case 'coins':
            p.color = randomFrom(['#ffd700', '#ffb700', '#ffa000', '#ff8f00']);
            p.size = Math.random() * 10 + 6;
            break;
          case 'butterflies':
            p.color = randomFrom(['#7c4dff', '#536dfe', '#448aff', '#40c4ff', '#ff4081']);
            p.size = Math.random() * 14 + 8;
            p.vy = Math.random() * 1.5 + 0.3;
            break;
          case 'leaves':
            p.color = randomFrom(['#2e7d32', '#388e3c', '#43a047', '#66bb6a', '#81c784', '#a5d6a7']);
            p.size = Math.random() * 12 + 6;
            p.vy = Math.random() * 1.5 + 0.5;
            break;
          case 'lightning':
            p.color = randomFrom(['#ffeb3b', '#fff176', '#fdd835', '#ffffff']);
            p.size = Math.random() * 20 + 10;
            p.maxLife = 10 + Math.random() * 15;
            break;
          case 'diamonds':
            p.color = randomFrom(['#b2ebf2', '#80deea', '#4dd0e1', '#00bcd4', '#e1f5fe']);
            p.size = Math.random() * 12 + 6;
            break;
          case 'music':
            p.color = randomFrom(COLORS);
            p.size = Math.random() * 16 + 10;
            p.vy = -(Math.random() * 1.5 + 0.5);
            p.y = h + 20;
            break;
          case 'fire':
            p.color = randomFrom(['#ff5722', '#ff9800', '#ffeb3b', '#ff6f00', '#ff3d00']);
            p.y = h + 20;
            p.vy = -(Math.random() * 3 + 1);
            p.size = Math.random() * 15 + 8;
            break;
          case 'matrix':
            p.color = '#00ff41';
            p.size = Math.random() * 14 + 8;
            p.vy = Math.random() * 5 + 2;
            p.vx = 0;
            break;
          case 'aurora':
            p.x = Math.random() * w;
            p.y = Math.random() * h * 0.4;
            p.size = Math.random() * 100 + 50;
            p.color = randomFrom(['#00ff87', '#60efff', '#7c4dff', '#00e5ff', '#1de9b6']);
            p.maxLife = 80 + Math.random() * 60;
            break;
          case 'sparkles':
            p.color = randomFrom(['#ffd700', '#ffffff', '#ffeb3b', '#fff9c4']);
            p.size = Math.random() * 6 + 3;
            p.maxLife = 20 + Math.random() * 20;
            break;
          case 'ribbons':
            p.color = randomFrom(PASTEL);
            p.size = Math.random() * 20 + 10;
            break;
          case 'rainbowRain':
            p.color = `hsl(${Math.random() * 360}, 80%, 60%)`;
            p.size = Math.random() * 4 + 2;
            p.vy = Math.random() * 6 + 3;
            p.vx = 0;
            break;
          case 'stars':
            p.color = randomFrom(['#ffd700', '#ffeb3b', '#fff9c4', '#ffffff', '#ffe082']);
            p.size = Math.random() * 10 + 5;
            break;
        }
        particles.push(p);
      }
    }

    function drawShape(p: Particle) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity * (1 - p.life / p.maxLife);

      switch (p.shape) {
        case 'confetti':
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          break;
        case 'fireworks':
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
          ctx.fill();
          break;
        case 'stars':
          drawStar(ctx, 0, 0, 5, p.size, p.size / 2, p.color);
          break;
        case 'hearts':
          drawHeart(ctx, 0, 0, p.size, p.color);
          break;
        case 'snowflakes':
          drawSnowflake(ctx, 0, 0, p.size, p.color);
          break;
        case 'bubbles':
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.fillStyle = p.color + '20';
          ctx.fill();
          break;
        case 'sparkles':
          drawStar(ctx, 0, 0, 4, p.size, p.size / 3, p.color);
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.color;
          break;
        case 'ribbons':
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-p.size, 0);
          ctx.quadraticCurveTo(0, p.size * Math.sin(p.life * 0.1), p.size, 0);
          ctx.stroke();
          break;
        case 'flowers':
          for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            const angle = (i / 5) * Math.PI * 2;
            ctx.ellipse(Math.cos(angle) * p.size * 0.4, Math.sin(angle) * p.size * 0.4, p.size * 0.3, p.size * 0.2, angle, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();
          }
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.15, 0, Math.PI * 2);
          ctx.fillStyle = '#ffeb3b';
          ctx.fill();
          break;
        case 'rainbowRain':
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size * 2, p.size, p.size * 4);
          break;
        case 'coins':
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * Math.abs(Math.cos(p.life * 0.1)), 0, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
          ctx.strokeStyle = '#b8860b';
          ctx.lineWidth = 1;
          ctx.stroke();
          break;
        case 'butterflies':
          ctx.fillStyle = p.color;
          const wingFlap = Math.sin(p.life * 0.3) * 0.5;
          ctx.beginPath();
          ctx.ellipse(-p.size * 0.3, 0, p.size * 0.4, p.size * 0.3 * (0.5 + wingFlap), -0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(p.size * 0.3, 0, p.size * 0.4, p.size * 0.3 * (0.5 + wingFlap), 0.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#333';
          ctx.fillRect(-1, -p.size * 0.3, 2, p.size * 0.6);
          break;
        case 'leaves':
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 0.5, p.size * 0.25, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#1b5e20';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-p.size * 0.4, 0);
          ctx.lineTo(p.size * 0.4, 0);
          ctx.stroke();
          break;
        case 'lightning':
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 2;
          ctx.shadowBlur = 15;
          ctx.shadowColor = p.color;
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.lineTo(p.size * 0.3, -p.size * 0.2);
          ctx.lineTo(-p.size * 0.1, -p.size * 0.1);
          ctx.lineTo(p.size * 0.2, p.size);
          ctx.stroke();
          break;
        case 'balloons':
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 0.6, p.size * 0.8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, p.size * 0.8);
          ctx.lineTo(0, p.size * 1.5);
          ctx.stroke();
          break;
        case 'diamonds':
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.moveTo(0, -p.size);
          ctx.lineTo(p.size * 0.6, 0);
          ctx.lineTo(0, p.size);
          ctx.lineTo(-p.size * 0.6, 0);
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.color;
          break;
        case 'music':
          ctx.fillStyle = p.color;
          ctx.font = `${p.size}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const notes = ['\u266A', '\u266B', '\u2669'];
          ctx.fillText(notes[Math.floor(p.life) % notes.length], 0, 0);
          break;
        case 'fire':
          const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
          gradient.addColorStop(0, '#ffeb3b');
          gradient.addColorStop(0.4, p.color);
          gradient.addColorStop(1, 'transparent');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        case 'matrix':
          ctx.fillStyle = p.color;
          ctx.font = `${p.size}px monospace`;
          ctx.textAlign = 'center';
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
          const chars = '01';
          ctx.fillText(chars[Math.floor(Math.random() * chars.length)], 0, 0);
          break;
        case 'aurora':
          const aGrad = ctx.createLinearGradient(-p.size, 0, p.size, 0);
          aGrad.addColorStop(0, 'transparent');
          aGrad.addColorStop(0.5, p.color + '40');
          aGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = aGrad;
          ctx.fillRect(-p.size, -p.size * 0.3, p.size * 2, p.size * 0.6);
          break;
      }
      ctx.restore();
    }

    function step() {
      const elapsed = Date.now() - startTime;
      if (elapsed > duration) {
        ctx.clearRect(0, 0, w, h);
        onComplete?.();
        return;
      }
      ctx.clearRect(0, 0, w, h);
      if (elapsed < duration - 1000) createParticles();

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.life++;
        if (effectType !== 'balloons' && effectType !== 'bubbles' && effectType !== 'fire' && effectType !== 'music') {
          p.vy += 0.03;
        }
        if (effectType === 'butterflies' || effectType === 'leaves') {
          p.vx += Math.sin(p.life * 0.05) * 0.1;
        }
        if (p.life >= p.maxLife || p.y > h + 50 || p.y < -50 || p.x < -50 || p.x > w + 50) {
          particles.splice(i, 1);
        } else {
          drawShape(p);
        }
      }
      animationRef.current = requestAnimationFrame(step);
    }
    animationRef.current = requestAnimationFrame(step);
  }, [effectType, duration, onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    animate(ctx, canvas.width, canvas.height);
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [animate]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9998] pointer-events-none"
      data-testid="canvas-celebration-effect"
    />
  );
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function drawHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  const s = size * 0.5;
  ctx.moveTo(cx, cy + s * 0.5);
  ctx.bezierCurveTo(cx - s, cy - s * 0.3, cx - s * 0.5, cy - s, cx, cy - s * 0.4);
  ctx.bezierCurveTo(cx + s * 0.5, cy - s, cx + s, cy - s * 0.3, cx, cy + s * 0.5);
  ctx.fill();
}

function drawSnowflake(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * size, cy + Math.sin(angle) * size);
    ctx.stroke();
    ctx.beginPath();
    const bx = cx + Math.cos(angle) * size * 0.6;
    const by = cy + Math.sin(angle) * size * 0.6;
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + Math.cos(angle + 0.5) * size * 0.3, by + Math.sin(angle + 0.5) * size * 0.3);
    ctx.stroke();
  }
}
