'use client';

import { useRef, useEffect, useState } from 'react';
import { Flower } from '@prisma/client';
import { Pencil, Trash2, X, Share2, Loader2 } from 'lucide-react';
import FlowerForm from '@/components/FlowerForm';
import { toPng } from 'html-to-image';

interface AdminFlowerCardProps {
  flower: Flower;
  index: number;
  onDelete: (id: string) => void;
  onUpdate: () => void;
  isEditing: boolean;
  onToggleEdit: () => void;
  onCloseEdit: () => void;
}

export default function AdminFlowerCard({ 
  flower, 
  index,
  onDelete, 
  onUpdate,
  isEditing, 
  onToggleEdit, 
  onCloseEdit 
}: AdminFlowerCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const editFormRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);

  // === 核心逻辑：计算弹出方向 ===
  // 第 1,2 列 (0,1) -> 属于左半区 -> 向右弹出
  // 第 3,4 列 (2,3) -> 属于右半区 -> 向左弹出
  const colIndex = index % 4;
  const isLeftHalf = colIndex < 2; 

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

  const handleSuccess = () => {
    onCloseEdit();
    onUpdate();
  };

  return (
    <div 
      ref={cardRef}
      className={`
        group relative bg-white rounded-2xl shadow-sm border border-stone-200 
        transition-all duration-300
        ${isEditing ? 'card-editing-active z-50' : 'hover:shadow-md z-0'}
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

      {/* 信息区域 */}
      {/* 修改点：items-center -> items-end (底部对齐) */}
      <div className="p-4 rounded-b-2xl bg-white relative z-10 flex items-end gap-4">
        
        {/* 左侧：花名 + 英文名 */}
        <div className="flex flex-col shrink-0 ml-2">
          <h3 className="font-serif font-bold text-stone-800 text-xl leading-none mb-1">
            {flower.name}
          </h3>
          {/* 修改点：移除 mt-0.5，让英文名紧贴中文名，实现“上移” */}
          <p className="font-serif italic text-sm text-stone-400 leading-none">
            {flower.englishName}
          </p>
        </div>

        {/* 分隔线 */}
        {/* 修改点：添加 self-center，防止线掉到底部 */}
        <div className="w-px h-8 bg-stone-200 shrink-0 self-center"></div>
        
        {/* 右侧：花语 + 习性 */}
        <div className="flex flex-col items-end gap-1 overflow-hidden min-w-0 flex-1">
          <p 
            className="text-stone-500 text-xs font-mono opacity-80 text-right line-clamp-1 w-full" 
            title={flower.language}
          >
            {flower.language}
          </p>
          <span className="px-2 py-0.5 bg-stone-100 text-stone-600 text-[10px] rounded-md whitespace-nowrap">
             {flower.habit}
          </span>
        </div>
      </div>

      {/* === 编辑表单区域 === */}
      {isEditing && (
        <div 
          ref={editFormRef}
          className={`
            absolute top-0 h-full bg-white rounded-2xl shadow-2xl border border-stone-200 p-6 
            animate-in fade-in zoom-in-95 duration-300 ease-in-out
            w-[calc(200%+2.0rem)]
            ${isLeftHalf ? 'left-[calc(100%+1.5rem)]' : 'right-[calc(100%+1.5rem)]'}
          `}
          style={{ zIndex: 100 }}
        >
          <button 
             onClick={onCloseEdit} 
             className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 p-1.5 rounded-full hover:bg-stone-100 transition"
          >
             <X size={18} />
          </button>

          <div className="mb-6 flex items-center gap-2 text-blue-600 font-bold border-b border-stone-100 pb-3">
             <Pencil size={16} />
             <span>修改信息</span>
          </div>

          <div className="h-[calc(100%-60px)] overflow-y-auto pr-1">
             <FlowerForm flower={flower} onSuccess={handleSuccess} />
          </div>
        </div>
      )}
    </div>
  );
}