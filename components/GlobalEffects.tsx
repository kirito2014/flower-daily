'use client';

import { useEffect, useRef } from 'react';

// === 配置项 ===
const PETAL_EMOJIS = ['🌸', '🌹', '🌺', '🌻', '🌼', '🍃', '🌷'];
const CONFETTI_COLORS = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500'];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;     // 生命值 (0-1)
  decay: number;    // 衰减速度
  size: number;
  rotation: number;
  rotationSpeed: number;
  type: 'petal' | 'flower' | 'confetti';
  text?: string;    // Emoji 或 文字
  color?: string;   // 仅 confetti 用
  gravity?: number; // 重力系数
  sway?: number;    // 飘动系数
  swayOffset?: number; // 飘动偏移
}

export default function GlobalEffects() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const mouse = useRef({ x: 0, y: 0, lastX: 0, lastY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // === 1. 初始化画布尺寸 ===
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // === 2. 粒子生成器 ===
    
    // 生成花瓣 (鼠标移动)
    const createPetal = (x: number, y: number) => {
      particles.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 1.5, // 稍微左右随机飘
        vy: Math.random() * 2 + 1,       // 向下飘
        life: 1,
        decay: Math.random() * 0.01 + 0.005,
        size: Math.random() * 15 + 10,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        type: 'petal',
        text: PETAL_EMOJIS[Math.floor(Math.random() * PETAL_EMOJIS.length)],
        sway: Math.random() * 2,     // 左右摇摆幅度
        swayOffset: Math.random() * Math.PI * 2,
      });
    };

    // 生成主花朵 (点击)
    const createBigFlower = (x: number, y: number) => {
      particles.current.push({
        x,
        y,
        vx: 0,
        vy: -0.5, // 微微上升
        life: 1,
        decay: 0.01,
        size: 10,  // 初始很小，动画里放大
        rotation: 0,
        rotationSpeed: 0.05,
        type: 'flower',
        text: PETAL_EMOJIS[Math.floor(Math.random() * PETAL_EMOJIS.length)],
      });
    };

    // 生成彩带 (点击)
    const createConfetti = (x: number, y: number) => {
      const count = 20; // 爆发数量
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 3;
        particles.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          decay: Math.random() * 0.02 + 0.01,
          size: Math.random() * 6 + 4,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.2,
          type: 'confetti',
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          gravity: 0.2, // 明显的重力
        });
      }
    };

    // === 3. 事件监听 ===
    
    // 鼠标移动 -> 撒花瓣
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
      
      // 距离检测，避免静止时产生太多
      const dx = e.clientX - mouse.current.lastX;
      const dy = e.clientY - mouse.current.lastY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 20) { // 每移动20px生成一个
        createPetal(e.clientX, e.clientY);
        mouse.current.lastX = e.clientX;
        mouse.current.lastY = e.clientY;
      }
    };

    // 点击 -> 生成花朵 + 彩带
    const handleClick = (e: MouseEvent) => {
      createBigFlower(e.clientX, e.clientY);
      createConfetti(e.clientX, e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    // === 4. 动画循环 ===
    let animationFrameId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 遍历更新粒子
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        
        // 更新生命
        p.life -= p.decay;
        if (p.life <= 0) {
          particles.current.splice(i, 1);
          continue;
        }

        // 更新位置 & 物理
        if (p.type === 'petal') {
          p.x += Math.sin(Date.now() * 0.003 + p.swayOffset!) * 0.5 + p.vx; // 左右飘动
          p.y += p.vy;
          p.rotation += p.rotationSpeed;
        } else if (p.type === 'flower') {
          // 放大效果：生命值越高(刚出生)，尺寸越大？不对，应该是随时间变大
          // 我们让它 scale 从 0 -> 2
          const progress = 1 - p.life; // 0 -> 1
          p.size = 10 + progress * 80; // 变大
          p.y += p.vy;
          p.rotation += p.rotationSpeed;
        } else if (p.type === 'confetti') {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity!; // 重力加速
          p.vx *= 0.95; // 空气阻力
          p.rotation += p.rotationSpeed;
        }

        // 绘制
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.life;

        if (p.type === 'confetti') {
          ctx.fillStyle = p.color!;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else {
          // 绘制 Emoji
          ctx.font = `${p.size}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.text!, 0, 0);
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // === 清理 ===
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-[9999]" 
    />
  );
}