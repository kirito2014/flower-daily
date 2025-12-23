'use client';

import { useRef, useEffect } from 'react';
import { Flower } from '@prisma/client';
import { Pencil, Trash2, X } from 'lucide-react';
import FlowerForm from '@/components/FlowerForm';

interface AdminFlowerCardProps {
  flower: Flower;
  onDelete: (id: string) => void;
  // 核心：恢复受控模式 Props，实现互斥编辑
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
  // 移除内部 state，改由 props 控制
  const cardRef = useRef<HTMLDivElement>(null);
  const editFormRef = useRef<HTMLDivElement>(null);

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

  return (
    <div 
      ref={cardRef}
      className={`
        group relative bg-white rounded-2xl shadow-sm border border-stone-200 
        transition-all duration-300
        /* 恢复：流光边框逻辑 */
        ${isEditing ? 'card-editing-active scale-[1.02]' : 'hover:shadow-md z-0'}
      `}
    >
      
      {/* 图片区域 */}
      <div className="aspect-[4/3] relative bg-stone-100 rounded-t-2xl overflow-hidden">
        <img 
          src={flower.imageUrl} 
          alt={flower.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* 遮罩层 */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        
        {/* === 居中悬浮按钮组 (分裂动效) === */}
        {/* 只有在非编辑模式下显示按钮 */}
        {!isEditing && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-none">
            <div className="relative flex items-center justify-center pointer-events-auto group/btns">
              
              {/* 1. 修改按钮 (蓝色磨砂) */}
              <button
                onClick={onToggleEdit} // 恢复：调用父组件切换方法
                className="
                  relative z-10 w-12 h-12 rounded-full 
                  bg-blue-500/40 backdrop-blur-md border border-white/20 text-white 
                  flex items-center justify-center
                  shadow-lg shadow-blue-500/20
                  transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)
                  group-hover/btns:-translate-x-8
                  hover:!bg-blue-500 hover:scale-110
                "
                title="修改花卉"
              >
                <Pencil size={20} />
              </button>

              {/* 2. 删除按钮 (红色磨砂) */}
              <button
                onClick={() => {
                  if (confirm('确定要删除这朵花吗？')) {
                    onDelete(flower.id);
                  }
                }}
                className="
                  absolute inset-0 z-0 w-12 h-12 rounded-full 
                  bg-red-500/40 backdrop-blur-md border border-white/20 text-white 
                  flex items-center justify-center
                  shadow-lg shadow-red-500/20
                  opacity-0 scale-50
                  transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)
                  group-hover/btns:translate-x-8 group-hover/btns:opacity-100 group-hover/btns:scale-100
                  hover:!bg-red-500 hover:!scale-110 hover:z-20
                "
                title="删除花卉"
              >
                <Trash2 size={20} />
              </button>
              
            </div>
          </div>
        )}
      </div>

      {/* 信息展示区域 */}
      <div className="p-4 rounded-b-2xl bg-white relative z-10">
        <h3 className="font-serif font-bold text-stone-800 text-lg mb-1">{flower.name}</h3>
        <p className="text-stone-500 text-xs line-clamp-1 mb-3 font-mono opacity-80">{flower.language}</p>
        
        <div className="flex flex-wrap gap-2">
           <span className="px-2 py-1 bg-stone-100 text-stone-600 text-[10px] rounded-md">
             {flower.habit}
           </span>
        </div>
      </div>

      {/* === 编辑表单区域 (悬浮对话框) === */}
      {isEditing && (
        <div 
          ref={editFormRef}
          className="absolute top-[calc(100%+12px)] left-0 w-full bg-white rounded-xl shadow-xl border border-stone-200/80 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          {/* 顶部引导角 */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t border-l border-stone-200 transform rotate-45"></div>

          <div className="flex justify-between items-center mb-4 border-b border-stone-100 pb-2">
             <h4 className="text-xs font-bold text-blue-600 flex items-center gap-1">
               <Pencil size={12} />
               正在修改
             </h4>
             <button 
               onClick={onCloseEdit} // 恢复：调用父组件关闭方法
               className="text-stone-400 hover:text-stone-600 p-1 rounded-full hover:bg-stone-100 transition"
               title="取消"
             >
               <X size={14} />
             </button>
          </div>
          
          <FlowerForm 
            flower={flower} 
            onSuccess={onCloseEdit} // 恢复：保存成功后关闭
          />
        </div>
      )}
      
    </div>
  );
}