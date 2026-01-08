// components/LetterModal.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MailOpen } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCards, Pagination, Navigation } from 'swiper/modules';
import { useOracleStore, Letter } from '@/lib/store/oracleStore';

import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/pagination';

// 单个信封/信纸组件
const LetterItem = ({ letter }: { letter: Letter }) => {
  const [isOpened, setIsOpened] = useState(false);

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="relative w-full max-w-md aspect-[3/4] perspective-1000">
        <AnimatePresence mode="wait">
          {!isOpened ? (
            // === 状态 1: 信封 (封面) ===
            <motion.div
              key="envelope"
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -90, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="absolute inset-0 bg-[#f3f0e6] rounded-xl shadow-2xl flex flex-col items-center justify-center border-4 border-[#e8e4d5] cursor-pointer group overflow-hidden"
              onClick={() => setIsOpened(true)}
            >
              {/* 信封纹理装饰 */}
              <div className="absolute top-0 left-0 w-full h-32 bg-[#e8e4d5] transform -skew-y-6 origin-top-left opacity-50" />
              <div className="absolute bottom-0 right-0 w-full h-32 bg-[#e8e4d5] transform skew-y-6 origin-bottom-right opacity-50" />
              
              <div className="z-10 text-center space-y-4 p-8 border border-[#d6d0c0] m-6 h-[80%] flex flex-col justify-center items-center bg-white/50 backdrop-blur-sm">
                <div className="w-16 h-16 rounded-full bg-stone-800 text-white flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-500">
                  <MailOpen size={32} />
                </div>
                <h3 className="text-stone-500 font-serif text-sm tracking-widest uppercase">A Letter From</h3>
                <h2 className="text-3xl font-serif font-bold text-stone-800">{letter.flowerName}</h2>
                <p className="text-stone-400 text-xs mt-8 font-mono">点击拆开回信</p>
              </div>
            </motion.div>
          ) : (
            // === 状态 2: 信纸 (内容) ===
            <motion.div
              key="letter"
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -90, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="absolute inset-0 bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* 信纸顶部装饰 */}
              <div className="h-2 bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300" />
              
              <div className="flex-1 p-8 md:p-10 flex flex-col overflow-y-auto custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]">
                <div className="text-right text-stone-400 text-xs font-mono mb-6">{letter.date}</div>
                
                <h3 className="text-xl font-serif font-bold text-stone-800 mb-6">Dear Traveler,</h3>
                
                <div className="flex-1 text-stone-600 font-serif leading-loose text-justify whitespace-pre-wrap text-base">
                  {letter.content}
                </div>
                
                <div className="mt-12 text-right">
                  <p className="text-stone-400 text-xs font-serif italic mb-2">Yours sincerely,</p>
                  <p className="text-lg font-script text-stone-800 font-bold">{letter.flowerName}</p>
                </div>
              </div>

               {/* 底部折叠按钮 (可选，如果想合上) */}
               <button 
                  onClick={(e) => { e.stopPropagation(); setIsOpened(false); }}
                  className="absolute bottom-4 left-4 text-stone-300 hover:text-stone-500 transition-colors"
               >
                 <span className="text-[10px]">Close</span>
               </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default function LetterModal() {
  const { letters, isOpen, closeMailbox, markAllAsRead } = useOracleStore();

  // 当 Modal 打开时，标记已读 (或者在关闭时标记，取决于你的逻辑)
  React.useEffect(() => {
    if (isOpen && letters.length > 0) {
      markAllAsRead();
    }
  }, [isOpen, letters.length, markAllAsRead]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { delay: 0.2 } }} // 等待内容退出
          className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/90 backdrop-blur-md"
        >
          {/* 退出按钮 */}
          <button
            onClick={closeMailbox}
            className="absolute top-6 right-6 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all z-50"
          >
            <X size={24} />
          </button>

          {/* Swiper 容器 */}
          <div className="w-full max-w-4xl h-[80vh]">
            {letters.length > 0 ? (
              <Swiper
                effect={'cards'}
                grabCursor={true}
                modules={[EffectCards, Pagination, Navigation]}
                className="w-full h-full"
                pagination={{ dynamicBullets: true, clickable: true }}
              >
                {letters.map((letter) => (
                  <SwiperSlide key={letter.id} className="bg-transparent">
                    <LetterItem letter={letter} />
                  </SwiperSlide>
                ))}
              </Swiper>
            ) : (
              <div className="text-white/50 text-center font-serif">
                <p>暂无回信...</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}