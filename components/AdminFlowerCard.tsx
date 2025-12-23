'use client';

import { useRef, useEffect, useState } from 'react';
import { Flower } from '@prisma/client';
import { Pencil, Trash2, X, Share2, Loader2 } from 'lucide-react';
import FlowerForm from '@/components/FlowerForm';
import { toPng } from 'html-to-image';

interface AdminFlowerCardProps {
  flower: Flower;
  onDelete: (id: string) => void;
  isEditing: boolean;
  onToggleEdit: () => void;
  onCloseEdit: () => void;
}

export default function AdminFlowerCard({ 
  flower, 
  onDelete, 
  isEditing, 
  onToggleEdit, 
  onCloseEdit 
}: AdminFlowerCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const editFormRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (isEditing && editFormRef.current) {
      setTimeout(() => {
        editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [isEditing]);

  const handleShare = async () => {
    if (cardRef.current === null || isSharing) return;
    setIsSharing(true);
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `${flower.name}-share.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Share failed', err);
      alert('生成图片失败');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div 
      ref={cardRef}
      className={`
        group relative bg-white rounded-2xl shadow-sm border border-stone-200 
        transition-all duration-300 overflow-hidden
        ${isEditing ? 'card-editing-active scale-[1.02]' : 'hover:shadow-md z-0'}
        ${isSharing ? 'pointer-events-none' : ''}
      `}
    >
      
      {/* 图片区域 */}
      <div className="aspect-[4/3] relative bg-stone-100 rounded-t-2xl overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={flower.imageUrl} 
          alt={flower.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          crossOrigin="anonymous" 
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        
        {/* 悬浮按钮组 */}
        {!isEditing && !isSharing && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-none">
            <div className="relative flex items-center justify-center h-12 w-full pointer-events-auto group/btns">
              
              <button
                onClick={onToggleEdit}
                className="relative z-30 w-12 h-12 rounded-full bg-blue-500/40 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-lg hover:!bg-blue-500 hover:scale-110 hover:z-40 transition-all duration-300"
                title="修改"
              >
                <Pencil size={20} />
              </button>

              <button
                onClick={handleShare}
                disabled={isSharing}
                className="absolute inset-0 z-20 w-12 h-12 rounded-full mx-auto bg-purple-500/40 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-lg opacity-0 scale-50 group-hover/btns:-translate-x-16 group-hover/btns:opacity-100 group-hover/btns:scale-100 hover:!bg-purple-500 hover:!scale-110 hover:z-40 transition-all duration-300"
                title="分享"
              >
                {isSharing ? <Loader2 className="animate-spin" size={20} /> : <Share2 size={20} />}
              </button>

              <button
                onClick={() => confirm('确定删除？') && onDelete(flower.id)}
                className="absolute inset-0 z-10 w-12 h-12 rounded-full mx-auto bg-red-500/40 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-lg opacity-0 scale-50 group-hover/btns:translate-x-16 group-hover/btns:opacity-100 group-hover/btns:scale-100 hover:!bg-red-500 hover:!scale-110 hover:z-40 transition-all duration-300"
                title="删除"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* === 信息区域 (布局调整) === */}
      <div className="p-4 rounded-b-2xl bg-white relative z-10 flex items-center gap-4">
        
        {/* 左侧：中文名 + 英文名 */}
        <div className="flex flex-col shrink-0 ml-2">
          <h3 className="font-serif font-bold text-stone-800 text-xl">
            {flower.name}
          </h3>
          {/* 英文名：斜体宋体 */}
          <p className="font-serif italic text-sm text-stone-400 mt-0.5">
            {flower.englishName}
          </p>
        </div>

        {/* 分隔线 */}
        <div className="w-px h-8 bg-stone-200 shrink-0"></div>
        
        {/* 右侧：信息 */}
        <div className="flex flex-col items-start gap-1 overflow-hidden min-w-0">
          <p className="text-stone-500 text-xs font-mono opacity-80 text-left line-clamp-1 w-full" title={flower.language}>
            {flower.language}
          </p>
          <span className="px-2 py-0.5 bg-stone-100 text-stone-600 text-[10px] rounded-md whitespace-nowrap">
             {flower.habit}
          </span>
        </div>

      </div>

      {/* 编辑表单 */}
      {isEditing && (
        <div ref={editFormRef} className="absolute top-[calc(100%+12px)] left-0 w-full bg-white rounded-xl shadow-xl border border-stone-200/80 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t border-l border-stone-200 transform rotate-45"></div>
          <div className="flex justify-between items-center mb-4 border-b border-stone-100 pb-2">
             <h4 className="text-xs font-bold text-blue-600 flex items-center gap-1"><Pencil size={12} /> 正在修改</h4>
             <button onClick={onCloseEdit} className="text-stone-400 hover:text-stone-600 p-1 rounded-full hover:bg-stone-100"><X size={14} /></button>
          </div>
          <FlowerForm flower={flower} onSuccess={onCloseEdit} />
        </div>
      )}
    </div>
  );
}