'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Flower } from '@prisma/client';
import { RefreshCcw, Loader2, Share2, Sparkles, RotateCw } from 'lucide-react';
import { toPng } from 'html-to-image';

interface FlowerCardProps {
  flower: Flower;
  onNext: () => void;
  loading: boolean;
}

export default function FlowerCard3D({ flower, onNext, loading }: FlowerCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  // Refs
  const cardRef = useRef<HTMLDivElement>(null);
  const cardInnerRef = useRef<HTMLDivElement>(null);
  const frontImgRef = useRef<HTMLDivElement>(null);
  const backImgRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 专门用于分享截图的 Ref
  const shareHiddenRef = useRef<HTMLDivElement>(null);

  const rafRef = useRef<number>(0);

  // === 1. 物理动画逻辑 (保持不变) ===
  useEffect(() => {
    const card = cardRef.current;
    const cardInner = cardInnerRef.current;
    const frontImg = frontImgRef.current;
    const backImg = backImgRef.current;

    if (!card || !cardInner || !frontImg || !backImg) return;

    const AnimationState = {
        RANDOM_FLOAT: 'random_float',
        HOVER: 'hover',
        TRANSITION: 'transition',
        FLIP: 'flip'
    };

    let currentState = AnimationState.RANDOM_FLOAT;
    let currentPosition = { x: 0, y: 0, rotate: 0, rotateX: 0, rotateY: 0 };
    
    function generateRandomPosition() {
        return {
            x: (Math.random() - 0.5) * 10,
            y: (Math.random() - 0.5) * 10,
            rotate: (Math.random() - 0.5) * 2,
            rotateX: (Math.random() - 0.5) * 4,
            rotateY: (Math.random() - 0.5) * 4
        };
    }

    function smoothTransition(targetPos: any, duration = 2000) {
        const startPos = { ...currentPosition };
        const startTime = performance.now();
        const baseRotation = isFlipped ? 180 : 0;

        function update(currentTime: number) {
            if (currentState !== AnimationState.RANDOM_FLOAT) return;

            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeProgress = progress < .5 ? 
                4 * progress * progress * progress : 
                1 - Math.pow(-2 * progress + 2, 3) / 2;

            const x = startPos.x + (targetPos.x - startPos.x) * easeProgress;
            const y = startPos.y + (targetPos.y - startPos.y) * easeProgress;
            const rotate = startPos.rotate + (targetPos.rotate - startPos.rotate) * easeProgress;
            const rotateX = startPos.rotateX + (targetPos.rotateX - startPos.rotateX) * easeProgress;
            const rotateY = startPos.rotateY + (targetPos.rotateY - startPos.rotateY) * easeProgress;

            currentPosition = { x, y, rotate, rotateX, rotateY };

            if (cardInner) {
                cardInner.style.transform = `
                    translate3d(${x}px, ${y}px, 0)
                    rotateY(${baseRotation + rotateY}deg)
                    rotateX(${rotateX}deg)
                    rotateZ(${rotate}deg)
                `;
            }

            const imgTransform = `
                translate3d(${-x * 0.5}px, ${-y * 0.5}px, 0)
                rotateX(${-rotateX * 0.5}deg)
                rotateY(${-rotateY * 0.5}deg)
                scale(1.1) 
            `;
            if (frontImg) frontImg.style.transform = imgTransform;
            if (backImg) backImg.style.transform = imgTransform;

            if (progress < 1) {
                rafRef.current = requestAnimationFrame(update);
            } else {
                startRandomFloat(); 
            }
        }
        rafRef.current = requestAnimationFrame(update);
    }

    function startRandomFloat() {
        if (currentState !== AnimationState.RANDOM_FLOAT) return;
        const targetPos = generateRandomPosition();
        smoothTransition(targetPos);
    }

    const handleMouseEnter = () => {
        if (currentState === AnimationState.FLIP) return;
        currentState = AnimationState.HOVER;
        cancelAnimationFrame(rafRef.current);
        cardInner.style.transition = 'transform 0.2s ease-out';
        if (frontImg) frontImg.style.transition = 'transform 0.2s ease-out';
        if (backImg) backImg.style.transition = 'transform 0.2s ease-out';
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (currentState !== AnimationState.HOVER) return;
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
        const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
        const baseRotation = isFlipped ? 180 : 0;

        cardInner.style.transform = `
            rotateY(${baseRotation + x * 20}deg)
            rotateX(${-y * 20}deg)
        `;
        const imgTransform = `
            translate3d(${x * -30}px, ${y * -30}px, 0)
            scale(1.1)
        `;
        if (frontImg) frontImg.style.transform = imgTransform;
        if (backImg) backImg.style.transform = imgTransform;
    };

    const handleMouseLeave = () => {
        if (currentState === AnimationState.FLIP) return;
        currentState = AnimationState.TRANSITION;
        const resetImgTransform = 'translate3d(0, 0, 0) scale(1.0)';
        
        cardInner.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
        if (frontImg) {
            frontImg.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
            frontImg.style.transform = resetImgTransform;
        }
        if (backImg) {
            backImg.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
            backImg.style.transform = resetImgTransform;
        }

        const baseRotation = isFlipped ? 180 : 0;
        cardInner.style.transform = `rotateY(${baseRotation}deg)`;

        setTimeout(() => {
            if (currentState === AnimationState.TRANSITION) {
                currentState = AnimationState.RANDOM_FLOAT;
                cardInner.style.transition = 'none'; 
                if (frontImg) frontImg.style.transition = 'none';
                if (backImg) backImg.style.transition = 'none';
                startRandomFloat();
            }
        }, 600);
    };

    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    startRandomFloat();

    return () => {
        cancelAnimationFrame(rafRef.current);
        card.removeEventListener('mouseenter', handleMouseEnter);
        card.removeEventListener('mousemove', handleMouseMove);
        card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isFlipped]); 


  // === 2. 交互逻辑 ===

  const triggerPetalExplosion = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    for (let i = 0; i < 20; i++) {
        const petal = document.createElement('div');
        petal.classList.add('petal-particle');
        const size = 6 + Math.random() * 8;
        petal.style.width = `${size}px`; petal.style.height = `${size}px`;
        container.appendChild(petal);
        const angle = (Math.random() * Math.PI * 1.5) + Math.PI * 1.25; 
        const force = 60 + Math.random() * 100;
        const gravity = 200;
        petal.animate([
            { transform: `translate(-50%, -50%) scale(0.5)`, opacity: 1 },
            { transform: `translate(-50%, -50%) translate(${Math.cos(angle) * force}px, ${Math.sin(angle) * force + gravity}px) rotate(${Math.random()*360}deg) scale(0)`, opacity: 0 }
        ], { duration: 1000 + Math.random() * 500, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', fill: 'forwards' }).onfinish = () => petal.remove();
    }
  }, []);

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (!isFlipped) triggerPetalExplosion();
    if (!isSharing) setIsFlipped(!isFlipped);
  };

  const handleNextClick = () => {
    setIsFlipped(false);
    setTimeout(() => { onNext(); }, 600);
  };

  // 修复分享：复用 AdminFlowerCard 的样式
  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!shareHiddenRef.current || isSharing) return; // 注意：这里 capture 的是隐藏的 shareHiddenRef
    setIsSharing(true);

    try {
      const dataUrl = await toPng(shareHiddenRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `${flower.name}-daily.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Share failed', err);
      alert('生成图片失败，请重试');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <>
      {/* === 隐藏的分享卡片 (完全复刻 AdminFlowerCard 样式) === */}
      {/* 移出屏幕外，固定宽度确保排版一致 */}
      <div className="fixed left-[-9999px] top-0 z-[-1]" aria-hidden="true">
        <div 
          ref={shareHiddenRef}
          className="w-[320px] bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden"
        >
          {/* 图片区 */}
          <div className="aspect-[4/3] relative bg-stone-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={flower.imageUrl} 
              className="w-full h-full object-cover"
              crossOrigin="anonymous" 
              alt={flower.name}
            />
          </div>
          {/* 信息区 (AdminCard 样式) */}
          <div className="p-4 bg-white flex items-end gap-4">
            {/* 左侧：花名 + 英文名 */}
            <div className="flex flex-col shrink-0 ml-2">
              <h3 className="font-serif font-bold text-stone-800 text-xl leading-none mb-1">
                {flower.name}
              </h3>
              <p className="font-serif italic text-sm text-stone-400 leading-none">
                {flower.englishName}
              </p>
            </div>
            {/* 分隔线 */}
            <div className="w-px h-8 bg-stone-200 shrink-0 self-center"></div>
            {/* 右侧：花语 + 习性 */}
            <div className="flex flex-col items-end gap-1 overflow-hidden min-w-0 flex-1">
              <p className="text-stone-500 text-xs font-mono opacity-80 text-right line-clamp-1 w-full">
                {flower.language}
              </p>
              <span className="px-2 py-0.5 bg-stone-100 text-stone-600 text-[10px] rounded-md whitespace-nowrap">
                {flower.habit}
              </span>
            </div>
          </div>
          {/* 底部水印 (可选优化) */}
          <div className="bg-stone-50 px-4 py-2 text-[10px] text-stone-300 text-center font-mono tracking-widest uppercase">
              Flower Daily
          </div>
        </div>
      </div>

      {/* === 可见的 3D 卡片 === */}
      <div ref={containerRef} className="card-container-perspective">
        <div 
          ref={cardRef}
          className={`card-reference ${isFlipped ? 'flipped' : ''}`}
          onClick={handleCardClick}
        >
          <div ref={cardInnerRef} className="card-inner">
            
            {/* 正面 */}
            <div className="card-front">
              <div 
                  ref={frontImgRef} 
                  className="card-bg-img" 
                  style={{ backgroundImage: `url(${flower.imageUrl})` }}
              />
              
              <div className="front-content">
                  <h2 className="text-white font-serif text-4xl font-bold tracking-wider drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
                      {flower.name}
                  </h2>
                  <div className="w-8 h-1 bg-white/90 rounded-full mt-3 shadow-sm"></div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
              <div className="card-flip-hint">
                  <RotateCw size={18} className="card-flip-icon" />
              </div>
            </div>

            {/* 背面 */}
            <div className="card-back">
              <div 
                  ref={backImgRef} 
                  className="card-bg-img"
                  style={{ backgroundImage: `url(${flower.imageUrl})` }}
              />
              
              <div className="back-content">
                 <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                    
                    {/* 名字排版：同行，底部对齐，居中 */}
                    <div className="flex items-baseline justify-center gap-3 w-full border-b border-stone-100 pb-4 mb-2">
                        <h2 className="text-3xl font-serif font-bold text-stone-900">
                            {flower.name}
                        </h2>
                        <span className="text-sm font-serif italic text-stone-400">
                            {flower.englishName}
                        </span>
                    </div>
                    
                    <div className="flex justify-center -mt-4">
                         <div className="w-12 h-1 bg-stone-300 rounded-full"></div>
                    </div>

                    <div className="relative py-2 px-4">
                        <Sparkles className="absolute -top-3 -left-3 w-5 h-5 text-stone-400" />
                        <p className="text-stone-800 font-serif italic text-2xl leading-relaxed text-center drop-shadow-sm">
                        “{flower.language}”
                        </p>
                        <Sparkles className="absolute -bottom-3 -right-3 w-5 h-5 text-stone-400" />
                    </div>
                    
                    <div className="bg-stone-100/80 text-stone-600 px-4 py-1.5 rounded-full text-sm font-medium border border-stone-200">
                       {flower.habit}
                    </div>
                 </div>

                 <div className="w-full grid grid-cols-5 gap-3 pt-6 border-t border-stone-200/50">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleNextClick(); }}
                      disabled={loading}
                      className="col-span-3 py-3 bg-stone-900 text-white rounded-xl hover:bg-stone-800 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      {loading ? <Loader2 className="animate-spin w-4 h-4"/> : <RefreshCcw size={18} />}
                      <span className="font-medium">再送自己一朵</span>
                    </button>

                    <button 
                      onClick={handleShareClick}
                      disabled={isSharing}
                      className="col-span-2 py-3 bg-white/60 text-stone-800 border border-stone-300/50 rounded-xl hover:bg-white active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      {isSharing ? <Loader2 className="animate-spin w-4 h-4"/> : <Share2 size={18} />}
                      <span className="font-medium">分享</span>
                    </button>
                 </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}