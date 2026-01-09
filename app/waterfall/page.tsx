/* app/waterfall/page.tsx */
'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Flower } from '@prisma/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, ToggleLeft, ToggleRight, 
  Calendar, Layers, Home, LayoutDashboard 
} from 'lucide-react';

import MasonryItem from '@/components/MasonryItem';
import FlowerDetailModal from '@/components/FlowerDetailModal';

export default function WaterfallPage() {
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [seenIds, setSeenIds] = useState<string[]>([]);
  
  // 交互状态
  const [selectedFlower, setSelectedFlower] = useState<Flower | null>(null);
  const [enable3D, setEnable3D] = useState(true);
  
  // 滚动与加载引用
  const loaderRef = useRef<HTMLDivElement>(null);

  // 初始化
  useEffect(() => {
    fetchBatchFlowers();
  }, []);

  // 无限加载监听
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchBatchFlowers();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  const fetchBatchFlowers = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const currentListIds = flowers.map(f => f.id);
      const allSeenIds = [...new Set([...seenIds, ...currentListIds])];

      const res = await fetch('/api/flower/random', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seenIds: allSeenIds, count: 15 }),
      });
      const data = await res.json();

      if (data.list && Array.isArray(data.list) && data.list.length > 0) {
         setFlowers(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const uniqueNew = data.list.filter((f: Flower) => !existingIds.has(f.id));
            return [...prev, ...uniqueNew];
         });
         setSeenIds(prev => [...new Set([...prev, ...data.list.map((f: Flower) => f.id)])]);
      } else {
         setHasMore(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ 修改日期格式为中文 (年月日 星期)
  const currentDate = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  return (
    <div className="min-h-screen bg-[#f8f8f8] text-stone-800 font-sans">
      {/* 详情弹窗 */}
      <AnimatePresence>
        {selectedFlower && (
          <FlowerDetailModal 
            flower={selectedFlower} 
            onClose={() => setSelectedFlower(null)} 
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-[#f8f8f8]/80 backdrop-blur-xl border-b border-stone-200/50 transition-all">
        <div className="max-w-[1920px] mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* 左侧区域 */}
          <div className="flex items-center gap-6">
            <Link href="/" className="group flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center text-white group-hover:bg-stone-700 transition-colors">
                   <Home size={16} />
                </div>
                <h1 className="font-serif font-bold text-xl tracking-tight hidden sm:block">Flower Daily</h1>
            </Link>
            <div className="hidden md:flex items-center gap-2 text-xs text-stone-400 font-mono border-l border-stone-300 pl-6 h-8">
                <Calendar size={12} />
                <span>{currentDate}</span>
            </div>
          </div>

          {/* 右侧控制区 */}
          <div className="flex items-center gap-3">
            {/* 3D 效果开关 */}
            <button 
              onClick={() => setEnable3D(!enable3D)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-stone-200 shadow-sm hover:bg-stone-50 transition-colors text-xs font-medium text-stone-600 active:scale-95"
            >
              <Layers size={14} />
              <span className="hidden sm:inline">3D Effect</span>
              {enable3D ? <ToggleRight className="text-green-500" size={20} /> : <ToggleLeft className="text-stone-300" size={20} />}
            </button>

            {/* ✅ 新增：后台跳转按钮 */}
            <Link 
              href="/login" 
              className="flex items-center justify-center w-9 h-9 rounded-full bg-white border border-stone-200 shadow-sm hover:bg-stone-50 hover:text-stone-900 transition-colors text-stone-500 active:scale-95"
              title="管理后台"
            >
               <LayoutDashboard size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 py-8 min-h-screen">
        <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
           {flowers.map((flower) => (
             <MasonryItem 
               key={flower.id} 
               flower={flower} 
               enable3D={enable3D}
               onClick={setSelectedFlower}
             />
           ))}
        </div>

        {/* Loading Anchor */}
        <div ref={loaderRef} className="w-full py-20 flex flex-col items-center justify-center text-stone-400 gap-2">
          {loading ? (
             <Loader2 className="animate-spin text-stone-600" size={24} />
          ) : !hasMore && (
             <span className="font-serif italic text-sm">The garden has been fully explored.</span>
          )}
        </div>
      </main>
    </div>
  );
}