/* components/FlowerOracle.tsx */
'use client';

import React, { useState } from 'react';
import { Sparkles, ArrowUp, Wand2, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOracleStore } from '@/lib/store/oracleStore';

interface FlowerOracleProps {
  onAsk: (question: string) => void;
  loading?: boolean;
}

export default function FlowerOracle({ onAsk, loading = false }: FlowerOracleProps) {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  // 从 Store 获取状态
  const { unreadCount, openMailbox } = useOracleStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onAsk(input);
    setInput('');
  };

  const handleMailboxClick = () => {
    if (unreadCount > 0) {
      openMailbox();
    } else {
      const toast = document.createElement('div');
      toast.innerText = '静待回信中...';
      toast.style.cssText = 'position: fixed; bottom: 20%; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.7); color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; z-index: 200; backdrop-filter: blur(8px); pointer-events: none; border: 1px solid rgba(255,255,255,0.1);';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto relative z-40 flex items-end gap-3">
      {/* 1. 输入框部分 */}
      <form onSubmit={handleSubmit} className="relative group flex-1">
        {/* 背景光晕 - 聚焦时显示 (加深颜色以适应浅色玻璃) */}
        <div 
          className={`absolute -inset-0.5 bg-gradient-to-r from-purple-500/30 via-blue-500/30 to-teal-500/30 rounded-full blur opacity-0 transition duration-1000 group-hover:opacity-40 ${isFocused ? 'opacity-60 duration-200' : ''}`}
        />
        
        <div className={`
          relative flex items-center gap-2 p-1.5 pl-4 rounded-full border transition-all duration-500
          backdrop-blur-xl shadow-lg
          ${isFocused 
            ? 'bg-white/80 border-white/60 shadow-purple-900/5' // 聚焦：接近纯白的磨砂，边框清晰
            : 'bg-white/40 border-white/40 hover:bg-white/60'   // 默认：通透但有足够白底的磨砂 (iOS Style)
          }
        `}>
          {/* 图标颜色：使用深灰色 (Stone-600) 形成对比 */}
          <Wand2 size={16} className={`transition-colors duration-300 ${isFocused ? 'text-purple-600' : 'text-stone-600'}`} />

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="告诉花语占卜师你的烦恼..."
            // ✅ 修改重点：字体颜色改为深灰 (text-stone-800)，Placeholder 为中灰 (stone-500)
            className="flex-1 bg-transparent border-none outline-none text-sm text-stone-800 placeholder:text-stone-500 font-serif tracking-wide h-9 selection:bg-purple-200 selection:text-purple-900"
            disabled={loading}
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className={`
              p-2 rounded-full flex items-center justify-center transition-all duration-300
              ${input.trim() && !loading
                ? 'bg-stone-800 text-white hover:bg-stone-900 hover:scale-105 active:scale-95 shadow-md' // 按钮保持深色实心，形成视觉重心
                : 'bg-stone-900/5 text-stone-400 cursor-not-allowed'
              }
            `}
          >
            {loading ? <Sparkles size={16} className="animate-spin text-purple-600" /> : <ArrowUp size={16} strokeWidth={2.5} />}
          </button>
        </div>
        
         {/* 底部微小提示语 - 加深颜色 */}
        <AnimatePresence>
          {isFocused && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 5 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute left-0 right-0 top-full mt-2 text-center text-[10px] text-stone-500 font-serif italic pointer-events-none"
            >
              聆听花开的声音，寻找内心的答案
            </motion.p>
          )}
        </AnimatePresence>
      </form>

      {/* 2. 信箱按钮 - 同步 iOS 亮色玻璃样式 */}
      <button 
        onClick={handleMailboxClick}
        className="relative group/mail p-3 rounded-full bg-white/40 border border-white/40 backdrop-blur-xl hover:bg-white/60 hover:border-white/60 hover:scale-105 transition-all shadow-lg active:scale-95"
      >
        {/* 图标改为深色 */}
        <Mail size={20} className="text-stone-600 group-hover/mail:text-stone-800 transition-colors" />
        
        {/* 角标 */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full px-1 border border-white shadow-sm"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tooltip hint */}
        {unreadCount === 0 && (
          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-stone-800/90 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover/mail:opacity-100 transition-opacity whitespace-nowrap pointer-events-none backdrop-blur-md">
            信箱
          </span>
        )}
      </button>
    </div>
  );
}