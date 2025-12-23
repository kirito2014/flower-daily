'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword, validatePasswordComplexity } from '@/lib/crypto';

export async function login(prevState: any, formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const newPassword = formData.get('newPassword') as string;

  // 1. 自动初始化 admin
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    await prisma.user.create({
      data: {
        username: 'admin',
        password: hashPassword('admin123'),
        isFirstLogin: true,
        // admin 默认不设角色ID，代码里特殊判断为超级管理员
      },
    });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  
  if (!user || !verifyPassword(password, user.password)) {
    return { success: false, error: '用户名或密码错误' };
  }

  // === 新增：检查是否被禁用 ===
  if (!user.isActive) {
    return { success: false, error: '账号已被禁用，请联系管理员' };
  }

  // 3. 首次登录检查
  if (user.isFirstLogin) {
    if (!newPassword) {
      return { success: false, requireChange: true, message: '首次登录，请设置新密码' };
    }
    if (!validatePasswordComplexity(newPassword)) {
      return { success: false, requireChange: true, error: '密码需超过8位，且包含大小写字母和特殊字符' };
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashPassword(newPassword), isFirstLogin: false },
    });
  }

  // === 新增：更新最后登录时间 ===
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() }
  });

  // 4. 写入 Cookie (存储 username 以便 Layout 获取权限)
  const cookieStore = await cookies();
  cookieStore.set('admin_session', user.username, { // 存 username 而不是简单的 'true'
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24,
    path: '/',
  });

  return { success: true };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
  redirect('/login');
}