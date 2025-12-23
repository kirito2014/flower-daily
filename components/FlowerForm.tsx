'use client';

import { createFlower, updateFlower } from '@/app/actions/admin';
import { Flower } from '@prisma/client';
import { Save, Loader2 } from 'lucide-react';
import { useRef, useState } from 'react';

// 定义 props，flower 是可选的
interface FlowerFormProps {
  flower?: Flower;           // 如果有值，说明是编辑模式
  onSuccess?: () => void;    // 操作成功后的回调（比如关闭编辑框）
}

export default function FlowerForm({ flower, onSuccess }: FlowerFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);

  // 根据是否有 flower 决定是“创建”还是“更新”
  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      if (flower) {
        // 编辑模式：调用 updateFlower
        await updateFlower(flower.id, formData);
      } else {
        // 新增模式：调用 createFlower
        await createFlower(formData);
        formRef.current?.reset(); // 新增成功后清空表单
      }
      
      // 如果有回调（比如关闭编辑窗口），则执行
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error(error);
      alert('操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form 
      ref={formRef}
      action={handleSubmit}
      className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-stone-600">花名</label>
          <input 
            name="name" 
            required 
            defaultValue={flower?.name} // 回填数据
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-stone-400 transition"
            placeholder="例如：红牡丹"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-stone-600">花语</label>
          <input 
            name="language" 
            required 
            defaultValue={flower?.language} // 回填数据
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-stone-400 transition"
            placeholder="例如：雍容华贵"
          />
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className="text-sm font-medium text-stone-600">图片链接</label>
          <input 
            name="imageUrl" 
            required 
            defaultValue={flower?.imageUrl} // 回填数据
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-stone-400 transition"
            placeholder="https://..."
          />
        </div>
        <div className="space-y-1 md:col-span-2">
          <label className="text-sm font-medium text-stone-600">习性标签</label>
          <input 
            name="habit" 
            required 
            defaultValue={flower?.habit} // 回填数据
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-stone-400 transition"
            placeholder="例如：喜阳、耐寒"
          />
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button 
          type="submit" 
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 active:scale-95 transition disabled:opacity-70"
        >
          {loading ? <Loader2 className="animate-spin w-4 h-4"/> : <Save className="w-4 h-4"/>}
          {flower ? '保存修改' : '立即录入'}
        </button>
      </div>
    </form>
  );
}