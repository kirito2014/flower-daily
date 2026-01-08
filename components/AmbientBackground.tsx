/* components/AmbientBackground.tsx */
'use client';

import React, { useEffect, useRef, useState } from 'react';

interface AmbientBackgroundProps {
  imageUrl: string | null;
  isActive: boolean;
}

export default function AmbientBackground({ imageUrl, isActive }: AmbientBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  // 鼠标移动监听，用于制造流沙/丝绸效果
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth) * 100;
      const y = (e.clientY / innerHeight) * 100;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (!isActive) return null;

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      style={{ opacity: isActive ? 1 : 0, transition: 'opacity 1s ease' }}
    >
      {/* 1. 基础背景层：使用当前图片生成高斯模糊的氛围色 */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-[1500ms] ease-in-out scale-125"
        style={{ 
          backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
          filter: 'blur(80px) saturate(1.2) brightness(0.8)',
        }}
      />
      
      {/* 2. 噪点纹理叠加：增加磨砂质感 */}
      <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* 3. 动态流沙/丝绸光影层：跟随鼠标移动的混合模式层 */}
      <div 
        className="absolute inset-0 transition-transform duration-300 ease-out"
        style={{
          background: `
            radial-gradient(
              circle at ${mousePos.x}% ${mousePos.y}%, 
              rgba(255, 255, 255, 0.15) 0%, 
              transparent 50%
            )
          `,
          mixBlendMode: 'overlay', // 叠加模式产生丝绸感
        }}
      />

      {/* 4. 漂浮的不规则磨砂块：模拟玻璃折射 */}
      <div className="absolute inset-0">
        {/* 块 1 */}
        <div 
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-white/5 backdrop-blur-3xl mix-blend-soft-light transition-transform duration-1000"
          style={{
            transform: `translate(${mousePos.x * -0.05}px, ${mousePos.y * -0.05}px) rotate(${mousePos.x}deg)`,
          }}
        />
        {/* 块 2 */}
        <div 
          className="absolute bottom-1/3 right-1/4 w-[500px] h-[300px] rounded-[100%] bg-white/5 backdrop-blur-2xl mix-blend-overlay transition-transform duration-1000 delay-75"
          style={{
            transform: `translate(${mousePos.x * 0.08}px, ${mousePos.y * 0.08}px) rotate(-${mousePos.y}deg)`,
          }}
        />
         {/* 块 3 */}
         <div 
          className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-black/10 backdrop-blur-xl transition-transform duration-1000 delay-100"
          style={{
            transform: `translate(-50%, -50%) translate(${mousePos.x * 0.02}px, ${mousePos.y * 0.02}px)`,
          }}
        />
      </div>
    </div>
  );
}