'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Flower } from '@prisma/client';
import { RefreshCcw, Loader2, Share2, Sparkles, RotateCw } from 'lucide-react';

interface FlowerCardProps {
  flower: Flower;
  onNext: () => void;
  loading: boolean;
}

export default function FlowerCard3D({ flower, onNext, loading }: FlowerCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Refs 用于直接操作 DOM，绕过 React 渲染周期，实现高性能动画
  const cardRef = useRef<HTMLDivElement>(null);
  const cardInnerRef = useRef<HTMLDivElement>(null);
  const frontImgRef = useRef<HTMLDivElement>(null);
  const backImgRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  // === 1. 移植 script.js 的核心状态机与物理逻辑 ===
  useEffect(() => {
    const card = cardRef.current;
    const cardInner = cardInnerRef.current;
    const frontImg = frontImgRef.current;
    const backImg = backImgRef.current;

    if (!card || !cardInner || !frontImg || !backImg) return;

    // 状态定义 (来自 script.js)
    const AnimationState = {
        RANDOM_FLOAT: 'random_float',
        HOVER: 'hover',
        TRANSITION: 'transition',
        FLIP: 'flip'
    };

    let currentState = AnimationState.RANDOM_FLOAT;
    // 当前物理位置
    let currentPosition = { x: 0, y: 0, rotate: 0, rotateX: 0, rotateY: 0 };
    
    // 生成随机位置 (Idle 动画)
    function generateRandomPosition() {
        return {
            x: (Math.random() - 0.5) * 10,
            y: (Math.random() - 0.5) * 10,
            rotate: (Math.random() - 0.5) * 2, // 减小旋转幅度，更优雅
            rotateX: (Math.random() - 0.5) * 4,
            rotateY: (Math.random() - 0.5) * 4
        };
    }

    // 核心：平滑过渡函数 (script.js 的 smoothTransition)
    function smoothTransition(targetPos: any, duration = 2000) {
        const startPos = { ...currentPosition };
        const startTime = performance.now();
        const baseRotation = isFlipped ? 180 : 0; // 考虑翻转状态

        function update(currentTime: number) {
            if (currentState !== AnimationState.RANDOM_FLOAT) return; // 如果被中断(如 Hover)，停止动画

            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 缓动函数
            const easeProgress = progress < .5 ? 
                4 * progress * progress * progress : 
                1 - Math.pow(-2 * progress + 2, 3) / 2;

            // 插值计算
            const x = startPos.x + (targetPos.x - startPos.x) * easeProgress;
            const y = startPos.y + (targetPos.y - startPos.y) * easeProgress;
            const rotate = startPos.rotate + (targetPos.rotate - startPos.rotate) * easeProgress;
            const rotateX = startPos.rotateX + (targetPos.rotateX - startPos.rotateX) * easeProgress;
            const rotateY = startPos.rotateY + (targetPos.rotateY - startPos.rotateY) * easeProgress;

            // 更新当前位置引用
            currentPosition = { x, y, rotate, rotateX, rotateY };

            // 应用到 DOM
            if (cardInner) {
                cardInner.style.transform = `
                    translate3d(${x}px, ${y}px, 0)
                    rotateY(${baseRotation + rotateY}deg)
                    rotateX(${rotateX}deg)
                    rotateZ(${rotate}deg)
                `;
            }

            // 同步更新图片视差 (script.js 逻辑)
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
                // 动画结束，启动下一次随机浮动
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

    // --- 事件监听 ---

    // 1. Mouse Enter
    const handleMouseEnter = () => {
        if (currentState === AnimationState.FLIP) return;
        currentState = AnimationState.HOVER;
        cancelAnimationFrame(rafRef.current);
        
        // 切换为 CSS transition 模式，响应更快
        cardInner.style.transition = 'transform 0.2s ease-out';
        if (frontImg) frontImg.style.transition = 'transform 0.2s ease-out';
        if (backImg) backImg.style.transition = 'transform 0.2s ease-out';
    };

    // 2. Mouse Move (高灵敏度跟随)
    const handleMouseMove = (e: MouseEvent) => {
        if (currentState !== AnimationState.HOVER) return;

        const rect = card.getBoundingClientRect();
        // 计算鼠标相对位置
        const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
        const y = (e.clientY - rect.top - rect.height / 2) / rect.height;

        const baseRotation = isFlipped ? 180 : 0;

        // 应用卡片旋转 (原代码参数：x * 30, y * 30，我们稍微调小一点保持稳重，但保留逻辑)
        cardInner.style.transform = `
            rotateY(${baseRotation + x * 20}deg)
            rotateX(${-y * 20}deg)
        `;

        // 图片视差 (反向移动)
        const imgTransform = `
            translate3d(${x * -30}px, ${y * -30}px, 0)
            scale(1.1)
        `;
        if (frontImg) frontImg.style.transform = imgTransform;
        if (backImg) backImg.style.transform = imgTransform;
    };

    // 3. Mouse Leave
    const handleMouseLeave = () => {
        if (currentState === AnimationState.FLIP) return;
        currentState = AnimationState.TRANSITION;

        // 复位样式
        const resetImgTransform = 'translate3d(0, 0, 0) scale(1.0)';
        
        // 设置较慢的 transition 实现平滑复位
        cardInner.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
        if (frontImg) {
            frontImg.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
            frontImg.style.transform = resetImgTransform;
        }
        if (backImg) {
            backImg.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)';
            backImg.style.transform = resetImgTransform;
        }

        // 复位卡片角度
        const baseRotation = isFlipped ? 180 : 0;
        cardInner.style.transform = `rotateY(${baseRotation}deg)`;

        // 延迟后重新开始浮动
        setTimeout(() => {
            if (currentState === AnimationState.TRANSITION) {
                currentState = AnimationState.RANDOM_FLOAT;
                // 重置 transition 为 none 以便 JS 接管动画
                cardInner.style.transition = 'none'; 
                if (frontImg) frontImg.style.transition = 'none';
                if (backImg) backImg.style.transition = 'none';
                startRandomFloat();
            }
        }, 600);
    };

    // 绑定事件
    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    // 启动初始动画
    startRandomFloat();

    return () => {
        cancelAnimationFrame(rafRef.current);
        card.removeEventListener('mouseenter', handleMouseEnter);
        card.removeEventListener('mousemove', handleMouseMove);
        card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isFlipped]); // isFlipped 变化时重新绑定，更新 baseRotation


  // === 2. 翻转与交互逻辑 ===

  // 花瓣特效 (保留)
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
    
    // 触发翻转
    if (!isFlipped) triggerPetalExplosion();
    setIsFlipped(!isFlipped);
  };

  const handleNextClick = () => {
    setIsFlipped(false);
    setTimeout(() => { onNext(); }, 600);
  };

  const handleShareClick = () => {
      alert("点击了分享");
  };

  return (
  <div ref={containerRef} className="card-container-perspective">
    <div 
      ref={cardRef}
      className={`card-reference ${isFlipped ? 'flipped' : ''}`}
      onClick={handleCardClick}
    >
      <div ref={cardInnerRef} className="card-inner">
        
        {/* === 正面 === */}
        <div className="card-front">
          {/* 这里会自动生成 ::after 内边框 */}
          
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
          
          {/* 磨砂切角 */}
          <div className="card-flip-hint">
              <RotateCw size={18} className="card-flip-icon" />
          </div>
        </div>

        {/* === 背面 === */}
        <div className="card-back">
          {/* 这里也会自动生成 ::after 内边框 */}
          
          <div 
              ref={backImgRef} 
              className="card-bg-img"
              style={{ backgroundImage: `url(${flower.imageUrl})` }}
          />
          
          <div className="back-content">
             {/* ... 内容保持不变 ... */}
             <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                <div className="text-center">
                    <h2 className="text-3xl font-serif font-bold text-stone-900 mb-2">{flower.name}</h2>
                    <div className="flex justify-center">
                        <div className="w-12 h-1 bg-stone-300 rounded-full"></div>
                    </div>
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
                  onClick={handleNextClick}
                  disabled={loading}
                  className="col-span-3 py-3 bg-stone-900 text-white rounded-xl hover:bg-stone-800 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  {loading ? <Loader2 className="animate-spin w-4 h-4"/> : <RefreshCcw size={18} />}
                  <span className="font-medium">再送自己一朵</span>
                </button>

                <button 
                  onClick={handleShareClick}
                  className="col-span-2 py-3 bg-white/60 text-stone-800 border border-stone-300/50 rounded-xl hover:bg-white active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Share2 size={18} />
                  <span className="font-medium">分享</span>
                </button>
             </div>
          </div>
        </div>

      </div>
    </div>
  </div>
);
}