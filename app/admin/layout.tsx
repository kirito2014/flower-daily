// app/admin/layout.tsx
import Link from 'next/link';
import { Settings, Flower, LayoutDashboard, Home } from 'lucide-react'; // 引入 Home 图标

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-stone-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-stone-200 p-6 flex flex-col fixed h-full overflow-y-auto z-10">
        <h1 className="text-2xl font-serif font-bold text-stone-800 mb-8 flex items-center gap-2 px-2">
          <LayoutDashboard className="w-6 h-6" />
          控制台
        </h1>
        
        <nav className="space-y-2 flex-1">
          {/* 新增：返回主页按钮 */}
          <Link 
            href="/" 
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition group"
            title="返回前台展示页"
          >
            <Home className="w-5 h-5 text-stone-400 group-hover:text-stone-900 transition-colors" />
            <span className="font-medium">返回主页</span>
          </Link>

          <div className="h-px bg-stone-100 my-2 mx-2"></div> {/* 分割线 */}

          <Link href="/admin/flowers" className="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition group">
            <Flower className="w-5 h-5 text-stone-400 group-hover:text-stone-900 transition-colors" />
            <span className="font-medium">花卉管理</span>
          </Link>
          
          <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition group">
            <Settings className="w-5 h-5 text-stone-400 group-hover:text-stone-900 transition-colors" />
            <span className="font-medium">系统配置</span>
          </Link>
        </nav>

        {/* 底部版权信息 (可选) */}
        <div className="mt-auto px-4 py-4 text-xs text-stone-300">
            Flower Daily Admin
        </div>
      </aside>

      {/* Main Content (左侧留出 sidebar 宽度的 margin) */}
      <main className="flex-1 p-8 ml-64 overflow-y-auto min-h-screen">
        {children}
      </main>
    </div>
  );
}