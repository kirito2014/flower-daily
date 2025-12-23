'use client';

import { useRef, useEffect } from 'react';
import { Flower } from '@prisma/client';
import { Pencil, Trash2, X } from 'lucide-react';
import FlowerForm from './FlowerForm';

interface AdminFlowerCardProps {
  flower: Flower;
  onDelete: (id: string) => void;
  // 新增 Props：受控模式
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
  // 移除内部状态 const [isEditing, setIsEditing] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const editFormRef = useRef<HTMLDivElement>(null);

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
        /* 使用新的 CSS 动画类名 */
        ${isEditing ? 'card-editing-active scale-[1.02]' : 'hover:shadow-md z-0'}
      `}
    >
      <div className="aspect-[4/3] relative bg-stone-100 rounded-t-2xl overflow-hidden">
        <img 
          src={flower.imageUrl} 
          alt={flower.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
      </div>

      <div className="p-4 rounded-b-2xl">
        <h3 className="font-serif font-bold text-stone-800 text-lg mb-1">{flower.name}</h3>
        <p className="text-stone-500 text-xs line-clamp-1 mb-3 font-mono opacity-80">{flower.language}</p>
        
        <div className="flex flex-wrap gap-2">
           <span className="px-2 py-1 bg-stone-100 text-stone-600 text-[10px] rounded-md">
             {flower.habit}
           </span>
        </div>
      </div>

      {/* 按钮组 */}
      {!isEditing && (
        <div className="absolute top-3 right-3 z-20 flex items-center bg-white/90 backdrop-blur-md rounded-full shadow-sm border border-stone-200/50 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-out w-9 hover:w-[4.6rem] transition-[width] duration-300 ease-in-out">
          <button
            onClick={onToggleEdit} // 使用 props
            className="w-9 h-9 flex items-center justify-center shrink-0 text-stone-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="修改花卉"
          >
            <Pencil size={16} />
          </button>

          <button
            onClick={() => {
              if (confirm('确定要删除这朵花吗？')) {
                onDelete(flower.id);
              }
            }}
            className="w-9 h-9 flex items-center justify-center shrink-0 text-stone-400 hover:text-red-600 hover:bg-red-50 border-l border-stone-100 transition-colors"
            title="删除花卉"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

      {/* 编辑表单 */}
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
               onClick={onCloseEdit} // 使用 props
               className="text-stone-400 hover:text-stone-600 p-1 rounded-full hover:bg-stone-100 transition"
               title="取消"
             >
               <X size={14} />
             </button>
          </div>
          
          <FlowerForm 
            flower={flower} 
            onSuccess={onCloseEdit} // 使用 props
          />
        </div>
      )}
    </div>
  );
}