'use server'

import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { revalidatePath } from 'next/cache';
import { encrypt, decrypt } from '@/lib/crypto';

// === 1. 系统配置 (AI) 相关 ===

// 获取指定key的配置
export async function getSystemConfig(key: string = 'global_config') {
  const config = await prisma.appConfig.findUnique({ where: { id: key } });
  if (config && config.apiKey) return { ...config, apiKey: decrypt(config.apiKey) };
  return config;
}

// 获取当前激活的AI配置
export async function getActiveSystemConfig() {
  const config = await prisma.appConfig.findFirst({
    where: { isActive: true },
  });
  if (config && config.apiKey) {
    return { ...config, apiKey: decrypt(config.apiKey) };
  }
  return null;
}

// 保存配置 (只保存，不激活)
export async function saveSystemConfig(formData: FormData) {
  const key = (formData.get('key') as string) || 'global_config';
  const baseUrl = (formData.get('baseUrl') as string).trim();
  const apiKey = (formData.get('apiKey') as string).trim();
  const modelName = (formData.get('modelName') as string).trim();

  if (/[^\x00-\x7F]/.test(apiKey)) throw new Error('API Key 包含非法字符');
  const encryptedKey = encrypt(apiKey);

  // 仅更新或创建，保持原有的 isActive 状态 (如果是新建则默认为 false)
  // 如果当前已经是激活状态，保存后依然激活；如果未激活，保存后依然未激活，需要手动点击激活按钮
  const exist = await prisma.appConfig.findUnique({ where: { id: key } });

  await prisma.appConfig.upsert({
    where: { id: key },
    update: { baseUrl, apiKey: encryptedKey, modelName },
    create: { id: key, baseUrl, apiKey: encryptedKey, modelName, isActive: false },
  });

  revalidatePath('/admin/settings');
}

// 切换激活状态 (互斥逻辑)
export async function toggleAIProvider(key: string, isActive: boolean) {
  if (!isActive) {
    // 如果是关闭操作，直接设为 false
    await prisma.appConfig.update({
      where: { id: key },
      data: { isActive: false }
    });
  } else {
    // 如果是开启操作，使用事务：先关闭所有，再开启当前
    await prisma.$transaction(async (tx) => {
      await tx.appConfig.updateMany({ data: { isActive: false } });
      await tx.appConfig.update({
        where: { id: key },
        data: { isActive: true }
      });
    });
  }
  revalidatePath('/admin/settings');
}

// 删除配置
export async function deleteSystemConfig(key: string) {
  await prisma.appConfig.delete({ where: { id: key } });
  revalidatePath('/admin/settings');
}

// 测试 AI 连接
export async function testAIConnection(key: string) {
  const config = await getSystemConfig(key);
  if (!config?.apiKey) return { success: false, message: '配置未保存或 API Key 缺失' };
  
  try {
    const openai = new OpenAI({ baseURL: config.baseUrl, apiKey: config.apiKey });
    await openai.chat.completions.create({
      messages: [{ role: "user", content: "Hi" }],
      model: config.modelName,
      max_tokens: 5,
    });
    return { success: true, message: `连接成功！已连通 ${config.modelName}` };
  } catch (error: any) {
    console.error("AI Connection Test Error:", error);
    let msg = error.message;
    if (error.status === 401) msg = "401 鉴权失败：请检查 API Key 是否正确";
    if (error.status === 404) msg = "404 接口未找到：请检查 Base URL 是否正确 (通常需以 /v1 结尾)";
    return { success: false, message: `连接失败: ${msg}` };
  }
}

// === 2. 图片配置 (Image) 相关 (在 admin.ts 中统一处理) ===

// 获取图片配置
export async function getImageConfig(key: string) {
  const config = await prisma.imageConfig.findUnique({ where: { id: key } });
  if (config) {
    return {
      ...config,
      accessKey: config.accessKey ? decrypt(config.accessKey) : '',
      secretKey: config.secretKey ? decrypt(config.secretKey) : '',
    };
  }
  return config;
}

// 切换图片服务激活状态 (互斥逻辑)
export async function toggleImageProvider(key: string, isActive: boolean) {
  if (!isActive) {
    await prisma.imageConfig.update({
      where: { id: key },
      data: { isActive: false }
    });
  } else {
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

// === 3. 业务逻辑：生成花语 ===

export async function generateFlowerContent(flowerName: string) {
  // 1. 获取当前激活的配置
  const config = await getActiveSystemConfig();
  
  if (!config?.apiKey) throw new Error('AI 服务未配置或未激活，请在系统设置中激活一个服务商');

  const openai = new OpenAI({ baseURL: config.baseUrl, apiKey: config.apiKey });
  const prompt = `请根据花名"${flowerName}"生成以下 JSON 数据：
    1. englishName: 对应的英文名称。
    2. language: 提炼一句唯美、治愈的花语（15字以内）。
    3. habit: 简短的生长习性。
    4. alias: 2-3个常见的别名，使用中文顿号"、"分隔，如果没有则留空。
    只返回纯 JSON。`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: config.modelName,
      response_format: { type: "json_object" }, 
    });
    return JSON.parse(completion.choices[0].message.content || '{}');
  } catch (error: any) {
    console.error('AI Generation Error:', error);
    throw new Error(`AI 生成失败: ${error.message}`);
  }
}

// === 4. 花卉 CRUD (保持不变) ===
export async function getFlowers() {
  return await prisma.flower.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function createFlower(formData: FormData) {
  const name = formData.get('name') as string;
  const englishName = formData.get('englishName') as string;
  const imageUrl = formData.get('imageUrl') as string;
  const sourceUrl = formData.get('sourceUrl') as string; 
  const pgsourceUrl = formData.get('pgsourceUrl') as string; 
  const language = formData.get('language') as string;
  const habit = formData.get('habit') as string;
  const alias = formData.get('alias') as string;
  const photographer = formData.get('photographer') as string;

  await prisma.flower.create({
    data: { 
      // @ts-ignore
      name, englishName, imageUrl, sourceUrl, pgsourceUrl, language, habit, alias, photographer 
    },
  });
  revalidatePath('/admin/flowers'); 
}

export async function batchCreateFlowers(flowers: any[]) {
  const validData = flowers.filter(f => f.name && f.imageUrl).map(f => ({
    name: f.name,
    englishName: f.englishName || '',
    imageUrl: f.imageUrl,
    sourceUrl: f.sourceUrl || '', 
    pgsourceUrl: f.pgsourceUrl || '', 
    language: f.language || '',
    habit: f.habit || '',
    alias: f.alias || '',
    photographer: f.photographer || ''
  }));

  if (validData.length === 0) throw new Error('没有有效的花卉数据可导入');

  await prisma.flower.createMany({ data: validData });
  revalidatePath('/admin/flowers');
  return { count: validData.length };
}

export async function batchUpdateFlowers(flowers: any[]) {
  const updates = flowers.map(f => 
    prisma.flower.update({
      where: { id: f.id },
      data: {
        name: f.name,
        englishName: f.englishName,
        language: f.language,
        habit: f.habit,
        alias: f.alias,
        photographer: f.photographer,
        imageUrl: f.imageUrl,
        sourceUrl: f.sourceUrl,
        // @ts-ignore
        pgsourceUrl: f.pgsourceUrl 
      }
    })
  );
  await prisma.$transaction(updates);
  revalidatePath('/admin/flowers');
  return { success: true };
}

export async function deleteFlower(id: string) {
  await prisma.flower.delete({ where: { id } });
  revalidatePath('/admin/flowers');
}

export async function updateFlower(id: string, formData: FormData) {
  const name = formData.get('name') as string;
  const englishName = formData.get('englishName') as string;
  const imageUrl = formData.get('imageUrl') as string;
  const sourceUrl = formData.get('sourceUrl') as string;
  const pgsourceUrl = formData.get('pgsourceUrl') as string; 
  const language = formData.get('language') as string;
  const habit = formData.get('habit') as string;
  const alias = formData.get('alias') as string;
  const photographer = formData.get('photographer') as string;

  await prisma.flower.update({
    where: { id },
    data: { 
      // @ts-ignore
      name, englishName, imageUrl, sourceUrl, pgsourceUrl, language, habit, alias, photographer 
    },
  });
  revalidatePath('/admin/flowers');
}