/* components/ScatteredPolaroids.tsx */
'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Flower } from '@prisma/client';

// 模拟随机数工具
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

interface PolaroidProps {
  flower: Flower;
  index: number;
  total: number;
  // ✅ 修复：放宽类型定义，允许 null，解决波浪线报错
  constraintsRef: React.RefObject<HTMLDivElement | null>;
}

const PolaroidItem = ({ flower, index, total, constraintsRef }: PolaroidProps) => {
  // 随机初始位置和角度（使用 ref 保持在重渲染时不变）
  const randomRotate = useRef(randomInt(-15, 15));
  const randomX = useRef(randomInt(-100, 100));
  const randomY = useRef(randomInt(-50, 50));
  
  // 拖拽层级管理
  const [zIndex, setZIndex] = useState(index);
  
  // 模拟光效：根据拖拽位置改变反光角度
  const x = useMotionValue(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const rotateX = useTransform(x, [-200, 200], [5, -5]); 
  const sheenOpacity = useTransform(x, [-150, 0, 150], [0, 0.4, 0]); 

  return (
    <motion.div
      drag
      dragConstraints={constraintsRef}
      dragElastic={0.1}
      whileDrag={{ scale: 1.05, cursor: 'grabbing', rotate: 0, zIndex: 999 }}
      whileHover={{ scale: 1.02, zIndex: 100 }}
      onDragStart={() => setZIndex(999)}
      onDragEnd={() => setZIndex(index + 10)} 
      initial={{ 
        x: randomX.current, 
        y: randomY.current, 
        rotate: randomRotate.current, 
        opacity: 0,
        scale: 0.8
      }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        transition: { delay: index * 0.1, duration: 0.5 }
      }}
      style={{ 
        x, 
        zIndex,
        position: 'absolute',
        top: '30%', 
        left: '40%',
      }}
      className="relative group cursor-grab touch-none"
    >
      {/* === 1. 物理层：相纸底座 === */}
      <div className="relative w-[280px] h-[320px] select-none">
        
        {/* 悬浮阴影 */}
        <div className="absolute inset-2 bg-black/40 blur-xl rounded-sm transform translate-y-2 group-hover:translate-y-6 group-hover:blur-2xl transition-all duration-300" />

        {/* 相纸主体 */}
        <div className="absolute inset-0  shadow-sm overflow-hidden rounded-[4px] ">
            {/* 假如您上传了真实素材 polaroid.png，请解开下行注释并删除上面的 bg-[#fdfdfd] div */}
            <img src="images/polaroid-frame.png" className="w-full h-full object-cover pointer-events-none" />
            
            {/* 模拟纸张纹理 */}
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none mix-blend-multiply" />
        </div>

        {/* === 2. 显影层：照片区域 === */}
        <div 
            className="absolute top-[26px] left-[33px] right-[32px] h-[227px] bg-stone-900 overflow-hidden shadow-inner rounded-[2px]"
            style={{ 
                boxShadow: 'inset 2px 2px 6px rgba(0,0,0,0.6), inset -1px -1px 2px rgba(255,255,255,0.1)' 
            }}
        >
            <img 
                src={flower.imageUrl} 
                alt={flower.name}
                className="w-full h-full object-cover pointer-events-none"
                draggable={false}
                style={{
                    filter: 'contrast(1.1) brightness(1.1) saturate(0.8) sepia(0.2) grayscale(0.1)'
                }}
            />
            {/* 暗角 */}
            <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_50%,rgba(0,0,0,0.4)_120%)] pointer-events-none mix-blend-multiply" />
            
            {/* === 3. 光学层：反光特效 === */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 pointer-events-none mix-blend-screen opacity-60" />
            <motion.div 
                style={{ opacity: sheenOpacity }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 pointer-events-none mix-blend-overlay" 
            />
        </div>

        {/* === 4. 文字层 === */}
        <div className="absolute bottom-4 left-0 w-full text-center px-4">
            <p className="text-stone-800/80 text-lg rotate-[-1deg] font-bold tracking-wide" style={{ fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif' }}>
                {flower.name}
            </p>
            <p className="text-[10px] text-stone-400 font-mono mt-1 opacity-60 rotate-[0.5deg]">
                {new Date(flower.createdAt).toLocaleDateString()}
            </p>
        </div>
        
        {/* 表面划痕 */}
        <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/scratches.png')]" />

      </div>
    </motion.div>
  );
};

interface ScatteredPolaroidsProps {
  flowers: Flower[];
}

export default function ScatteredPolaroids({ flowers }: ScatteredPolaroidsProps) {
  // ✅ 这里的类型是 RefObject<HTMLDivElement | null>
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden relative bg-[#2a2a2a] perspective-1000">
      {/* 桌面背景 */}
      <div className="absolute inset-0 bg-[#fdfdfd] opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/20 pointer-events-none" />

      {flowers.map((flower, i) => (
        <PolaroidItem 
            key={flower.id} 
            flower={flower} 
            index={i} 
            total={flowers.length} 
            constraintsRef={containerRef} 
        />
      ))}
      
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/30 text-xs font-serif tracking-widest pointer-events-none select-none">
        DRAG TO REARRANGE YOUR MEMORIES
      </div>
    </div>
  );
}