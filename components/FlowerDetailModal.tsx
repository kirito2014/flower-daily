/* components/FlowerDetailModal.tsx */
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Flower } from '@prisma/client';
import { X, ExternalLink, Camera, Leaf, Hash, Image as ImageIcon, User } from 'lucide-react';

interface FlowerDetailModalProps {
  flower: Flower | null;
  onClose: () => void;
}

export default function FlowerDetailModal({ flower, onClose }: FlowerDetailModalProps) {
  if (!flower) return null;

  // 格式化日期为：XX年XX月XX日
  const formattedDate = new Date(flower.createdAt).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 sm:px-8 py-8 pointer-events-none">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto"
      />

      <motion.div
        layoutId={`card-${flower.id}`} 
        className="relative w-full max-w-5xl h-[80vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row pointer-events-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-black/10 hover:bg-black/20 rounded-full text-stone-600 transition-colors backdrop-blur-md"
        >
          <X size={20} />
        </button>

        {/* 左侧：图片区域 */}
        <div className="w-full md:w-3/5 h-1/2 md:h-full relative bg-stone-100 group">
          <motion.img
            src={flower.imageUrl}
            alt={flower.name}
            className="w-full h-full object-cover"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          />
          {/* 快捷跳转按钮 (悬浮显示) */}
          <a 
            href={flower.sourceUrl || flower.imageUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="absolute bottom-4 right-4 p-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40"
            title="View Original Source"
          >
            <ExternalLink size={16} />
          </a>
        </div>

        {/* 右侧：信息区域 */}
        <div className="w-full md:w-2/5 h-1/2 md:h-full p-8 md:p-12 flex flex-col overflow-y-auto bg-white text-stone-800">
          <div className="mb-8">
            <h2 className="text-4xl font-serif font-bold mb-2 text-stone-900">{flower.name}</h2>
            <p className="text-lg font-serif italic text-stone-500">{flower.englishName || 'Unknown'}</p>
          </div>

          <div className="space-y-8 flex-1">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center shrink-0">
                <Leaf className="text-pink-400" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-stone-400 uppercase tracking-wider mb-1">花语</h3>
                <p className="text-stone-700 leading-relaxed text-lg">{flower.language}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                <Hash className="text-green-600" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-stone-400 uppercase tracking-wider mb-1">习性</h3>
                <p className="text-stone-600 leading-relaxed text-sm">{flower.habit}</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Camera className="text-blue-500" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-stone-400 uppercase tracking-wider mb-1">Credit</h3>
                <div className="flex flex-col gap-2 items-start">
                   
                   {/* 1. 摄影师链接 (带人头标志) */}
                   <a 
                     href={flower.pgsourceUrl || '#'} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-md text-xs text-stone-600 transition-colors group"
                   >
                     <User size={12} className="group-hover:text-blue-500 transition-colors" />
                     <span className="font-medium">{flower.photographer || 'Anonymous'}</span>
                     <ExternalLink size={10} className="opacity-50" />
                   </a>
                   
                   {/* 2. 图片来源链接 */}
                   <a 
                     href={flower.sourceUrl || '#'} 
                     target="_blank"
                     rel="noopener noreferrer"
                     className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-md text-xs text-stone-600 transition-colors group"
                   >
                     <ImageIcon size={12} className="group-hover:text-blue-500 transition-colors" />
                     <span>View on Unsplash</span>
                     <ExternalLink size={10} className="opacity-50" />
                   </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-stone-100 flex justify-between items-center text-xs text-stone-400 font-mono">
            <span>ID: {flower.id.slice(0, 8)}</span>
            {/* 修改后的日期格式 */}
            <span>记录于 {formattedDate}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}