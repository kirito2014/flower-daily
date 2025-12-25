'use server'

import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/crypto';
import { revalidatePath } from 'next/cache';

// === 图片配置管理 ===

export async function getImageConfig(key: string = 'image_config') {
  const config = await prisma.imageConfig.findUnique({
    where: { id: key },
  });
  
  if (config) {
    return {
      ...config,
      // 解密敏感字段
      accessKey: config.accessKey ? decrypt(config.accessKey) : '',
      secretKey: config.secretKey ? decrypt(config.secretKey) : '',
    };
  }
  return config;
}

export async function saveImageConfig(formData: FormData) {
  const key = (formData.get('key') as string) || 'image_config';
  const accessKey = (formData.get('accessKey') as string).trim();
  const secretKey = (formData.get('secretKey') as string).trim();
  const baseUrl = (formData.get('baseUrl') as string || '').trim();
  const redirectUri = (formData.get('redirectUri') as string || '').trim();

  // 1. 检查是否存在旧配置
  const existingConfig = await prisma.imageConfig.findUnique({ where: { id: key } });
  
  let encryptedAccessKey = '';
  let encryptedSecretKey = '';

  // 2. 处理 Access Key 加密 (如果有输入则更新，否则保留)
  if (accessKey) {
    encryptedAccessKey = encrypt(accessKey);
  } else if (existingConfig?.accessKey) {
    encryptedAccessKey = existingConfig.accessKey;
  } else {
    throw new Error('Access Key 不能为空');
  }

  // 3. 处理 Secret Key 加密 (Unsplash 必须项)
  if (secretKey) {
    encryptedSecretKey = encrypt(secretKey);
  } else if (existingConfig?.secretKey) {
    encryptedSecretKey = existingConfig.secretKey;
  } 
  // Secret Key 为空时视业务需求，这里暂不强制抛错，但建议填写

  // 4. 构造更新数据
  const data: any = { 
    isActive: true,
  };

  await prisma.imageConfig.upsert({
    where: { id: key },
    update: {
      accessKey: encryptedAccessKey,
      secretKey: encryptedSecretKey,
      // @ts-ignore: 请在 prisma schema 中添加 baseUrl String?
      baseUrl: baseUrl,
      // @ts-ignore: 请在 prisma schema 中添加 redirectUri String?
      redirectUri: redirectUri,
      isActive: true,
    },
    create: {
      id: key,
      accessKey: encryptedAccessKey,
      secretKey: encryptedSecretKey,
      // @ts-ignore
      baseUrl: baseUrl,
      // @ts-ignore
      redirectUri: redirectUri,
      isActive: true,
    },
  });

  revalidatePath('/admin/settings');
}

// === 测试连接 ===
export async function testImageConnection(key: string = 'image_config') {
  const config = await getImageConfig(key);
  if (!config?.accessKey) return { success: false, message: '未找到配置' };

  // @ts-ignore
  const baseUrl = config.baseUrl || 'https://api.unsplash.com';

  try {
    const res = await fetch(`${baseUrl}/search/photos?page=1&query=flower&per_page=1`, {
      headers: {
        'Authorization': `Client-ID ${config.accessKey}`
      }
    });
    
    if (res.status === 200) {
      return { success: true, message: 'Unsplash 连接成功！' };
    } else {
      let msg = res.statusText;
      try {
        const err = await res.json();
        msg = err.errors?.join(', ') || msg;
      } catch (e) {}
      return { success: false, message: `连接失败 (${res.status}): ${msg}` };
    }
  } catch (error: any) {
    console.error('Image Service Error:', error);
    return { success: false, message: `网络错误: ${error.message} (请检查 Base URL)` };
  }
}

// === 搜索 Unsplash ===
export async function searchUnsplashImages(query: string, page: number = 1) {
  let config = await getImageConfig('unsplash');
  if (!config?.accessKey) {
     config = await getImageConfig('image_config');
  }

  if (!config?.accessKey) throw new Error('请先在系统设置中配置 Unsplash');

  // @ts-ignore
  const baseUrl = config.baseUrl || 'https://api.unsplash.com';
  // @ts-ignore
  const redirectUri = config.redirectUri || '';

  try {
    const res = await fetch(`${baseUrl}/search/photos?page=${page}&query=${encodeURIComponent(query)}&per_page=12`, {
      headers: {
        'Authorization': `Client-ID ${config.accessKey}`
      }
    });

    if (!res.ok) {
      throw new Error(`API 请求失败: ${res.statusText}`);
    }

    const data = await res.json();
    return data.results.map((img: any) => ({
      id: img.id,
      thumb: img.urls.small,
      full: img.urls.regular, 
      photographer: img.user.name,
      htmlLink: img.links.html, // Unsplash 原文链接 (图片页)
      photographerUrl: img.user.links.html, // === 新增：摄影师主页链接 ===
      // 如果前端点击需要跳转到 redirectUri，可以在这里处理，或者直接返回 redirectUri 让前端拼接
      downloadLocation: img.links.download_location,
      redirectUri: redirectUri 
    }));
  } catch (error: any) {
    console.error('Search Error:', error);
    throw new Error('搜索图片失败，请检查网络配置或代理地址');
  }
}