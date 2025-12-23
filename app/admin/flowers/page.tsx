import { prisma } from '@/lib/prisma';
import FlowerForm from '@/components/FlowerForm'; // 指向新位置
import { deleteFlower } from '@/app/actions/admin';
import AdminFlowerCard from '@/components/AdminFlowerCard'; // 引入组件

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
          /* 修改点：这里不再写一大堆 div，而是直接使用组件 
             注意：onDelete 直接传入 server action，
             组件内部调用 onDelete(id) 时会自动执行服务端的 deleteFlower(id)
          */
          <AdminFlowerCard 
            key={flower.id} 
            flower={flower} 
            onDelete={deleteFlower} 
          />
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