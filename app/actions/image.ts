'use server'

import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/crypto';
import { revalidatePath } from 'next/cache';

// === 图片配置管理 ===
export async function getImageConfig() {
  const config = await prisma.imageConfig.findUnique({
    where: { id: 'image_config' },
  });
  if (config && config.accessKey) {
    return { ...config, accessKey: decrypt(config.accessKey) };
  }
  return config;
}

export async function saveImageConfig(formData: FormData) {
  const accessKey = (formData.get('accessKey') as string).trim();
  
  if (!accessKey) throw new Error('Access Key 不能为空');

  const encryptedKey = encrypt(accessKey);

  await prisma.imageConfig.upsert({
    where: { id: 'image_config' },
    update: { accessKey: encryptedKey },
    create: { id: 'image_config', accessKey: encryptedKey },
  });

  revalidatePath('/admin/settings');
}

// === 测试连接 ===
export async function testImageConnection() {
  const config = await getImageConfig();
  if (!config?.accessKey) return { success: false, message: '未找到配置' };

  try {
    // 尝试搜索一张图片来测试 Key 是否有效
    const res = await fetch(`https://api.unsplash.com/search/photos?page=1&query=flower&per_page=1`, {
      headers: {
        'Authorization': `Client-ID ${config.accessKey}`
      }
    });
    
    if (res.status === 200) {
      return { success: true, message: 'Unsplash 连接成功！' };
    } else {
      const err = await res.json();
      return { success: false, message: `连接失败: ${err.errors?.join(', ') || res.statusText}` };
    }
  } catch (error: any) {
    return { success: false, message: `网络错误: ${error.message}` };
  }
}

// === 搜索 Unsplash ===
export async function searchUnsplashImages(query: string, page: number = 1) {
  const config = await getImageConfig();
  if (!config?.accessKey) throw new Error('请先在系统设置中配置 Unsplash');

  const res = await fetch(`https://api.unsplash.com/search/photos?page=${page}&query=${encodeURIComponent(query)}&per_page=12`, {
    headers: {
      'Authorization': `Client-ID ${config.accessKey}`
    }
  });

  if (!res.ok) {
    throw new Error('搜索失败，请检查配置或网络');
  }

  const data = await res.json();
  return data.results.map((img: any) => ({
    id: img.id,
    thumb: img.urls.small,
    full: img.urls.regular, // 使用 regular 尺寸作为主图
    photographer: img.user.name,
    downloadLocation: img.links.download_location // 按照规范，触发下载时应打点，此处简化
  }));
}