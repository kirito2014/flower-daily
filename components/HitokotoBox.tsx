'use client';

import { useState, useRef } from 'react';
import { Quote, Loader2 } from 'lucide-react';

export default function HitokotoBox({ initialText }: { initialText: string | null }) {
  const [text, setText] = useState<string | null>(initialText);
  const [isLoading, setIsLoading] = useState(false);
  const lastClickTime = useRef(0);

  const handleRefresh = async () => {
    const now = Date.now();
    // 核心逻辑：2秒节流限制
    if (now - lastClickTime.current < 2000 || isLoading) return;
    lastClickTime.current = now;

    setIsLoading(true);
    try {
      // 客户端请求新的一言
      const res = await fetch('https://v1.hitokoto.cn/?c=d&encode=text');
      if (res.ok) {
        const newText = await res.text();
        setText(newText);
      }
    } catch (error) {
      console.error('Hitokoto refresh failed', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!text) return null;

  return (
    <div 
      onClick={handleRefresh}
      className="hidden md:flex items-center px-4 h-[38px] max-w-md rounded-full border border-white/80 bg-white/40 backdrop-blur-md shadow-sm transition-all hover:bg-white/60 cursor-pointer active:scale-95 select-none"
      title="点击刷新 (2s冷却)"
    >
      {isLoading ? (
        <Loader2 size={12} className="text-stone-400 mr-2 shrink-0 animate-spin" />
      ) : (
        <Quote size={12} className="text-stone-400 mr-2 shrink-0 fill-stone-400" />
      )}
      <span className={`text-xs font-serif italic text-stone-600 truncate transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
        {text}
      </span>
    </div>
  );
}