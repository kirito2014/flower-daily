'use client';

import { useRef, useEffect, useState } from 'react';
import { Flower } from '@prisma/client';
import { Pencil, Trash2, X } from 'lucide-react';
import FlowerForm from '@/components/FlowerForm';

interface AdminFlowerListItemProps {
  flower: Flower;
  onDelete: (id: string) => void;
  onUpdate: () => void;
  isEditing: boolean;
  onToggleEdit: () => void;
  onCloseEdit: () => void;
}

export default function AdminFlowerListItem({ 
  flower, 
  onDelete, 
  onUpdate,
  isEditing, 
  onToggleEdit, 
  onCloseEdit 
}: AdminFlowerListItemProps) {
  const listItemRef = useRef<HTMLDivElement>(null);
  const editFormRef = useRef<HTMLDivElement>(null);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isEditing && editFormRef.current) {
      setTimeout(() => {
        editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [isEditing]);

  const handleSuccess = () => {
    onCloseEdit();
    onUpdate();
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    setIsDeleting(true);
    setTimeout(() => {
      onDelete(flower.id);
    }, 500);
  };

  return (
    <>
      <div 
        ref={listItemRef}
        className={`
          relative w-full bg-white rounded-2xl shadow-sm border border-stone-200 
          transition-all duration-500 ease-in-out group hover:shadow-md
          ${isDeleting ? 'grayscale opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}
          ${isEditing ? 'z-50 ring-2 ring-stone-200' : 'z-0'}
        `}
      >
        {/* === 列表内容行 === */}
        <div className="flex items-center h-40 p-4 gap-6">
          
          {/* 左侧图片 */}
          <div className="relative h-32 w-[170px] shrink-0 ml-2 shadow-sm rounded-xl overflow-hidden border border-stone-100 bg-stone-50">
            <img 
              src={flower.imageUrl} 
              alt={flower.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              crossOrigin="anonymous" 
            />
          </div>

          {/* 中间：花名 (放大字号) */}
          <div className="flex flex-col items-center justify-center min-w-[120px] gap-2 px-4 border-r border-stone-100/50">
            {/* 修改：加大字号 text-3xl */}
            <h3 className="font-serif font-bold text-stone-800 text-3xl leading-none">
              {flower.name}
            </h3>
            <p className="font-serif italic text-sm text-stone-400 leading-none">
              {flower.englishName}
            </p>
          </div>

          {/* 右侧：信息 */}
          <div className="flex-1 flex flex-col items-end justify-center gap-2 overflow-hidden">
            <p 
                className="text-stone-500 text-sm font-mono opacity-80 text-right line-clamp-2 w-full max-w-lg leading-relaxed italic" 
                title={flower.language}
            >
                “{flower.language}”
            </p>
            <span className="px-3 py-1 bg-stone-100 text-stone-600 text-xs rounded-lg whitespace-nowrap font-medium">
               {flower.habit}
            </span>
          </div>

          {/* 操作区 */}
          <div className="flex items-center gap-3 pl-6 pr-2 border-l border-stone-100 h-20">
            <button
              onClick={onToggleEdit}
              className={`
                w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border transition-all duration-200
                bg-white border-blue-100 text-blue-500
                hover:bg-blue-500 hover:text-white hover:border-blue-500 hover:shadow-md active:scale-95
              `}
              title="修改"
            >
              {isEditing ? <X size={18} /> : <Pencil size={18} />}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className={`
                w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border transition-all duration-200
                bg-white border-red-100 text-red-500
                hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-md active:scale-95
              `}
              title="删除"
            >
              <Trash2 size={18} />
            </button>
          </div>

        </div>

        {/* === 编辑表单 (下方展开) === */}
        {isEditing && (
          <div 
            ref={editFormRef}
            // 修改：动效与 AdminFlowerCard 保持一致 (ease-in-out + zoom-in)，更具流动感
            className="absolute top-[calc(100%+0.75rem)] left-0 w-full bg-white rounded-2xl shadow-2xl border border-stone-200 p-6 z-50 animate-in fade-in zoom-in-95 duration-300 ease-in-out"
          >
             {/* 顶部指示箭头 (保持在上方居中，适合列表布局) */}
             <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t border-l border-stone-200 transform rotate-45"></div>
             
             <div className="flex justify-between items-center mb-6 border-b border-stone-100 pb-3">
                <h4 className="text-sm font-bold text-blue-600 flex items-center gap-2">
                  <Pencil size={14} />
                  编辑花卉信息
                </h4>
                <button onClick={onCloseEdit} className="text-stone-400 hover:text-stone-600 p-1 rounded-full hover:bg-stone-100">
                    <X size={16} />
                </button>
             </div>

             <FlowerForm flower={flower} onSuccess={handleSuccess} />
          </div>
        )}
      </div>

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/20 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white rounded-2xl p-6 shadow-2xl w-[320px] flex flex-col items-center animate-in zoom-in-95 duration-200 border border-stone-100"
          >
            <div className="text-5xl mb-4 animate-pulse grayscale transition-all duration-1000 select-none">
              🌸
            </div>
            <h3 className="text-stone-800 font-bold text-lg mb-8">确定删除花朵吗？</h3>
            <div className="flex gap-4 w-full">
               <button 
                 onClick={() => setShowDeleteConfirm(false)} 
                 className="flex-1 py-2.5 rounded-xl border border-blue-100 bg-white text-blue-500 font-bold shadow-md hover:bg-blue-500 hover:text-white transition-all active:scale-95"
               >
                 取消
               </button>
               <button 
                 onClick={handleConfirmDelete} 
                 className="flex-1 py-2.5 rounded-xl border border-red-100 bg-white text-red-500 font-bold shadow-md hover:bg-red-500 hover:text-white transition-all active:scale-95"
               >
                 确定
               </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}