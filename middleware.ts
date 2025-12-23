import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const adminSession = request.cookies.get('admin_session');
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');
  const isAdminPage = request.nextUrl.pathname.startsWith('/admin');

  // 1. 保护后台：如果访问 /admin 且没有 Session -> 强制去登录
  if (isAdminPage && !adminSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. 优化体验：如果已登录 且 访问 /login -> 强制回后台 (提示已登录)
  if (isLoginPage && adminSession) {
    return NextResponse.redirect(new URL('/admin/flowers', request.url));
  }

  return NextResponse.next();
}

// 匹配规则：拦截 /admin 和 /login 相关路径
export const config = {
  matcher: ['/admin/:path*', '/login'],
};