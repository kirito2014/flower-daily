'use server'

import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { revalidatePath } from 'next/cache';
import { encrypt, decrypt } from '@/lib/crypto';

// === 1. 系统配置相关 (省略，保持不变) ===
export async function getSystemConfig(key: string = 'global_config') {
  const config = await prisma.appConfig.findUnique({ where: { id: key } });
  if (config && config.apiKey) return { ...config, apiKey: decrypt(config.apiKey) };
  return config;
}

export async function saveSystemConfig(formData: FormData) {
  const key = (formData.get('key') as string) || 'global_config';
  const baseUrl = (formData.get('baseUrl') as string).trim();
  const apiKey = (formData.get('apiKey') as string).trim();
  const modelName = (formData.get('modelName') as string).trim();

  if (/[^\x00-\x7F]/.test(apiKey)) throw new Error('API Key 包含非法字符');
  const encryptedKey = encrypt(apiKey);

  await prisma.appConfig.upsert({
    where: { id: key },
    update: { baseUrl, apiKey: encryptedKey, modelName, isActive: true },
    create: { id: key, baseUrl, apiKey: encryptedKey, modelName, isActive: true },
  });
  revalidatePath('/admin/settings');
}

export async function deleteSystemConfig(key: string = 'global_config') {
  await prisma.appConfig.delete({ where: { id: key } });
  revalidatePath('/admin/settings');
}

export async function testAIConnection(key: string = 'global_config') {
  const config = await getSystemConfig(key);
  if (!config?.apiKey) return { success: false, message: '未找到配置' };
  try {
    const openai = new OpenAI({ baseURL: config.baseUrl, apiKey: config.apiKey });
    await openai.chat.completions.create({
      messages: [{ role: "user", content: "Hi" }],
      model: config.modelName,
      max_tokens: 5,
    });
    return { success: true, message: `连接成功！已连通 ${config.modelName}` };
  } catch (error: any) {
    return { success: false, message: `连接失败: ${error.message}` };
  }
}

export async function generateFlowerContent(flowerName: string) {
  let config = await getSystemConfig('deepseek');
  if (!config?.apiKey) config = await getSystemConfig('global_config');
  if (!config?.apiKey) throw new Error('AI 未配置');

  const openai = new OpenAI({ baseURL: config.baseUrl, apiKey: config.apiKey });
  const prompt = `请根据花名"${flowerName}"生成以下 JSON 数据：
    1. englishName: 对应的英文名称或拉丁文学名。
    2. language: 提炼一句唯美、治愈的花语（15字以内）。
    3. habit: 简短的生长习性。
    4. alias: 2-3个常见的别名，使用中文顿号"、"分隔，如果没有则留空。
    只返回纯 JSON。`;

  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: config.modelName,
    response_format: { type: "json_object" }, 
  });
  return JSON.parse(completion.choices[0].message.content || '{}');
}

// === 3. 花卉管理 CRUD (修改部分：包含 pgsourceUrl) ===
export async function getFlowers() {
  return await prisma.flower.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function createFlower(formData: FormData) {
  const name = formData.get('name') as string;
  const englishName = formData.get('englishName') as string;
  const imageUrl = formData.get('imageUrl') as string;
  const sourceUrl = formData.get('sourceUrl') as string; 
  const pgsourceUrl = formData.get('pgsourceUrl') as string; // === 新增：读取 pgsourceUrl ===
  const language = formData.get('language') as string;
  const habit = formData.get('habit') as string;
  const alias = formData.get('alias') as string;
  const photographer = formData.get('photographer') as string;

  await prisma.flower.create({
    data: { 
      // @ts-ignore: 确保 prisma schema 已更新包含 pgsourceUrl
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
    pgsourceUrl: f.pgsourceUrl || '', // === 新增：批量导入支持 pgsourceUrl ===
    language: f.language || '',
    habit: f.habit || '',
    alias: f.alias || '',
    photographer: f.photographer || ''
  }));

  if (validData.length === 0) {
    throw new Error('没有有效的花卉数据可导入');
  }

  await prisma.flower.createMany({
    data: validData,
  });

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
        pgsourceUrl: f.pgsourceUrl // === 新增：批量更新支持 pgsourceUrl ===
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
  const pgsourceUrl = formData.get('pgsourceUrl') as string; // === 新增：读取 pgsourceUrl ===
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