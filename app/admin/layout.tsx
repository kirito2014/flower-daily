// app/admin/layout.tsx
import Link from 'next/link';
import { Settings, Flower, LayoutDashboard, Home, LogOut } from 'lucide-react'; // 引入 LogOut 图标
import { logout } from '@/app/actions/auth'; // 引入登出逻辑

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-stone-100">
      {/* Sidebar (保持不变) */}
      <aside className="w-64 bg-white border-r border-stone-200 p-6 flex flex-col fixed h-full overflow-y-auto z-10">
        <h1 className="text-2xl font-serif font-bold text-stone-800 mb-8 flex items-center gap-2 px-2">
          <LayoutDashboard className="w-6 h-6" />
          控制台
        </h1>
        
        <nav className="space-y-2 flex-1">
          {/* 返回主页按钮 */}
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

        {/* 底部版权信息 */}
        <div className="mt-auto px-4 py-4 text-xs text-stone-300">
            Flower Daily Admin
        </div>
      </aside>

      {/* Main Content (修改结构以支持 Header) */}
      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        
        {/* === 新增：顶部 Header (包含登出按钮) === */}
        <header className="sticky top-0 z-20 px-8 py-4 flex justify-end items-center bg-stone-100/80 backdrop-blur-sm">
           <form action={logout}>
             <button 
               type="submit"
               className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 shadow-sm rounded-full text-stone-600 text-sm font-medium hover:text-red-600 hover:border-red-100 hover:bg-red-50 transition-all active:scale-95"
               title="退出当前账号"
             >
               <LogOut size={14} />
               <span>退出登录</span>
             </button>
           </form>
        </header>

        {/* 实际页面内容区域 */}
        <div className="flex-1 px-8 pb-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}