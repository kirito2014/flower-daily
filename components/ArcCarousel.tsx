/* components/ArcCarousel.tsx */
'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as SwiperType } from 'swiper';
import { EffectCreative, Autoplay, Mousewheel } from 'swiper/modules';
import { ExternalLink, Search, Sprout, Package, Github } from 'lucide-react';
import { Flower } from '@prisma/client';

import 'swiper/css';
import 'swiper/css/effect-creative';
import 'swiper/css/autoplay';

type CarouselItem = 
  | { type: 'real'; data: Flower }
  | { type: 'placeholder'; id: string };

interface SearchConfig {
  url: string;
  name: string;
}

interface ArcCarouselProps {
  flowers: Flower[];
  onNext: () => void;
  searchConfig?: SearchConfig;
}

const CONFIG = {
  SLIDE_WIDTH: '420px', 
  SLIDE_HEIGHT: '600px', 
  CARD_WIDTH: '320px',  
  CARD_HEIGHT: '440px',
  RADIUS: '2000px',     
  ROTATE_ANGLE: 15,     
  TRANSLATE_X: ['-2%', 0, 0] as const, 
};

const TOTAL_SLIDES = 10;

export default function UltimateCardCarousel({ flowers = [], onNext, searchConfig }: ArcCarouselProps) {
  const swiperRef = useRef<SwiperType | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null); 
  const [activeIndex, setActiveIndex] = useState(0); 
  
  const autoplayTimer = useRef<NodeJS.Timeout | null>(null); 

  // ✅ 使用传进来的配置，增加日志验证
  const currentSearchConfig = searchConfig || {
    url: 'https://baike.baidu.com/item/',
    name: '百度百科'
  };
  
  // 🔍 调试日志
  useEffect(() => {
    if (mounted) {
      console.log('ArcCarousel Search Config:', currentSearchConfig);
    }
  }, [mounted, currentSearchConfig]);

  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Flower Daily';
  const version = process.env.NEXT_PUBLIC_SITE_VERSION || 'v1.1.0';
  const repoUrl = process.env.NEXT_PUBLIC_GITHUB_REPO || 'https://github.com/kirito2014/flower-daily';

  const displayItems: CarouselItem[] = useMemo(() => {
    const items: CarouselItem[] = flowers.map(f => ({ type: 'real', data: f }));
    const needed = TOTAL_SLIDES - items.length;
    if (needed > 0) {
      for (let i = 0; i < needed; i++) {
        items.push({ type: 'placeholder', id: `placeholder-${i}` });
      }
    }
    return items.slice(0, 15); 
  }, [flowers]);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleCardClick = (item: CarouselItem, index: number) => {
    if (item.type === 'placeholder') {
        onNext();
        return;
    }
    const id = item.data.id;
    if (expandedId === id) {
      setExpandedId(null);
      startAutoplay();
    } else if (index === activeIndex) {
      setExpandedId(id); 
      if (swiperRef.current?.autoplay) swiperRef.current.autoplay.stop();
    }
  };

  const startAutoplay = () => {
    if (autoplayTimer.current) clearTimeout(autoplayTimer.current);
    autoplayTimer.current = setTimeout(() => {
      if (swiperRef.current?.autoplay) swiperRef.current.autoplay.start();
    }, 3000);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left; 
    const y = e.clientY - rect.top;  
    
    const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * 10;
    const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * -10;

    card.style.setProperty('--rotate-x', `${rotateX}deg`);
    card.style.setProperty('--rotate-y', `${rotateY}deg`);
    card.style.setProperty('--mouse-x', `${(x / rect.width) * 100}%`);
    card.style.setProperty('--mouse-y', `${(y / rect.height) * 100}%`);
  };

  if (!mounted) return null;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center overflow-hidden relative">
      <style jsx global>{`
        .card-container {
          transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), filter 0.6s;
          transform-style: preserve-3d;
        }
        .card-container.expanded {
          transform: scale(1.1) translateZ(100px);
          z-index: 100;
        }
        .tilt-layer {
          width: 100%;
          height: 100%;
          transform: perspective(1000px) rotateX(var(--rotate-x, 0deg)) rotateY(var(--rotate-y, 0deg));
          transition: transform 0.1s linear;
          transform-style: preserve-3d;
          border-radius: 24px;
          overflow: hidden;
          background: #1c1917;
          position: relative;
          box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .tilt-layer::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 20;
          background: linear-gradient(
            135deg,
            transparent 0%,
            rgba(255, 255, 255, 0.05) 45%,
            rgba(255, 255, 255, 0.2) 50%,
            rgba(255, 255, 255, 0.05) 55%,
            transparent 100%
          );
          background-size: 200% 200%;
          background-position: var(--mouse-x, 50%) var(--mouse-y, 50%);
          mix-blend-mode: overlay;
          pointer-events: none;
        }
      `}</style>

      <div 
        className="w-full max-w-7xl relative transition-transform duration-[1500ms]"
        style={{
          transform: isLoaded ? 'rotate(0deg)' : 'rotate(60deg)',
          transformOrigin: `50% ${CONFIG.RADIUS}`
        }}
      >
        <Swiper
          onSwiper={(swiper) => (swiperRef.current = swiper)}
          onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
          modules={[EffectCreative, Autoplay, Mousewheel]}
          effect={'creative'}
          centeredSlides={true}
          slidesPerView={'auto'}
          loop={true} 
          speed={800}
          mousewheel={{ forceToAxis: true, enabled: expandedId === null }}
          autoplay={{ delay: 3500, disableOnInteraction: false }}
          creativeEffect={{
            limitProgress: 4,
            prev: { translate: [CONFIG.TRANSLATE_X[0], 0, 0], rotate: [0, 0, -CONFIG.ROTATE_ANGLE] },
            next: { translate: [CONFIG.TRANSLATE_X[0].replace('-', ''), 0, 0], rotate: [0, 0, CONFIG.ROTATE_ANGLE] },
          }}
          className="w-full !overflow-visible py-20"
        >
          {displayItems.map((item, index) => {
            const isReal = item.type === 'real';
            const id = isReal ? item.data.id : item.id;
            const isExpanded = expandedId === id;
            
            let distance = Math.abs(activeIndex - index);
            if (distance > displayItems.length / 2) distance = displayItems.length - distance;
            
            const isVisible = distance <= 2; 

            return (
              <SwiperSlide 
                key={id} 
                style={{ 
                  width: CONFIG.SLIDE_WIDTH, height: CONFIG.SLIDE_HEIGHT,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transformOrigin: `50% ${CONFIG.RADIUS}`,
                  zIndex: isExpanded ? 999 : (100 - distance),
                }}
              >
                <div 
                  className={`card-container ${isExpanded ? 'expanded' : ''}`}
                  style={{ 
                    width: CONFIG.CARD_WIDTH, height: CONFIG.CARD_HEIGHT,
                    cursor: (distance === 0 && !expandedId) ? 'pointer' : 'default' 
                  }}
                  onClick={() => handleCardClick(item, index)}
                >
                  <div 
                    className="tilt-layer"
                    onMouseMove={handleMouseMove}
                  >
                    {isReal ? (
                      <>
                        <img 
                          src={item.data.imageUrl} 
                          alt={item.data.name}
                          loading="eager"
                          decoding="async"
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 select-none"
                          style={{ 
                              transform: isExpanded ? 'scale(1.1)' : 'scale(1.0)',
                              opacity: isVisible ? 1 : 0.8 
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                        <div className="relative z-10 w-full h-full p-6 flex flex-col justify-between text-white select-none">
                          <div className={`transition-all duration-700 flex flex-col items-center ${isExpanded ? 'translate-y-6 opacity-100' : 'translate-y-[-20px] opacity-0'}`}>
                              <h2 className="text-3xl font-serif font-bold tracking-widest text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">{item.data.name}</h2>
                              <p className="text-xs  tracking-[0.3em] text-white/90 mt-2 font-light drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{item.data.englishName}</p>
                          </div>

                          <div className={`transition-all duration-500 ${isExpanded ? 'opacity-0 translate-x-[-20px]' : (isVisible ? 'opacity-100' : 'opacity-0')}`}>
                              <h3 className="text-2xl font-serif font-bold tracking-wide drop-shadow-md">{item.data.name}</h3>
                              <div className="text-[10px] opacity-60 flex items-center gap-1 mt-2">
                                <span>©</span>
                                <span className="underline decoration-white/20 underline-offset-4">{item.data.photographer || 'Unsplash'}</span>
                              </div>
                          </div>

                          <div className={`space-y-4 transition-all duration-700 ease-out transform-gpu absolute bottom-6 left-6 right-6 ${isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
                              <div className="bg-white/20 backdrop-blur-md p-5 rounded-xl border border-white/10 text-sm leading-relaxed shadow-lg">
                                  <p className="flex gap-2"><span className="text-white/40 min-w-[3em]">花语</span> <span className="text-white/90">{item.data.language}</span></p>
                                  <div className="h-px bg-white/10 my-3" />
                                  <p className="flex gap-2"><span className="text-white/40 min-w-[3em]">习性</span> <span className="text-white/90 line-clamp-3">{item.data.habit}</span></p>
                              </div>

                              <div className="flex justify-between items-center px-1">
                                <div className="text-[10px]  tracking-wider opacity-60 font-medium flex items-center gap-1">
                                    <span>Photo by</span>
                                    <a 
                                      href={item.data.pgsourceUrl || '#'} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="hover:text-white underline decoration-white/30 underline-offset-2 transition-colors"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {item.data.photographer || 'Anonymous'}
                                    </a>
                                    <span>on</span>
                                    <a 
                                      href={item.data.sourceUrl || 'https://unsplash.com'} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="hover:text-white underline decoration-white/30 underline-offset-2 transition-colors"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      Unsplash
                                    </a>
                                </div>
                              </div>

                              {/* ✅ 修复：正确渲染动态配置的名称 */}
                              <a 
                                href={`${currentSearchConfig.url}${encodeURIComponent(item.data.name)}`}
                                target="_blank" rel="noopener noreferrer"
                                className="group w-full py-3 bg-white text-black rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-stone-200 transition-all active:scale-95 shadow-xl"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Search size={14} className="group-hover:scale-110 transition-transform"/>
                                {/* ✅ 显示动态名称 */}
                                <span>{currentSearchConfig.name}</span>
                              </a>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-stone-600 relative overflow-hidden group">
                        <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-50 contrast-150"></div>
                        <div className="relative z-10 flex flex-col items-center gap-4 transition-transform duration-500 group-hover:scale-105">
                          <div className="p-4 rounded-full bg-stone-800/50 border border-stone-700/50 shadow-inner">
                             <Sprout size={32} className="text-stone-500 animate-pulse" />
                          </div>
                          <div className="text-center space-y-1">
                            <p className="font-serif text-lg text-stone-400">待发掘</p>
                            <p className="text-[10px]  tracking-widest text-stone-600">Unknown Flower</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>

      <footer className="absolute bottom-6 w-full flex justify-center items-center text-xs text-stone-400 z-50 pointer-events-none">
          <div className="flex items-center gap-4 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-stone-200/50 shadow-sm pointer-events-auto opacity-60 hover:opacity-100 transition-opacity">
              <Link 
                href="/login" 
                className="font-serif font-medium text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
              >
                {siteName}
              </Link>
              
              <span className="w-px h-3 bg-stone-300"></span>
              <span className="flex items-center gap-1 font-mono">
                  <Package size={10} />
                  {version}
              </span>
              <span className="w-px h-3 bg-stone-300"></span>
              <a 
                  href={repoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-stone-800 transition-colors"
              >
                  <Github size={10} />
                  <span>GitHub</span>
                  <ExternalLink size={8} className="opacity-50" />
              </a>
          </div>
        </footer>
    </div>
  );
}