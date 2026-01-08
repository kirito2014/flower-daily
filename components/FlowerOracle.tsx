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
      toast.style.cssText = 'position: fixed; bottom: 20%; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.7); color: white; padding: 8px 16px; border-radius: 20px; font-size: 12px; z-index: 200; backdrop-filter: blur(4px); pointer-events: none;';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto relative z-40 flex items-end gap-3">
      {/* 1. 输入框部分 */}
      <form onSubmit={handleSubmit} className="relative group flex-1">
        {/* 背景光晕 - 聚焦时显示 */}
        <div 
          className={`absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-teal-500/20 rounded-full blur opacity-0 transition duration-1000 group-hover:opacity-50 ${isFocused ? 'opacity-75 duration-200' : ''}`}
        />
        
        <div className={`
          relative flex items-center gap-2 p-1.5 pl-4 rounded-full border transition-all duration-500
          backdrop-blur-xl shadow-xl
          ${isFocused 
            ? 'bg-stone-900/80 border-stone-500/50 shadow-purple-900/20' 
            : 'bg-stone-900/40 border-stone-700/30 hover:bg-stone-900/60'
          }
        `}>
          <Wand2 size={16} className={`transition-colors duration-300 ${isFocused ? 'text-purple-300' : 'text-stone-500'}`} />

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="告诉花语占卜师你的烦恼..."
            // 修改点：text-white 纯白文字，placeholder:text-stone-400 增强对比
            className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-stone-400 font-serif tracking-wide h-9"
            disabled={loading}
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className={`
              p-2 rounded-full flex items-center justify-center transition-all duration-300
              ${input.trim() && !loading
                ? 'bg-stone-100 text-stone-900 hover:scale-105 active:scale-95 shadow-lg shadow-white/10' 
                : 'bg-white/5 text-stone-600 cursor-not-allowed'
              }
            `}
          >
            {loading ? <Sparkles size={16} className="animate-spin text-purple-400" /> : <ArrowUp size={16} strokeWidth={2.5} />}
          </button>
        </div>
        
         {/* 底部微小提示语 */}
        <AnimatePresence>
          {isFocused && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 5 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute left-0 right-0 top-full mt-2 text-center text-[10px] text-stone-500/60 font-serif italic pointer-events-none"
            >
              聆听花开的声音，寻找内心的答案
            </motion.p>
          )}
        </AnimatePresence>
      </form>

      {/* 2. 信箱按钮 */}
      <button 
        onClick={handleMailboxClick}
        className="relative group/mail p-3 rounded-full bg-stone-900/40 border border-stone-700/30 backdrop-blur-xl hover:bg-stone-900/80 hover:scale-105 transition-all shadow-lg active:scale-95"
      >
        <Mail size={20} className="text-stone-400 group-hover/mail:text-stone-200 transition-colors" />
        
        {/* 角标 */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full px-1 border border-stone-900 shadow-sm"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tooltip hint */}
        {unreadCount === 0 && (
          <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover/mail:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            信箱
          </span>
        )}
      </button>
    </div>
  );
}