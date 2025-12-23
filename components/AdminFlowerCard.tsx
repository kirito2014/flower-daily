'use client';

import { useRef, useEffect, useState } from 'react';
import { Flower } from '@prisma/client';
import { Pencil, Trash2, X, Share2, Loader2 } from 'lucide-react'; // 引入新图标
import FlowerForm from '@/components/FlowerForm';
import { toPng } from 'html-to-image'; // 引入截图库

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
  
  // 新增：分享状态，防止重复点击
  const [isSharing, setIsSharing] = useState(false);

  // 自动聚焦逻辑
  useEffect(() => {
    if (isEditing && editFormRef.current) {
      setTimeout(() => {
        editFormRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 100);
    }
  }, [isEditing]);

  // === 新增：处理分享 (生成 PNG) ===
  const handleShare = async () => {
    if (cardRef.current === null || isSharing) return;
    setIsSharing(true);

    try {
      // 1. 生成图片 Blob URL (pixelRatio: 2 保证高清)
      // cacheBust: true 强制不使用缓存，尝试解决跨域问题
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      
      // 2. 创建临时链接触发下载
      const link = document.createElement('a');
      link.download = `${flower.name}-share.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate image', err);
      alert('生成图片失败，请重试（如果是跨域图片可能需要配置 CORS）');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div 
      ref={cardRef}
      // 添加 bg-white 确保截图背景为白色（而不是透明）
      // overflow-hidden 确保截图边缘圆润
      className={`
        group relative bg-white rounded-2xl shadow-sm border border-stone-200 
        transition-all duration-300 overflow-hidden
        ${isEditing ? 'card-editing-active scale-[1.02]' : 'hover:shadow-md z-0'}
        ${isSharing ? 'pointer-events-none' : ''} /* 分享生成中禁用交互 */
      `}
    >
      
      {/* 图片区域 */}
      <div className="aspect-[4/3] relative bg-stone-100 rounded-t-2xl overflow-hidden">
        {/* 使用 img 标签并开启 crossOrigin，这对 html-to-image 至关重要 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={flower.imageUrl} 
          alt={flower.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          crossOrigin="anonymous" 
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        
        {/* === 居中悬浮按钮组 (三向爆发动效) === */}
        {/* 非编辑且非分享状态下显示 */}
        {!isEditing && !isSharing && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-none">
            {/* 按钮容器 */}
            <div className="relative flex items-center justify-center h-12 w-full pointer-events-auto group/btns">
              
              {/* 1. 修改按钮 (蓝色) - 居中不动，层级最高 */}
              <button
                onClick={onToggleEdit}
                className="
                  relative z-30 w-12 h-12 rounded-full 
                  bg-blue-500/40 backdrop-blur-md border border-white/20 text-white 
                  flex items-center justify-center
                  shadow-lg shadow-blue-500/20
                  transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)
                  hover:!bg-blue-500 hover:scale-110 hover:z-40
                "
                title="修改花卉"
              >
                <Pencil size={20} />
              </button>

              {/* 2. 分享按钮 (紫色) - 向左弹出 (-translate-x-16) */}
              <button
                onClick={handleShare}
                disabled={isSharing}
                className="
                  absolute inset-0 z-20 w-12 h-12 rounded-full mx-auto
                  bg-purple-500/40 backdrop-blur-md border border-white/20 text-white 
                  flex items-center justify-center
                  shadow-lg shadow-purple-500/20
                  opacity-0 scale-50
                  transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)
                  /* 动效核心：悬浮容器时向左平移 */
                  group-hover/btns:-translate-x-16 group-hover/btns:opacity-100 group-hover/btns:scale-100
                  hover:!bg-purple-500 hover:!scale-110 hover:z-40
                "
                title="分享卡片图片"
              >
                {isSharing ? <Loader2 className="animate-spin" size={20} /> : <Share2 size={20} />}
              </button>

              {/* 3. 删除按钮 (红色) - 向右弹出 (translate-x-16) */}
              <button
                onClick={() => {
                  if (confirm('确定要删除这朵花吗？')) {
                    onDelete(flower.id);
                  }
                }}
                className="
                  absolute inset-0 z-10 w-12 h-12 rounded-full mx-auto
                  bg-red-500/40 backdrop-blur-md border border-white/20 text-white 
                  flex items-center justify-center
                  shadow-lg shadow-red-500/20
                  opacity-0 scale-50
                  transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)
                  /* 动效核心：悬浮容器时向右平移 */
                  group-hover/btns:translate-x-16 group-hover/btns:opacity-100 group-hover/btns:scale-100
                  hover:!bg-red-500 hover:!scale-110 hover:z-40
                "
                title="删除花卉"
              >
                <Trash2 size={20} />
              </button>
              
            </div>
          </div>
        )}
      </div>

      {/* === 信息展示区域 (左花名，右信息) === */}
      <div className="p-4 rounded-b-2xl bg-white relative z-10 flex items-center gap-4">
        
        {/* 左侧：花名 (大字体) */}
        <h3 className="font-serif font-bold text-stone-800 text-xl shrink-0 ml-2">
          {flower.name}
        </h3>

        {/* 中间：竖线分隔 */}
        <div className="w-px h-8 bg-stone-200 shrink-0"></div>
        
        {/* 右侧：花语 + 习性 右对齐 */}
        <div className="flex flex-col items-end gap-1 overflow-hidden min-w-0 ml-auto">
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
          className="absolute top-[calc(100%+12px)] left-0 w-full bg-white rounded-xl shadow-xl border border-stone-200/80 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t border-l border-stone-200 transform rotate-45"></div>

          <div className="flex justify-between items-center mb-4 border-b border-stone-100 pb-2">
             <h4 className="text-xs font-bold text-blue-600 flex items-center gap-1">
               <Pencil size={12} />
               正在修改
             </h4>
             <button 
               onClick={onCloseEdit} 
               className="text-stone-400 hover:text-stone-600 p-1 rounded-full hover:bg-stone-100 transition"
               title="取消"
             >
               <X size={14} />
             </button>
          </div>
          
          <FlowerForm 
            flower={flower} 
            onSuccess={onCloseEdit} 
          />
        </div>
      )}
      
    </div>
  );
}