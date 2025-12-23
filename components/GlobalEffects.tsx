'use client';

import { useEffect, useRef } from 'react';

// === 配置项 ===
const PETAL_EMOJIS = ['🌸', '🌹', '🌺', '🌻', '🌼', '🍃', '🌷'];
const CONFETTI_COLORS = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500'];

// 性能优化配置
const MAX_PARTICLES = 20; // ⚠️ 最大同时存在粒子数 (降低此值可大幅提升性能)
const MOUSE_DIST_THRESHOLD = 150; // ⚠️ 鼠标移动多少像素才生成一个 (加大此值减少生成频率)

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  type: 'petal' | 'flower' | 'confetti';
  text?: string;
  color?: string;
  gravity?: number;
  sway?: number;
  swayOffset?: number;
}

export default function GlobalEffects() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const mouse = useRef({ x: 0, y: 0, lastX: 0, lastY: 0 });
  const reqRef = useRef<number>(0); // 存储动画帧ID

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true }); // alpha: true 允许透明背景
    if (!ctx) return;

    // === 1. 初始化画布尺寸 (处理高分屏模糊问题，同时控制性能) ===
    const resize = () => {
      // 这里的策略是：保持 1:1 像素比，虽然在高分屏可能不如原生清晰，
      // 但对于背景特效来说，性能优先，避免 4K 屏渲染压力过大
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // === 2. 粒子管理 ===
    
    // 添加粒子 (带总量限制)
    const addParticle = (p: Particle) => {
      if (particles.current.length >= MAX_PARTICLES) {
        particles.current.shift(); // 移除最早的一个
      }
      particles.current.push(p);
    };

    // 生成花瓣
    const createPetal = (x: number, y: number) => {
      addParticle({
        x,
        y,
        vx: (Math.random() - 0.5) * 1.5,
        vy: Math.random() * 1.5 + 1, // 稍微减慢下落速度
        life: 1,
        decay: Math.random() * 0.01 + 0.008, // 加快一点衰减
        size: Math.random() * 10 + 10, // 稍微调小尺寸
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.05,
        type: 'petal',
        text: PETAL_EMOJIS[Math.floor(Math.random() * PETAL_EMOJIS.length)],
        sway: Math.random() * 2,
        swayOffset: Math.random() * Math.PI * 2,
      });
    };

    // 生成主花朵
    const createBigFlower = (x: number, y: number) => {
      // 点击产生的大花朵不受 limit 限制，或者单独处理，这里为了简单统一处理
      // 但为了保证效果，我们可以先腾出空间
      if (particles.current.length > MAX_PARTICLES - 20) {
        particles.current.splice(0, 20);
      }

      particles.current.push({
        x,
        y,
        vx: 0,
        vy: -0.5,
        life: 1,
        decay: 0.015,
        size: 10,
        rotation: 0,
        rotationSpeed: 0.05,
        type: 'flower',
        text: PETAL_EMOJIS[Math.floor(Math.random() * PETAL_EMOJIS.length)],
      });
    };

    // 生成彩带
    const createConfetti = (x: number, y: number) => {
      const count = 12; // 减少彩带数量 (原20)
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 3;
        addParticle({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1,
          decay: Math.random() * 0.03 + 0.02, // 彩带消失得快
          size: Math.random() * 4 + 3,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.2,
          type: 'confetti',
          color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
          gravity: 0.25,
        });
      }
    };

    // === 3. 事件监听 ===
    const handleMouseMove = (e: MouseEvent) => {
      // 距离检测 (节流)
      const dx = e.clientX - mouse.current.lastX;
      const dy = e.clientY - mouse.current.lastY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > MOUSE_DIST_THRESHOLD) { 
        createPetal(e.clientX, e.clientY);
        mouse.current.lastX = e.clientX;
        mouse.current.lastY = e.clientY;
      }
    };

    const handleClick = (e: MouseEvent) => {
      createBigFlower(e.clientX, e.clientY);
      createConfetti(e.clientX, e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    // === 4. 动画循环 ===
    const animate = () => {
      // 如果没有粒子，就不清空也不重绘，节省 GPU
      if (particles.current.length === 0) {
        // 但需要保持循环以检测后续输入
        reqRef.current = requestAnimationFrame(animate);
        // 为了防止残留，如果刚好清空了，可以多清一次
        // ctx.clearRect(0, 0, canvas.width, canvas.height); 
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i];
        
        // 更新生命
        p.life -= p.decay;
        if (p.life <= 0) {
          particles.current.splice(i, 1);
          continue;
        }

        // 物理计算
        if (p.type === 'petal') {
          // 简化三角函数计算，不用每帧都算很复杂的
          p.x += Math.sin(p.life * 10 + p.swayOffset!) * 0.5 + p.vx; 
          p.y += p.vy;
          p.rotation += p.rotationSpeed;
        } else if (p.type === 'flower') {
          const progress = 1 - p.life;
          p.size = 10 + progress * 60; // 稍微调小最大尺寸
          p.y += p.vy;
          p.rotation += p.rotationSpeed;
        } else if (p.type === 'confetti') {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity!;
          p.vx *= 0.95;
          p.rotation += p.rotationSpeed;
        }

        // 绘制
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.life; // 透明度

        if (p.type === 'confetti') {
          ctx.fillStyle = p.color!;
          // 使用 fillRect 比 fillText 快得多
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else {
          // 只有花瓣和花朵用文字渲染
          ctx.font = `${Math.floor(p.size)}px serif`; // 取整字体大小对性能有微小帮助
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.text!, 0, 0);
        }

        ctx.restore();
      }

      reqRef.current = requestAnimationFrame(animate);
    };

    reqRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      cancelAnimationFrame(reqRef.current);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-[9999]" 
    />
  );
}