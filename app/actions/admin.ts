'use server'

import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { revalidatePath } from 'next/cache';
import { encrypt, decrypt } from '@/lib/crypto';

// === 1. 系统配置相关 ===

// 修改：支持传入 key 获取特定服务商配置，默认为 'global_config' 保持兼容
export async function getSystemConfig(key: string = 'global_config') {
  const config = await prisma.appConfig.findUnique({
    where: { id: key },
  });
  if (config && config.apiKey) {
    return { ...config, apiKey: decrypt(config.apiKey) };
  }
  return config;
}

export async function saveSystemConfig(formData: FormData) {
  // 修改：从 FormData 获取 key，如果没有则默认为 'global_config'
  const key = (formData.get('key') as string) || 'global_config';
  const baseUrl = (formData.get('baseUrl') as string).trim();
  const apiKey = (formData.get('apiKey') as string).trim();
  const modelName = (formData.get('modelName') as string).trim();

  if (/[^\x00-\x7F]/.test(apiKey)) {
    throw new Error('API Key 包含非法字符');
  }

  const encryptedKey = encrypt(apiKey);

  await prisma.appConfig.upsert({
    where: { id: key },
    update: { baseUrl, apiKey: encryptedKey, modelName, isActive: true }, // 保存即激活
    create: { id: key, baseUrl, apiKey: encryptedKey, modelName, isActive: true },
  });

  revalidatePath('/admin/settings');
}

export async function deleteSystemConfig(key: string = 'global_config') {
  await prisma.appConfig.delete({ where: { id: key } });
  revalidatePath('/admin/settings');
}

// 修改：支持测试指定配置
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

// === 2. AI 生成 (业务逻辑) ===
// 注意：实际生成时，可能需要指定使用哪个 AI，这里暂时保持使用 'active' 的逻辑
// 或者我们可以约定：generateFlowerContent 总是读取某个标记为 "当前激活" 的配置
// 简化起见，我们假设当前激活的是前端传来的，或者我们去 DB 查一个 active 的
// 这里为了不破坏原有逻辑，暂时默认读取 global_config，或者你可以扩展此函数
export async function generateFlowerContent(flowerName: string) {
  // 暂时读取 'deepseek' 或者你可以改为读取一个系统设置的 "当前默认AI"
  // 由于 generateFlowerContent 是由用户在 FlowerForm 触发，
  // 最佳实践是系统应该有一个 "Current Active AI" 的概念。
  // 现在的实现：简单起见，我们尝试读取几个常见的，或者恢复为读取 'global_config'
  // 如果你希望它动态化，需要再加一个 SystemSetting 来存储 "CurrentProviderID"
  
  // 临时方案：优先读取 deepseek，如果没有则读取 global_config
  let config = await getSystemConfig('deepseek');
  if (!config?.apiKey) {
      config = await getSystemConfig('global_config');
  }
  
  if (!config?.apiKey) throw new Error('AI 未配置');

  const openai = new OpenAI({ baseURL: config.baseUrl, apiKey: config.apiKey });
  
  const prompt = `请根据花名"${flowerName}"生成以下 JSON 数据：
    1. englishName: 对应的英文名称。
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

// === 3. 花卉管理 CRUD ===
export async function getFlowers() {
  return await prisma.flower.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

export async function createFlower(formData: FormData) {
  const name = formData.get('name') as string;
  const englishName = formData.get('englishName') as string;
  const imageUrl = formData.get('imageUrl') as string;
  const language = formData.get('language') as string;
  const habit = formData.get('habit') as string;
  const alias = formData.get('alias') as string;
  const photographer = formData.get('photographer') as string;

  await prisma.flower.create({
    data: { name, englishName, imageUrl, language, habit, alias, photographer },
  });

  revalidatePath('/admin/flowers'); 
}

export async function batchCreateFlowers(flowers: any[]) {
  const validData = flowers.filter(f => f.name && f.imageUrl).map(f => ({
    name: f.name,
    englishName: f.englishName || '',
    imageUrl: f.imageUrl,
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
        imageUrl: f.imageUrl
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
  const language = formData.get('language') as string;
  const habit = formData.get('habit') as string;
  const alias = formData.get('alias') as string;
  const photographer = formData.get('photographer') as string;

  await prisma.flower.update({
    where: { id },
    data: { name, englishName, imageUrl, language, habit, alias, photographer },
  });

  revalidatePath('/admin/flowers');
}