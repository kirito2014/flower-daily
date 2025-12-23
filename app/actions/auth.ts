'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyPassword } from '@/lib/crypto';

export async function login(formData: FormData) {
  const password = formData.get('password') as string;
  const storedHash = process.env.ADMIN_PASSWORD || '';

  // 使用加密工具进行比对
  if (verifyPassword(password, storedHash)) {
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

// 新增：登出逻辑
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
  // 登出后强制跳转回登录页
  redirect('/login');
}