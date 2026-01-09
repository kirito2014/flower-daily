/* app/page.tsx */
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Flower } from '@prisma/client';
import FlowerCard3D from '@/components/FlowerCard3D';
import UltimateCardCarousel from '@/components/ArcCarousel';
import ScatteredPolaroids from '@/components/ScatteredPolaroids'; // ✅ 引入拍立得组件
import AmbientBackground from '@/components/AmbientBackground';
import FlowerOracle from '@/components/FlowerOracle';
import LetterModal from '@/components/LetterModal';
import { useOracleStore } from '@/lib/store/oracleStore';
import { Loader2, Sparkles, Github, ExternalLink, Package, IdCard, GalleryHorizontal, Grid2X2, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSystemConfigsByKeys } from '@/app/actions/systemConfig';

export default function HomePage() {
  const [viewState, setViewState] = useState<'intro' | 'card'>('intro');
  // ✅ 状态扩展：支持 polaroid 模式
  const [viewMode, setViewMode] = useState<'single' | 'carousel' | 'polaroid'>('single');
  
  const [currentFlower, setCurrentFlower] = useState<Flower | null>(null);
  const [flowerList, setFlowerList] = useState<Flower[]>([]);
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [finishedData, setFinishedData] = useState<string | null>(null);
  
  const [activeCarouselFlower, setActiveCarouselFlower] = useState<Flower | null>(null);

  const [searchConfig, setSearchConfig] = useState({
    url: 'https://baike.baidu.com/item/',
    name: '百度百科'
  });
  
  const { addLetter } = useOracleStore();
  const router = useRouter();
  const clickCountRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initSystemConfig = async () => {
      const configs = await getSystemConfigsByKeys([
        'main_display_mode', 
        'search_engine_url', 
        'search_engine_name'
      ]);

      if (configs['main_display_mode'] === '1') {
        setViewMode('carousel');
      } else {
        setViewMode('single');
      }

      const newSearchConfig = {
        url: configs['search_engine_url'] || 'https://baike.baidu.com/item/',
        name: configs['search_engine_name'] || '百度百科'
      };
      
      setSearchConfig(newSearchConfig);
    };
    initSystemConfig();
  }, []);

  const handleEggClick = () => {
    clickCountRef.current += 1;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { clickCountRef.current = 0; }, 2000);
    if (clickCountRef.current >= 5) {
        clickCountRef.current = 0;
        router.push('/login');
    }
  };

  const fetchSingleFlower = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/flower/random', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seenIds, count: 1 }),
      });
      const data = await res.json();

      if (data.finished) {
         handleFinished(data.message);
      } else {
        const img = new Image();
        img.onload = () => {
            setCurrentFlower(data.data);
            setSeenIds(prev => [...prev, data.data.id]);
            setLoading(false);
            if (viewState === 'intro') setViewState('card');
        };
        img.onerror = () => {
            setLoading(false);
            alert("图片加载失败");
        };
        img.src = data.data.imageUrl;
      }
    } catch (error) {
      setLoading(false);
      console.error(error);
    }
  };

  const fetchBatchFlowers = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const currentListIds = flowerList.map(f => f.id);
      const allSeenIds = [...new Set([...seenIds, ...currentListIds])];

      const res = await fetch('/api/flower/random', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seenIds: allSeenIds, count: 10 }),
      });
      const data = await res.json();

      if (data.finished) {
         if (flowerList.length === 0) handleFinished(data.message);
         setLoading(false);
      } else {
         if (data.list && Array.isArray(data.list)) {
             setFlowerList(prev => {
                const newFlowers = data.list.filter((f: Flower) => !prev.some(p => p.id === f.id));
                return [...prev, ...newFlowers];
             });
             setSeenIds(prev => [...prev, ...data.list.map((f: Flower) => f.id)]);
             
             if (!currentFlower && data.list.length > 0) {
               setCurrentFlower(data.list[0]);
             }
         }
         setLoading(false);
         if (viewState === 'intro') setViewState('card');
      }
    } catch (error) {
      setLoading(false);
      console.error(error);
    }
  };

  const handleFinished = async (msg: string) => {
    try {
        const hitoRes = await fetch('https://v1.hitokoto.cn/?c=d&encode=text');
        if (hitoRes.ok) {
          const text = await hitoRes.text();
          setFinishedData(text);
        } else {
          setFinishedData(msg);
        }
     } catch (e) {
        setFinishedData(msg);
     }
     setLoading(false);
  };

  const handleStart = () => {
    if (viewMode === 'carousel' || viewMode === 'polaroid') {
      fetchBatchFlowers();
    } else {
      fetchSingleFlower();
    }
  };

  // 切换：单卡片 <-> 画廊 (默认 Carousel)
  const toggleViewMode = () => {
    if (viewMode === 'single') {
        setViewMode('carousel');
        if (flowerList.length < 10) fetchBatchFlowers();
    } else {
        setViewMode('single');
        if (!currentFlower) {
            if (flowerList.length > 0) setCurrentFlower(flowerList[0]);
            else fetchSingleFlower();
        }
    }
  };

  // 切换：Carousel <-> Polaroid (仅在画廊模式下有效)
  const toggleGalleryStyle = () => {
      setViewMode(prev => prev === 'carousel' ? 'polaroid' : 'carousel');
  };

  const handleOracleAsk = async (question: string) => {
    if (!currentFlower) return;
    try {
      const res = await fetch('/api/ai/oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question, 
          flowerId: currentFlower.id 
        }),
      });

      const data = await res.json();

      if (res.ok) {
        addLetter(currentFlower.name, data.answer);
        
        const toast = document.createElement('div');
        toast.innerText = '收到一封新回信';
        toast.style.cssText = 'position: fixed; top: 10%; left: 50%; transform: translateX(-50%); background: rgba(255,255,255,0.9); color: #333; padding: 8px 16px; border-radius: 20px; font-size: 12px; z-index: 200; box-shadow: 0 4px 12px rgba(0,0,0,0.1); backdrop-filter: blur(4px); pointer-events: none;';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);

      } else {
        alert(`占卜失败：${data.error}`);
      }
    } catch (error) {
      alert('网络连接似乎断开了...');
    }
  };

  if (finishedData) {
    return (
      <div className="h-screen w-full bg-stone-900 flex flex-col items-center justify-center p-8 text-center text-white">
        <Sparkles className="text-yellow-400 w-12 h-12 mb-6 animate-pulse" />
        <h1 className="text-2xl font-serif mb-8 max-w-2xl leading-relaxed italic">“{finishedData}”</h1>
        <button 
          onClick={() => { setSeenIds([]); setFlowerList([]); setFinishedData(null); setViewState('intro'); setViewMode('single'); }}
          className="text-stone-400 text-sm underline hover:text-white transition"
        >
          重新开始
        </button>
      </div>
    );
  }

  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Flower Daily';
  const version = process.env.NEXT_PUBLIC_SITE_VERSION || 'v1.1.0';
  const repoUrl = process.env.NEXT_PUBLIC_GITHUB_REPO || 'https://github.com/kirito2014/flower-daily';

  // 只有在 Card 状态，且是 Carousel 模式下才显示动态流光背景
  // Polaroid 模式自带背景，Single 模式背景极淡
  const showAmbientBackground = viewState === 'card' && viewMode === 'carousel';

  return (
    <div className={`h-screen w-full flex items-center justify-center overflow-hidden relative transition-colors duration-1000 ${showAmbientBackground ? 'bg-black' : 'bg-[#f5f5f5]'}`}>
      
      <LetterModal />

      <AmbientBackground 
        isActive={showAmbientBackground}
        imageUrl={activeCarouselFlower?.imageUrl || null}
      />

      {/* FLOWER 背景大字 (在拍立得模式下隐藏，以免干扰) */}
      <div 
        className={`absolute inset-0 flex items-center justify-center pointer-events-none select-none transition-all duration-1000 z-0
          ${showAmbientBackground ? 'opacity-30' : (viewMode === 'polaroid' ? 'opacity-0' : 'opacity-[0.03]')}
        `}
      >
         <span 
           className={`text-[25vw] font-serif font-bold transition-all duration-1000
             ${showAmbientBackground 
                ? 'text-transparent' 
                : 'text-black'       
             }
           `}
           style={{
             WebkitTextStroke: showAmbientBackground ? '2px rgba(255,255,255,0.6)' : 'none' 
           }}
         >
           FLOWER
         </span>
      </div>

      {/* 右上角控制区 */}
      {viewState === 'card' && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
            
            {/* 1. 画廊样式切换按钮 (仅在非单卡模式下显示) */}
            <AnimatePresence>
                {viewMode !== 'single' && (
                    <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        onClick={toggleGalleryStyle}
                        className="p-3 backdrop-blur-md border rounded-full shadow-lg transition-colors duration-500 group outline-none bg-black/20 border-white/10 text-white hover:bg-black/40"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title={viewMode === 'carousel' ? '切换到拍立得桌台' : '切换到轮播视界'}
                    >
                        {viewMode === 'carousel' ? <Grid2X2 className="w-5 h-5" /> : <GalleryHorizontal className="w-5 h-5" />}
                    </motion.button>
                )}
            </AnimatePresence>

            {/* 2. 主模式切换按钮 (单卡 <-> 画廊) */}
            <motion.button
            onClick={toggleViewMode}
            className={`p-3 backdrop-blur-md border rounded-full shadow-lg transition-colors duration-500 group outline-none
                ${viewMode !== 'single' 
                ? 'bg-black/20 border-white/10 text-white hover:bg-black/40' 
                : 'bg-white/80 border-stone-200 text-stone-600 hover:bg-white hover:text-stone-900' 
                }
            `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            >
            <AnimatePresence mode="wait" initial={false}>
                {viewMode === 'single' ? (
                <motion.div
                    key="to-gallery"
                    initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                    transition={{ duration: 0.3, ease: "backOut" }}
                >
                    <GalleryHorizontal className="w-5 h-5" />
                </motion.div>
                ) : (
                <motion.div
                    key="to-card"
                    initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
                    transition={{ duration: 0.3, ease: "backOut" }}
                >
                    <IdCard className="w-5 h-5" />
                </motion.div>
                )}
            </AnimatePresence>

            <span className={`absolute right-full mr-3 top-1/2 -translate-y-1/2 text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-medium tracking-wide shadow-sm
                ${viewMode !== 'single'
                ? 'bg-white/10 text-white backdrop-blur-md border border-white/10' 
                : 'bg-stone-800 text-white'
                }
            `}>
                {viewMode === 'single' ? '进入画廊' : '切换卡片'}
            </span>
            </motion.button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {viewState === 'intro' && (
          <motion.div 
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
            className="text-center z-10"
          >
            <h1 onClick={handleEggClick} className="text-5xl font-serif font-bold text-stone-800 mb-4 tracking-tight cursor-default select-none active:scale-95 transition-transform">
                {siteName}
            </h1>
            <p className="text-stone-500 mb-12 font-serif italic">送自己一份生活的仪式感</p>
            <button 
              onClick={handleStart}
              disabled={loading}
              className="px-8 py-3 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-all hover:scale-105 active:scale-95 disabled:opacity-70 flex items-center gap-2 mx-auto shadow-xl"
            >
              {loading ? <Loader2 className="animate-spin w-4 h-4"/> : <Sparkles className="w-4 h-4" />}
              <span>开始旅程 ❀</span>
            </button>
          </motion.div>
        )}

        {viewState === 'card' && (
          <motion.div 
            key={viewMode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="z-10 w-full h-full flex items-center justify-center relative"
          >
            {viewMode === 'single' && currentFlower ? (
              // === 模式 1: 单卡片模式 ===
              <>
                <FlowerCard3D flower={currentFlower} onNext={fetchSingleFlower} loading={loading} />
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                  className="absolute bottom-24 w-full px-4 z-50 pointer-events-auto"
                >
                  <FlowerOracle onAsk={handleOracleAsk} loading={false} />
                </motion.div>
              </>
            ) : viewMode === 'polaroid' ? (
              // === 模式 2: 拍立得模式 (新增) ===
              <ScatteredPolaroids flowers={flowerList} />
            ) : (
              // === 模式 3: 3D 轮播模式 ===
              <UltimateCardCarousel 
                flowers={flowerList} 
                onNext={fetchBatchFlowers} 
                searchConfig={searchConfig}
                onActiveChange={setActiveCarouselFlower}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer (仅在单卡模式显示) */}
      {viewState === 'card' && viewMode === 'single' && (
        <footer className="absolute bottom-6 w-full flex justify-center items-center text-xs text-stone-400 z-50 pointer-events-none">
          <div className="flex items-center gap-4 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-stone-200/50 shadow-sm pointer-events-auto opacity-60 hover:opacity-100 transition-opacity">
              <Link 
                href="/login" 
                className="font-serif font-medium text-stone-500 hover:text-stone-800 transition-colors"
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
      )}
    </div>
  );
}