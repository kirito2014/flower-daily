// app/admin/flowers/page.tsx
import { prisma } from '@/lib/prisma';
import FlowerForm from '@/components/FlowerForm';
// 引入新组件
import FlowerList from '@/components/FlowerList';

export default async function FlowersPage() {
  const flowers = await prisma.flower.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-serif text-stone-800">花卉库 ({flowers.length})</h2>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
        <h3 className="text-lg font-medium mb-4 text-stone-700">录入新花卉</h3>
        <FlowerForm />
      </div>

      {/* 使用新的列表组件接管渲染 */}
      <FlowerList flowers={flowers} />
    </div>
  );
}