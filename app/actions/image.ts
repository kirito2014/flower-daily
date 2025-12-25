'use server'

import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/crypto';
import { revalidatePath } from 'next/cache';

// === 图片配置管理 ===

// 修改：支持传入 key，默认为 'image_config'
export async function getImageConfig(key: string = 'image_config') {
  const config = await prisma.imageConfig.findUnique({
    where: { id: key },
  });
  if (config && config.accessKey) {
    return { ...config, accessKey: decrypt(config.accessKey) };
  }
  return config;
}

export async function saveImageConfig(formData: FormData) {
  // 修改：从 FormData 获取 key
  const key = (formData.get('key') as string) || 'image_config';
  const accessKey = (formData.get('accessKey') as string).trim();
  
  if (!accessKey) throw new Error('Access Key 不能为空');

  const encryptedKey = encrypt(accessKey);

  await prisma.imageConfig.upsert({
    where: { id: key },
    update: { accessKey: encryptedKey, isActive: true },
    create: { id: key, accessKey: encryptedKey, isActive: true },
  });

  revalidatePath('/admin/settings');
}

// === 测试连接 ===
export async function testImageConnection(key: string = 'image_config') {
  const config = await getImageConfig(key);
  if (!config?.accessKey) return { success: false, message: '未找到配置' };

  try {
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
  // 搜索时，我们需要知道使用哪个配置。
  // 简单起见，这里优先尝试 'unsplash'，如果不行则尝试 'image_config'
  // 或者你可以约定必须配置 id='unsplash' 的那条
  let config = await getImageConfig('unsplash');
  if (!config?.accessKey) {
     config = await getImageConfig('image_config');
  }

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
    full: img.urls.regular, 
    photographer: img.user.name,
    downloadLocation: img.links.download_location
  }));
}