/* app/page.tsx */
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Flower } from '@prisma/client';
import FlowerCard3D from '@/components/FlowerCard3D';
import UltimateCardCarousel from '@/components/ArcCarousel';
import { Loader2, Sparkles, Github, ExternalLink, Package, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSystemConfigsByKeys } from '@/app/actions/systemConfig';

export default function HomePage() {
  const [viewState, setViewState] = useState<'intro' | 'card'>('intro');
  const [viewMode, setViewMode] = useState<'single' | 'carousel'>('single');
  const [currentFlower, setCurrentFlower] = useState<Flower | null>(null);
  const [flowerList, setFlowerList] = useState<Flower[]>([]);
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [finishedData, setFinishedData] = useState<string | null>(null);
  
  // 存储搜索配置
  const [searchConfig, setSearchConfig] = useState({
    url: 'https://baike.baidu.com/item/',
    name: '百度百科'
  });
  
  const router = useRouter();
  const clickCountRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化加载配置
  useEffect(() => {
    const initSystemConfig = async () => {
      const configs = await getSystemConfigsByKeys([
        'main_display_mode', 
        'search_engine_url', 
        'search_engine_name'
      ]);

      // 🔍 调试日志：查看数据库返回了什么
      console.log('=== HomePage System Configs ===', configs);
      console.log('Key "search_engine_url":', configs['search_engine_url']);
      console.log('Key "search_engine_name":', configs['search_engine_name']);

      // 1. 设置默认显示模式 (1=画廊, 2=卡片)
      if (configs['main_display_mode'] === '1') {
        setViewMode('carousel');
      } else {
        setViewMode('single');
      }

      // 2. 设置搜索引擎配置
      const newSearchConfig = {
        url: configs['search_engine_url'] || 'https://baike.baidu.com/item/',
        name: configs['search_engine_name'] || '百度百科'
      };
      
      console.log('=== Applied Search Config ===', newSearchConfig);
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
             
             // 如果当前没有单卡数据，初始化第一张，确保可切回单卡
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
    if (viewMode === 'carousel') {
      fetchBatchFlowers();
    } else {
      fetchSingleFlower();
    }
  };

  const toggleViewMode = () => {
    const newMode = viewMode === 'single' ? 'carousel' : 'single';
    setViewMode(newMode);
    
    if (newMode === 'carousel' && flowerList.length < 10) {
        fetchBatchFlowers();
    }
    
    // 切回单卡模式时的保护逻辑
    if (newMode === 'single' && !currentFlower) {
      if (flowerList.length > 0) {
        setCurrentFlower(flowerList[0]);
      } else {
        fetchSingleFlower();
      }
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

  return (
    <div className="h-screen w-full bg-[#f5f5f5] flex items-center justify-center overflow-hidden relative">
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
         <span className="text-[25vw] font-serif font-bold text-black">FLOWER</span>
      </div>

      {viewState === 'card' && (
        <button
          onClick={toggleViewMode}
          className="absolute top-4 right-4 z-50 p-2 bg-white/80 backdrop-blur-md border border-stone-200 rounded-full shadow-md hover:scale-105 transition-all text-stone-500 hover:text-stone-900 group"
        >
          <Layers className={`w-5 h-5 ${viewMode === 'carousel' ? 'text-blue-500' : ''}`} />
          <span className="absolute right-12 top-1/2 -translate-y-1/2 bg-stone-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            {viewMode === 'single' ? 'Switch to Gallery' : 'Switch to Card'}
          </span>
        </button>
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
            className="z-10 w-full h-full flex items-center justify-center"
          >
            {viewMode === 'single' && currentFlower ? (
              <FlowerCard3D flower={currentFlower} onNext={fetchSingleFlower} loading={loading} />
            ) : (
              <UltimateCardCarousel 
                flowers={flowerList} 
                onNext={fetchBatchFlowers} 
                searchConfig={searchConfig}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

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