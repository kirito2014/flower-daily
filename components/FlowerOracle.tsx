/* components/FlowerOracle.tsx */
'use client';

import React, { useState } from 'react';
import { Sparkles, ArrowUp, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FlowerOracleProps {
  onAsk: (question: string) => void;
  loading?: boolean;
}

export default function FlowerOracle({ onAsk, loading = false }: FlowerOracleProps) {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onAsk(input);
    setInput('');
  };

  return (
    <div className="w-full max-w-lg mx-auto relative z-40">
      <form onSubmit={handleSubmit} className="relative group">
        {/* 背景光晕 - 仅在聚焦或hover时显示，增加神秘感 */}
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
          {/* 左侧神秘图标 */}
          <Wand2 
            size={16} 
            className={`transition-colors duration-300 ${isFocused ? 'text-purple-300' : 'text-stone-500'}`} 
          />

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="告诉花语占卜师你的烦恼..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-stone-200 placeholder:text-stone-500/70 font-serif tracking-wide h-9"
            disabled={loading}
          />

          {/* 发送按钮 / Loading 状态 */}
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
            {loading ? (
              <Sparkles size={16} className="animate-spin text-purple-400" />
            ) : (
              <ArrowUp size={16} strokeWidth={2.5} />
            )}
          </button>
        </div>
      </form>

      {/* 底部微小提示语 */}
      <AnimatePresence>
        {isFocused && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 5 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute left-0 right-0 text-center text-[10px] text-stone-500/60 font-serif italic pointer-events-none"
          >
            聆听花开的声音，寻找内心的答案
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}