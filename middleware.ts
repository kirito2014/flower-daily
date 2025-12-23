import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 检查是否访问后台路径
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const adminSession = request.cookies.get('admin_session');

    // 如果没有 Cookie，重定向到登录页
    if (!adminSession) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

// 匹配规则：仅拦截 /admin 开头的路径
export const config = {
  matcher: '/admin/:path*',
};