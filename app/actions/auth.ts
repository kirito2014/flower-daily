'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const password = formData.get('password') as string;

  // 比对环境变量中的密码
  if (password === process.env.ADMIN_PASSWORD) {
    // 登录成功：设置 Cookie (有效期 1 天)
    // 注意：await cookies() 是 Next.js 15 的写法，如果是 14 请直接用 cookies()
    const cookieStore = await cookies();
    cookieStore.set('admin_session', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });
    
    return { success: true };
  }

  return { success: false, error: '密码错误' };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
  redirect('/');
}