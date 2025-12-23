import { prisma } from '@/lib/prisma';
import FlowerForm from './flower-form'; // 下面会创建这个组件
import { Trash2 } from 'lucide-react';
import { deleteFlower } from '@/app/actions/admin';

export default async function FlowersPage() {
  // 获取现有花卉列表
  const flowers = await prisma.flower.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-serif text-stone-800">花卉库 ({flowers.length})</h2>
      </div>

      {/* 新增区域 */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
        <h3 className="text-lg font-medium mb-4 text-stone-700">录入新花卉</h3>
        <FlowerForm />
      </div>

      {/* 列表区域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {flowers.map((flower) => (
          <div key={flower.id} className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition border border-stone-100">
            <div className="aspect-[4/3] relative">
              <img src={flower.imageUrl} alt={flower.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <form action={deleteFlower.bind(null, flower.id)}>
                   <button className="p-2 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-red-500 transition">
                     <Trash2 size={20} />
                   </button>
                </form>
              </div>
            </div>
            <div className="p-4">
              <h4 className="text-lg font-serif font-bold text-stone-800">{flower.name}</h4>
              <p className="text-xs text-stone-400 mt-1 truncate">{flower.language}</p>
              <div className="mt-3 text-xs bg-stone-100 inline-block px-2 py-1 rounded text-stone-600">
                {flower.habit}
              </div>
            </div>
          </div>
        ))}
        {flowers.length === 0 && (
          <div className="col-span-full py-12 text-center text-stone-400">
            暂无数据，快去录入第一朵花吧 🌸
          </div>
        )}
      </div>
    </div>
  );
}