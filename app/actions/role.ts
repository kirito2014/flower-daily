'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// 获取所有角色
export async function getRoles() {
  return await prisma.role.findMany({ orderBy: { createdAt: 'desc' } });
}

// 创建角色
export async function createRole(formData: FormData) {
  const name = formData.get('name') as string;
  const code = formData.get('code') as string;
  const description = formData.get('description') as string;
  // 获取所有选中的权限 (menus)
  const permissions = JSON.stringify(formData.getAll('permissions'));

  await prisma.role.create({
    data: { name, code, description, permissions }
  });
  revalidatePath('/admin/roles');
}

// 更新角色
export async function updateRole(id: string, formData: FormData) {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const permissions = JSON.stringify(formData.getAll('permissions'));

  await prisma.role.update({
    where: { id },
    data: { name, description, permissions }
  });
  revalidatePath('/admin/roles');
}

// 删除角色
export async function deleteRole(id: string) {
  // 检查是否有用户正在使用该角色
  const count = await prisma.user.count({ where: { roleId: id } });
  if (count > 0) {
    throw new Error('该角色下尚有用户，无法删除');
  }
  await prisma.role.delete({ where: { id } });
  revalidatePath('/admin/roles');
}