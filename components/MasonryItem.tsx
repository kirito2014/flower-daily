/* components/MasonryItem.tsx */
'use client';

import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Flower } from '@prisma/client';
import { Camera } from 'lucide-react';

interface MasonryItemProps {
  flower: Flower;
  enable3D: boolean;
  onClick: (flower: Flower) => void;
}

export default function MasonryItem({ flower, enable3D, onClick }: MasonryItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [7, -7]); 
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-7, 7]); 
  
  const infoX = useTransform(mouseX, [-0.5, 0.5], [-10, 10]);
  const infoY = useTransform(mouseY, [-0.5, 0.5], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enable3D || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXVal = (e.clientX - rect.left) / width - 0.5;
    const mouseYVal = (e.clientY - rect.top) / height - 0.5;
    x.set(mouseXVal);
    y.set(mouseYVal);
  };

  const handleMouseLeave = () => {
    if (!enable3D) return;
    x.set(0);
    y.set(0);
  };

  return (
    <div className="mb-4 break-inside-avoid relative" style={{ perspective: '1000px' }}>
      <motion.div
        ref={ref}
        layoutId={`card-${flower.id}`}
        onClick={() => onClick(flower)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: enable3D ? rotateX : 0,
          rotateY: enable3D ? rotateY : 0,
          transformStyle: 'preserve-3d',
          // ✅ 修复圆角闪烁的关键:
          // 1. 强制 GPU 加速
          transform: 'translateZ(0)', 
          // 2. Safari/Chrome 遮罩 hack，确保圆角在 3D 变换下依然有效
          WebkitMaskImage: '-webkit-radial-gradient(white, black)',
        }}
        // ✅ 添加 isolation-isolate
        className="relative w-full rounded-2xl overflow-hidden cursor-pointer bg-stone-900 group shadow-lg hover:shadow-2xl transition-shadow duration-300 isolation-isolate transform-gpu"
      >
        <img
          src={flower.imageUrl}
          alt={flower.name}
          loading="lazy"
          className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110"
          style={{ display: 'block' }}
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        <motion.div
          style={{
             x: enable3D ? infoX : 0,
             y: enable3D ? infoY : 0,
             z: 30, 
          }}
          className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 shadow-lg flex flex-col gap-1 items-center text-center pointer-events-none"
        >
          <h3 className="font-serif font-bold text-lg tracking-wide">{flower.name}</h3>
          <p className="text-[10px] text-white/80 line-clamp-1 italic px-2">“{flower.language}”</p>
          <div className="w-full h-px bg-white/10 my-1" />
          <div className="flex items-center gap-1 text-[10px] text-white/60">
            <Camera size={10} />
            <span>{flower.photographer || 'Unsplash'}</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}