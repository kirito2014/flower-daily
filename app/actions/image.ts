'use server'

import { prisma } from '@/lib/prisma';
import { encrypt, decrypt } from '@/lib/crypto';
import { revalidatePath } from 'next/cache';

// === 图片配置管理 ===

// 获取图片配置
export async function getImageConfig(key: string) {
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

// 保存图片配置
export async function saveImageConfig(formData: FormData) {
  const key = (formData.get('key') as string) || 'image_config';
  // === 新增：获取名称 ===
  const name = (formData.get('name') as string) || 'Unsplash';
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
    // 如果是新建且没有 Key，则报错；如果是更新且没填 Key，沿用旧的
    if (!existingConfig) throw new Error('Access Key 不能为空');
    encryptedAccessKey = existingConfig.accessKey;
  }

  // 3. 处理 Secret Key 加密
  if (secretKey) {
    encryptedSecretKey = encrypt(secretKey);
  } else if (existingConfig?.secretKey) {
    encryptedSecretKey = existingConfig.secretKey;
  } 

  // 4. 保存配置 (保持 isActive 原状态，如果是新建则默认为 false)
  await prisma.imageConfig.upsert({
    where: { id: key },
    // === 修改：更新时包含 name ===
    update: {
      name,
      accessKey: encryptedAccessKey,
      secretKey: encryptedSecretKey,
      // @ts-ignore
      baseUrl: baseUrl,
      // @ts-ignore
      redirectUri: redirectUri,
    },
    // === 修改：创建时包含 name ===
    create: {
      id: key,
      name,
      accessKey: encryptedAccessKey,
      secretKey: encryptedSecretKey,
      // @ts-ignore
      baseUrl: baseUrl,
      // @ts-ignore
      redirectUri: redirectUri,
      isActive: false, // 新建默认不激活
    },
  });

  revalidatePath('/admin/settings');
}

// 切换图片服务激活状态 (互斥逻辑)
export async function toggleImageProvider(key: string, isActive: boolean) {
  if (!isActive) {
    // 关闭操作
    await prisma.imageConfig.update({
      where: { id: key },
      data: { isActive: false }
    });
  } else {
    // 开启操作，使用事务：先关闭所有，再开启当前
    await prisma.$transaction(async (tx) => {
      await tx.imageConfig.updateMany({ data: { isActive: false } });
      await tx.imageConfig.update({
        where: { id: key },
        data: { isActive: true }
      });
    });
  }
  revalidatePath('/admin/settings');
}

// 删除图片配置
export async function deleteImageConfig(key: string) {
  await prisma.imageConfig.delete({ where: { id: key } });
  revalidatePath('/admin/settings');
}

// === 测试连接 ===
export async function testImageConnection(key: string) {
  const config = await getImageConfig(key);
  if (!config?.accessKey) return { success: false, message: '未找到配置或 Access Key 缺失' };

  // @ts-ignore
  const baseUrl = config.baseUrl || 'https://api.unsplash.com';

  try {
    const res = await fetch(`${baseUrl}/search/photos?page=1&query=flower&per_page=1`, {
      headers: {
        'Authorization': `Client-ID ${config.accessKey}`
      }
    });
    
    if (res.status === 200) {
      return { success: true, message: '连接成功！' };
    } else {
      let msg = res.statusText;
      try {
        const err = await res.json();
        msg = err.errors?.join(', ') || msg;
      } catch (e) {}
      
      if (res.status === 401) msg = "401 鉴权失败：请检查 Access Key";
      return { success: false, message: `连接失败 (${res.status}): ${msg}` };
    }
  } catch (error: any) {
    console.error('Image Service Error:', error);
    return { success: false, message: `网络错误: ${error.message} (请检查 Base URL)` };
  }
}

// === 搜索 Unsplash ===
export async function searchUnsplashImages(
  query: string, 
  page: number = 1, 
  orientation?: string, 
  license?: string
) {
  // 优先获取当前激活的配置
  const activeConfig = await prisma.imageConfig.findFirst({
    where: { isActive: true }
  });
  
  let config = activeConfig;
  
  // 兜底逻辑：如果没有激活的，尝试找 'unsplash' 或 'image_config'
  if (!config) {
     config = await prisma.imageConfig.findUnique({ where: { id: 'unsplash' } });
  }
  if (!config) {
     config = await prisma.imageConfig.findUnique({ where: { id: 'image_config' } });
  }

  if (!config?.accessKey) throw new Error('请先在系统设置中配置并激活图片服务');
  
  const decryptedAccessKey = decrypt(config.accessKey);

  // @ts-ignore
  const baseUrl = config.baseUrl || 'https://api.unsplash.com';
  // @ts-ignore
  const redirectUri = config.redirectUri || '';

  try {
    // 构造查询参数
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('query', query);
    params.append('per_page', '30'); 
    
    if (orientation && orientation !== '') {
      params.append('orientation', orientation);
    }
    if (license && license !== '') {
      params.append('license', license);
    }

    const res = await fetch(`${baseUrl}/search/photos?${params.toString()}`, {
      headers: {
        'Authorization': `Client-ID ${decryptedAccessKey}`
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
      htmlLink: img.links.html, 
      photographerUrl: img.user.links.html, 
      downloadLocation: img.links.download_location,
      redirectUri: redirectUri 
    }));
  } catch (error: any) {
    console.error('Search Error:', error);
    throw new Error('搜索图片失败，请检查网络配置或代理地址');
  }
}