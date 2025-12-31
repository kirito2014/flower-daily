// app/actions/systemConfig.ts
'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export interface SystemConfigData {
  id?: string;
  configKey: string;
  configName: string;
  configValue: string;
  description?: string;
}
 
// 获取所有配置
export async function getSystemConfigs() {
  try {
    const configs = await prisma.systemConfig.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return { success: true, data: configs };
  } catch (error) {
    console.error('Failed to fetch configs:', error);
    return { success: false, error: '获取配置失败' };
  }
}

// 批量获取配置 (供主页使用)
export async function getSystemConfigsByKeys(keys: string[]) {
  try {
    const configs = await prisma.systemConfig.findMany({
      where: { configKey: { in: keys } },
    });
    const configMap: Record<string, string> = {};
    configs.forEach(c => {
      configMap[c.configKey] = c.configValue;
    });
    return configMap;
  } catch (error) {
    return {};
  }
}

// 创建或更新配置
export async function upsertSystemConfig(data: SystemConfigData) {
  try {
    const { id, configKey, ...rest } = data;

    if (id) {
      // 更新
      await prisma.systemConfig.update({
        where: { id },
        data: { configKey, ...rest },
      });
    } else {
      // 新增前查重
      const existing = await prisma.systemConfig.findUnique({
        where: { configKey },
      });
      if (existing) {
        return { success: false, error: '配置键名 (Key) 已存在' };
      }

      await prisma.systemConfig.create({
        data: { configKey, ...rest },
      });
    }

    revalidatePath('/admin/config'); // 刷新配置页
    revalidatePath('/'); // 刷新主页以应用更改
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: '保存失败' };
  }
}

// 删除配置
export async function deleteSystemConfig(id: string) {
  try {
    await prisma.systemConfig.delete({
      where: { id },
    });
    revalidatePath('/admin/config');
    return { success: true };
  } catch (error) {
    return { success: false, error: '删除失败' };
  }
}