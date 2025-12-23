'use client';

import { useState } from 'react';
import { Flower } from '@prisma/client';
import AdminFlowerCard from './AdminFlowerCard';
import { deleteFlower } from '@/app/actions/admin';

interface FlowerListProps {
  flowers: Flower[];
}

export default function FlowerList({ flowers }: FlowerListProps) {
  // 记录当前正在编辑的 ID，null 表示没在编辑
  const [editingId, setEditingId] = useState<string | null>(null);

  // 切换逻辑：如果点的是当前正在编辑的，就关闭；否则打开新的（并自动关闭旧的）
  const handleToggleEdit = (id: string) => {
    setEditingId(prev => prev === id ? null : id);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {flowers.map((flower) => (
        <AdminFlowerCard 
          key={flower.id} 
          flower={flower} 
          onDelete={deleteFlower}
          // === 关键改动 ===
          // 只有当 ID 匹配时，才处于编辑模式
          isEditing={editingId === flower.id}
          // 告诉父组件：我要切换状态
          onToggleEdit={() => handleToggleEdit(flower.id)}
          // 显式关闭
          onCloseEdit={() => setEditingId(null)}
        />
      ))}
      {flowers.length === 0 && (
        <div className="col-span-full py-12 text-center text-stone-400">
          暂无数据，快去录入第一朵花吧 🌸
        </div>
      )}
    </div>
  );
}