import Link from 'next/link';
import { Settings, Flower, LayoutDashboard } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-stone-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-stone-200 p-6 flex flex-col">
        <h1 className="text-2xl font-serif font-bold text-stone-800 mb-8 flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6" />
          控制台
        </h1>
        
        <nav className="space-y-2 flex-1">
          <Link href="/admin/flowers" className="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition">
            <Flower className="w-5 h-5" />
            花卉管理
          </Link>
          <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition">
            <Settings className="w-5 h-5" />
            系统配置
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}