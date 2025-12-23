'use client';

import { useState } from 'react';
import { Flower } from '@prisma/client';
import FlowerCard3D from '@/components/FlowerCard3D';
import { Loader2, Sparkles, Github, ExternalLink, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HomePage() {
  const [viewState, setViewState] = useState<'intro' | 'card'>('intro');
  const [currentFlower, setCurrentFlower] = useState<Flower | null>(null);
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [finishedData, setFinishedData] = useState<string | null>(null);

  // 获取花朵数据
  const fetchFlower = async () => {
    if (loading) return; // 防止重复点击
    setLoading(true);
    
    try {
      // 这里的 seenIds 是当前组件状态，点击“重新开始”后它会被重置为 []，
      // 所以传给后端的也是 []，后端会重新开始随机。
      const res = await fetch('/api/flower/random', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seenIds }),
      });
      const data = await res.json();

      if (data.finished) {
        setFinishedData(data.message);
        setLoading(false); // 修复：即使是完结状态，也要停止 loading
      } else {
        // 预加载图片
        const img = new Image();
        
        // 定义加载成功处理
        img.onload = () => {
            setCurrentFlower(data.data);
            setSeenIds(prev => [...prev, data.data.id]);
            setLoading(false);
            if (viewState === 'intro') setViewState('card');
        };

        // 修复：定义加载失败处理 (防止卡死)
        img.onerror = () => {
            console.error("图片加载失败:", data.data.imageUrl);
            setLoading(false);
            alert("图片加载失败，请检查网络或图片链接");
        };

        // 开始加载
        img.src = data.data.imageUrl;
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
      alert("网络请求失败，请重试");
    }
  };

  const handleStart = () => {
    fetchFlower();
  };

  // 处理完结界面
  if (finishedData) {
    return (
      <div className="h-screen w-full bg-stone-900 flex flex-col items-center justify-center p-8 text-center text-white">
        <Sparkles className="text-yellow-400 w-12 h-12 mb-6 animate-pulse" />
        <h1 className="text-2xl font-serif mb-8">{finishedData}</h1>
        <button 
          onClick={() => { 
            // 核心修复：点击重新开始时，重置所有状态
            setSeenIds([]); 
            setFinishedData(null); 
            setViewState('intro'); 
            // 可以在这里可选地立即调用一次 fetchFlower()，或者让用户再次点击“开始旅程”
          }}
          className="text-stone-400 text-sm underline hover:text-white transition"
        >
          重新开始
        </button>
      </div>
    );
  }

  // 从环境变量读取配置
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Flower Daily';
  const version = process.env.NEXT_PUBLIC_SITE_VERSION || 'v1.0.0';
  const repoUrl = process.env.NEXT_PUBLIC_GITHUB_REPO || 'https://github.com';

  return (
    <div className="h-screen w-full bg-[#f5f5f5] flex items-center justify-center overflow-hidden relative">
      
      {/* 装饰背景文字 */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
         <span className="text-[25vw] font-serif font-bold text-black">FLOWER</span>
      </div>

      <AnimatePresence mode="wait">
        {/* === 状态 1: 首页 Intro === */}
        {viewState === 'intro' && (
          <motion.div 
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
            transition={{ duration: 0.8 }}
            className="text-center z-10"
          >
            <h1 className="text-5xl font-serif font-bold text-stone-800 mb-4 tracking-tight">{siteName}</h1>
            <p className="text-stone-500 mb-12 font-serif italic">送自己一份生活的仪式感</p>
            
            <button 
              onClick={handleStart}
              disabled={loading}
              className="px-8 py-3 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-all hover:scale-105 active:scale-95 disabled:opacity-70 flex items-center gap-2 mx-auto shadow-xl"
            >
              {loading ? <Loader2 className="animate-spin w-4 h-4"/> : <Sparkles className="w-4 h-4" />}
              <span>开始旅程</span>
            </button>
          </motion.div>
        )}

        {/* === 状态 2: 3D 卡片展示 === */}
        {viewState === 'card' && currentFlower && (
          <motion.div 
            key="card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="z-10"
          >
            <FlowerCard3D 
              flower={currentFlower} 
              onNext={fetchFlower}
              loading={loading}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* === 底部网站信息 (Footer) === */}
      <footer className="absolute bottom-6 w-full flex justify-center items-center text-xs text-stone-400 z-0 pointer-events-none">
        <div className="flex items-center gap-4 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-stone-200/50 shadow-sm pointer-events-auto transition-opacity hover:opacity-100 opacity-60">
            <span className="font-serif font-medium text-stone-500">{siteName}</span>
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