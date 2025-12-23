'use client';

import { useState } from 'react';
import { Flower } from '@prisma/client';
import AdminFlowerCard from './AdminFlowerCard';
import { deleteFlower } from '@/app/actions/admin';
import { useRouter } from 'next/navigation';

interface FlowerListProps {
  flowers: Flower[];
  onUpdate?: () => void; // 新增：支持传入更新回调
}

export default function FlowerList({ flowers, onUpdate }: FlowerListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const router = useRouter();

  const handleToggleEdit = (id: string) => {
    setEditingId(prev => prev === id ? null : id);
  };

  // 如果父组件没传 onUpdate，默认刷新页面
  const handleCardUpdate = () => {
    if (onUpdate) {
      onUpdate();
    } else {
      router.refresh();
    }
  };

  return (
    // 同步更新为 4 列布局，以匹配 AdminFlowerCard 的弹窗逻辑
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {flowers.map((flower, index) => (
        <AdminFlowerCard 
          key={flower.id} 
          index={index} // 修复：传入索引
          flower={flower} 
          onDelete={deleteFlower}
          onUpdate={handleCardUpdate} // 修复：传入更新回调
          isEditing={editingId === flower.id}
          onToggleEdit={() => handleToggleEdit(flower.id)}
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