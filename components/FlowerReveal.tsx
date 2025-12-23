'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flower } from '@prisma/client';
import { RefreshCcw, Share2, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import ShareCard from './ShareCard';

interface FlowerRevealProps {
  flower: Flower;
  onNext: () => void;
}

export default function FlowerReveal({ flower, onNext }: FlowerRevealProps) {
  const [isCovered, setIsCovered] = useState(true);
  const [isSharing, setIsSharing] = useState(false);

  // 修复点：添加 'as const'
  const curtainTransition = { duration: 1.5, ease: [0.22, 1, 0.36, 1] as const };

  const handleShare = async () => {
    setIsSharing(true);
    const element = document.getElementById(`share-${flower.id}`);
    if (element) {
      try {
        const canvas = await html2canvas(element, { useCORS: true, scale: 2 });
        const link = document.createElement('a');
        link.download = `${flower.name}-花语.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (err) {
        console.error("生成失败", err);
        alert("图片生成失败，可能是跨域问题");
      }
    }
    setIsSharing(false);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#f0f0eb]">
      
      <ShareCard flower={flower} elementId={`share-${flower.id}`} />

      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-0">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: isCovered ? 0 : 1, scale: isCovered ? 0.95 : 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="max-w-md w-full bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-8 shadow-2xl text-center"
        >
          <div className="mb-6">
            <h1 className="text-4xl font-serif text-stone-800 mb-2">{flower.name}</h1>
            <p className="text-stone-500 font-serif italic text-lg">{flower.language}</p>
          </div>

          <div className="bg-white/50 rounded-xl p-4 mb-8 text-sm text-stone-600 text-left">
            <span className="font-bold text-stone-800 mr-2">[习性]</span>
            {flower.habit}
          </div>

          <div className="flex gap-4">
             <button 
               onClick={onNext}
               className="flex-1 py-3 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition flex items-center justify-center gap-2"
             >
               <RefreshCcw size={18} />
               再送自己一朵
             </button>
             <button 
               onClick={handleShare}
               disabled={isSharing}
               className="px-4 py-3 bg-white text-stone-800 border border-stone-200 rounded-xl hover:bg-stone-50 transition flex items-center gap-2"
             >
               {isSharing ? <Loader2 className="animate-spin" size={18}/> : <Share2 size={18} />}
             </button>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isCovered && (
          <motion.div 
            className="absolute inset-0 z-20 cursor-pointer"
            onClick={() => setIsCovered(false)}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, pointerEvents: 'none', transition: { duration: 1, delay: 0.5 } }}
          >
            <motion.div 
              className="absolute top-0 left-0 w-full h-1/2 bg-stone-900 overflow-hidden border-b border-white/20"
              initial={{ y: 0 }}
              // 这里引用 curtainTransition 就不会报错了
              exit={{ y: '-100%', transition: curtainTransition }}
            >
              <div 
                className="w-full h-[200%] absolute top-0 left-0 bg-cover bg-center opacity-80"
                style={{ backgroundImage: `url(${flower.imageUrl})` }}
              />
              <div className="absolute inset-0 flex items-end justify-center pb-2 bg-black/20">
                <span className="text-white/90 text-6xl font-serif font-bold tracking-[0.2em] translate-y-[50%] z-10 drop-shadow-lg">
                    {flower.name}
                </span>
              </div>
            </motion.div>

            <motion.div 
              className="absolute bottom-0 left-0 w-full h-1/2 bg-stone-800 overflow-hidden border-t border-white/20"
              initial={{ y: 0 }}
              // 这里也一样
              exit={{ y: '100%', transition: curtainTransition }}
            >
              <div 
                className="w-full h-[200%] absolute top-[-100%] left-0 bg-cover bg-center opacity-80"
                style={{ backgroundImage: `url(${flower.imageUrl})` }}
              />
              <div className="absolute inset-0 flex items-start justify-center pt-12">
                 <p className="text-white/70 text-sm tracking-widest animate-pulse border border-white/30 px-4 py-1 rounded-full backdrop-blur-sm">
                    点击拆开礼物
                 </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}