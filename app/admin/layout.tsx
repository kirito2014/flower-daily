import Link from 'next/link';
import { Settings, Flower, LayoutDashboard, Home, LogOut, Users, Shield, User } from 'lucide-react';
import { logout } from '@/app/actions/auth';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import HitokotoBox from '@/components/HitokotoBox'; // 引入新组件

// 辅助函数：获取一言 (Server Side Fetch - 初始数据)
async function getHitokoto() {
  try {
    // c=d 代表文学类，encode=text 返回纯文本
    const res = await fetch('https://v1.hitokoto.cn/?c=d&encode=text', { 
      next: { revalidate: 60 }, // 60秒缓存，避免频繁刷新
      method: 'GET'
    });
    if (!res.ok) return null;
    return await res.text();
  } catch (e) {
    return null;
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. 获取当前登录用户信息
  const cookieStore = await cookies();
  const username = cookieStore.get('admin_session')?.value;
  
  let allowedMenus: string[] = [];
  let user = null;

  if (username) {
    user = await prisma.user.findUnique({
      where: { username },
      include: { role: true }
    });

    if (user) {
      if (user.username === 'admin') {
        allowedMenus = ['flowers', 'users', 'roles', 'settings'];
      } else if (user.role?.permissions) {
        allowedMenus = JSON.parse(user.role.permissions);
      }
    }
  }

  // 2. 并行获取一言初始值
  const hitokoto = await getHitokoto();

  const MENU_ITEMS = [
    { code: 'flowers', label: '花卉管理', href: '/admin/flowers', icon: Flower },
    { code: 'users', label: '用户管理', href: '/admin/users', icon: Users },
    { code: 'roles', label: '角色管理', href: '/admin/roles', icon: Shield },
    { code: 'settings', label: '系统配置', href: '/admin/settings', icon: Settings },
  ];

  // 格式化当前时间
  const currentTime = new Date().toLocaleString('zh-CN', { 
    year: 'numeric', month: '2-digit', day: '2-digit', 
    hour: '2-digit', minute: '2-digit' 
  });

  return (
    <div className="min-h-screen flex bg-stone-100">
      <aside className="w-64 bg-white border-r border-stone-200 p-6 flex flex-col fixed h-full overflow-y-auto z-10">
        <h1 className="text-2xl font-serif font-bold text-stone-800 mb-8 flex items-center gap-2 px-2">
          <LayoutDashboard className="w-6 h-6" />
          控制台
        </h1>
        
        <nav className="space-y-2 flex-1">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition group" title="返回前台展示页">
            <Home className="w-5 h-5 text-stone-400 group-hover:text-stone-900 transition-colors" />
            <span className="font-medium">返回主页</span>
          </Link>

          <div className="h-px bg-stone-100 my-2 mx-2"></div>

          {MENU_ITEMS.map((item) => {
            if (allowedMenus.includes(item.code)) {
              return (
                <Link key={item.code} href={item.href} className="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition group">
                  <item.icon className="w-5 h-5 text-stone-400 group-hover:text-stone-900 transition-colors" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            }
            return null;
          })}
        </nav>

        <div className="mt-auto px-4 py-4 border-t border-stone-100">
            <div className="text-xs font-bold text-stone-700 mb-1">{user?.role?.name || '管理员'}</div>
            <div className="text-[10px] text-stone-400">@{user?.username}</div>
        </div>
      </aside>

      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-20 px-8 py-4 flex justify-end items-center bg-stone-100/80 backdrop-blur-sm gap-4">
           
           {/* === 改动：使用 HitokotoBox 客户端组件 === */}
           <HitokotoBox initialText={hitokoto} />

           {/* 当前用户 */}
           <div className="flex items-center gap-2 text-sm text-stone-500 bg-white px-4 h-[38px] rounded-full border border-stone-200 shadow-sm">
             <User size={14} className="text-stone-400" />
             <span>当前用户：<span className="font-bold text-stone-700">{user?.username || '未知用户'}</span></span>
           </div>

           <form action={logout}>
             <button type="submit" className="flex items-center gap-2 px-4 h-[38px] bg-white border border-stone-200 shadow-sm rounded-full text-stone-600 text-sm font-medium hover:text-red-600 hover:border-red-100 hover:bg-red-50 transition-all active:scale-95">
               <LogOut size={14} />
               <span>退出登录</span>
             </button>
           </form>
        </header>

        <div className="flex-1 px-8 pb-8 overflow-y-auto">
          {children}
        </div>

        {/* 底部版权信息 */}
        <footer className="py-4 text-center border-t border-stone-200 bg-stone-50/50 mt-auto">
           <div className="flex flex-col items-center justify-center gap-1 text-[10px] text-stone-400 font-mono">
              <p>Copyright © {new Date().getFullYear()} Flower Daily. All Rights Reserved.</p>
              <div className="flex items-center gap-3 opacity-80">
                 <span>Version 1.1.0</span>
                 <span className="w-px h-2 bg-stone-300"></span>
                 <span>{currentTime}</span>
              </div>
           </div>
        </footer>
      </main>
    </div>
  );
}