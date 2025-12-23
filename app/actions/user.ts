'use server';

import { prisma } from '@/lib/prisma';
import { hashPassword, validatePasswordComplexity } from '@/lib/crypto';
import { revalidatePath } from 'next/cache';

// 获取用户列表 (带角色信息)
export async function getUsers() {
  return await prisma.user.findMany({
    include: { role: true }, // 连表查询角色
    orderBy: { createdAt: 'desc' }
  });
}

// 新增用户
export async function createUser(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const roleId = formData.get('roleId') as string;

  if (!validatePasswordComplexity(password)) {
    throw new Error('密码复杂度不足');
  }

  // 检查用户名是否存在
  const exist = await prisma.user.findUnique({ where: { username } });
  if (exist) throw new Error('用户名已存在');

  await prisma.user.create({
    data: {
      username,
      password: hashPassword(password),
      roleId: roleId || null,
      isFirstLogin: true // 新增用户默认需要改密码
    }
  });
  revalidatePath('/admin/users');
}

// 修改用户 (角色)
export async function updateUser(id: string, formData: FormData) {
  const roleId = formData.get('roleId') as string;
  
  // admin 账号不允许修改角色 (防止自己把自己锁死)
  const user = await prisma.user.findUnique({ where: { id } });
  if (user?.username === 'admin') {
     // admin 默认拥有所有权限，不需要通过角色控制，或者强制保持超级管理员
  }

  await prisma.user.update({
    where: { id },
    data: { roleId: roleId || null }
  });
  revalidatePath('/admin/users');
}

// 切换用户禁用状态
export async function toggleUserStatus(id: string, currentStatus: boolean) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (user?.username === 'admin') {
    throw new Error('超级管理员不可禁用');
  }

  await prisma.user.update({
    where: { id },
    data: { isActive: !currentStatus }
  });
  revalidatePath('/admin/users');
}

// 删除用户
export async function deleteUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (user?.username === 'admin') {
    throw new Error('超级管理员不可删除');
  }
  await prisma.user.delete({ where: { id } });
  revalidatePath('/admin/users');
}

// 重置密码 (保持原有逻辑)
export async function resetUserPassword(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashPassword('admin123'),
      isFirstLogin: true,
    },
  });
  revalidatePath('/admin/users');
}

// 修改密码 (保持原有逻辑)
export async function updateUserPassword(userId: string, newPassword: string) {
  if (!validatePasswordComplexity(newPassword)) {
    throw new Error('密码复杂度不足：需超过8位，含大小写及特殊字符');
  }
  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashPassword(newPassword),
      isFirstLogin: false,
    },
  });
  revalidatePath('/admin/users');
}