// app/page.tsx
'use client';

import { useState } from 'react';
import { Flower } from '@prisma/client';
import FlowerCard3D from '@/components/FlowerCard3D'; // 引入新组件
import { Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HomePage() {
  const [viewState, setViewState] = useState<'intro' | 'card'>('intro');
  const [currentFlower, setCurrentFlower] = useState<Flower | null>(null);
  const [seenIds, setSeenIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [finishedData, setFinishedData] = useState<string | null>(null);

  // 获取花朵数据
  const fetchFlower = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/flower/random', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seenIds }),
      });
      const data = await res.json();

      if (data.finished) {
        setFinishedData(data.message);
      } else {
        // 为了让图片加载不闪烁，可以预加载图片
        const img = new Image();
        img.src = data.data.imageUrl;
        img.onload = () => {
            setCurrentFlower(data.data);
            setSeenIds(prev => [...prev, data.data.id]);
            setLoading(false);
            if (viewState === 'intro') setViewState('card');
        };
      }
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  // 处理“开始”点击
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
          onClick={() => { setSeenIds([]); setFinishedData(null); setViewState('intro'); }}
          className="text-stone-400 text-sm underline hover:text-white transition"
        >
          重新开始
        </button>
      </div>
    );
  }

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
            <h1 className="text-5xl font-serif font-bold text-stone-800 mb-4 tracking-tight">每日一花</h1>
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
              onNext={fetchFlower} // 传入获取下一朵的函数
              loading={loading}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}