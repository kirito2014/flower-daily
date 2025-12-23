'use client';

import { useState } from 'react';
import { Flower } from '@prisma/client';
import { Pencil, Trash2, X } from 'lucide-react';
import FlowerForm from '@/components/FlowerForm'; // 指向新位置

interface AdminFlowerCardProps {
  flower: Flower;
  onDelete: (id: string) => void;
}

export default function AdminFlowerCard({ flower, onDelete }: AdminFlowerCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className={`group relative bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden hover:shadow-md transition-all duration-300 ${isEditing ? 'ring-2 ring-blue-500/20' : ''}`}>
      
      {/* 如果正在编辑，图片区域可以保留，也可以隐藏。
         这里保留图片，让用户有上下文对照。
      */}
      <div className="aspect-[4/3] relative bg-stone-100">
        <img 
          src={flower.imageUrl} 
          alt={flower.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
      </div>

      {/* 信息展示区域 (非编辑模式下显示) */}
      {!isEditing && (
        <div className="p-4 animate-in fade-in duration-300">
          <h3 className="font-serif font-bold text-stone-800 text-lg mb-1">{flower.name}</h3>
          <p className="text-stone-500 text-xs line-clamp-1 mb-3 font-mono opacity-80">{flower.language}</p>
          
          <div className="flex flex-wrap gap-2">
             <span className="px-2 py-1 bg-stone-100 text-stone-600 text-[10px] rounded-md">
               {flower.habit}
             </span>
          </div>
        </div>
      )}

      {/* === 编辑表单区域 (编辑模式下显示) === */}
      {isEditing && (
        <div className="p-4 bg-stone-50 border-t border-stone-100 animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex justify-between items-center mb-4">
             <h4 className="text-sm font-bold text-stone-700">编辑花卉信息</h4>
             <button 
               onClick={() => setIsEditing(false)}
               className="text-stone-400 hover:text-stone-600"
               title="取消"
             >
               <X size={16} />
             </button>
          </div>
          
          {/* 复用 FlowerForm，传入当前 flower 数据 */}
          <FlowerForm 
            flower={flower} 
            onSuccess={() => setIsEditing(false)} // 保存成功后自动收起
          />
        </div>
      )}

      {/* === 悬浮操作按钮组 (仅在非编辑模式下显示) === */}
      {!isEditing && (
        <div 
          className="
            absolute top-3 right-3 z-20
            flex items-center 
            bg-white/90 backdrop-blur-md 
            rounded-full 
            shadow-sm border border-stone-200/50 
            overflow-hidden
            opacity-0 group-hover:opacity-100 
            transition-opacity duration-200 ease-out
            w-9 hover:w-[4.6rem] 
            transition-[width] duration-300 ease-in-out
          "
        >
          {/* 修改按钮：点击切换为编辑模式 */}
          <button
            onClick={() => setIsEditing(true)}
            className="
              w-9 h-9 flex items-center justify-center shrink-0
              text-stone-600 
              hover:text-blue-600 hover:bg-blue-50 
              transition-colors
            "
            title="修改花卉"
          >
            <Pencil size={16} />
          </button>

          {/* 删除按钮 */}
          <button
            onClick={() => {
              if (confirm('确定要删除这朵花吗？')) {
                onDelete(flower.id);
              }
            }}
            className="
              w-9 h-9 flex items-center justify-center shrink-0
              text-stone-400 
              hover:text-red-600 hover:bg-red-50 
              border-l border-stone-100
              transition-colors
            "
            title="删除花卉"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
      
    </div>
  );
}