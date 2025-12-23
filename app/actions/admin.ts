// app/actions/admin.ts
'use server'

import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import { revalidatePath } from 'next/cache';
import { encrypt, decrypt } from '@/lib/crypto'; // 引入加密工具

// 1. 获取系统配置 (读取时自动解密)
export async function getSystemConfig() {
  const config = await prisma.appConfig.findUnique({
    where: { id: 'global_config' },
  });

  // 如果有配置，解密 apiKey 再返回给前端或内部调用
  if (config && config.apiKey) {
    return {
      ...config,
      apiKey: decrypt(config.apiKey) // <--- 关键点：解密
    };
  }
  
  return config;
}

// 2. 保存系统配置 (保存时自动加密)
export async function saveSystemConfig(formData: FormData) {
  const baseUrl = (formData.get('baseUrl') as string).trim();
  const apiKey = (formData.get('apiKey') as string).trim();
  const modelName = (formData.get('modelName') as string).trim();

  // 基础校验
  if (/[^\x00-\x7F]/.test(apiKey)) {
    throw new Error('API Key 包含非法字符（中文或全角符号），请检查输入。');
  }

  // <--- 关键点：加密后再存入数据库
  const encryptedKey = encrypt(apiKey);

  await prisma.appConfig.upsert({
    where: { id: 'global_config' },
    update: { 
      baseUrl, 
      apiKey: encryptedKey, // 存密文
      modelName 
    },
    create: { 
      id: 'global_config', 
      baseUrl, 
      apiKey: encryptedKey, // 存密文
      modelName 
    },
  });

  revalidatePath('/admin/settings');
}

// 3. 删除配置
export async function deleteSystemConfig() {
  await prisma.appConfig.delete({
    where: { id: 'global_config' },
  });
  revalidatePath('/admin/settings');
}

// 4. 测试 AI 连接
export async function testAIConnection() {
  // 这里调用 getSystemConfig()，它内部已经帮我们解密了，所以这里拿到的 config.apiKey 是明文
  const config = await getSystemConfig();
  
  if (!config?.apiKey) return { success: false, message: '未找到已保存的配置，请先保存。' };

  try {
    const openai = new OpenAI({
      baseURL: config.baseUrl,
      apiKey: config.apiKey, // 这里使用的是解密后的 Key，可以直接用
    });
    
    await openai.chat.completions.create({
      messages: [{ role: "user", content: "Hi" }],
      model: config.modelName,
      max_tokens: 5,
    });

    return { success: true, message: `连接成功！已连通 ${config.modelName}` };
  } catch (error: any) {
    let msg = error.message;
    if (msg.includes('401')) msg = 'API Key 无效 (401)';
    else if (msg.includes('404')) msg = '接口地址或模型名称错误 (404)';
    return { success: false, message: `连接失败: ${msg}` };
  }
}

// 5. AI 生成 (同理，直接使用解密后的 config)
export async function generateFlowerContent(flowerName: string) {
  const config = await getSystemConfig();
  if (!config?.apiKey) throw new Error('AI 未配置');

  const openai = new OpenAI({ baseURL: config.baseUrl, apiKey: config.apiKey });
  const prompt = `请根据花名"${flowerName}"生成JSON: { language: "唯美花语", habit: "习性" }`;

  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: config.modelName,
    response_format: { type: "json_object" }, 
  });
  return JSON.parse(completion.choices[0].message.content || '{}');
}

// 其他 CRUD 函数保持不变...
export async function createFlower(formData: FormData) {
    const name = formData.get('name') as string;
    const imageUrl = formData.get('imageUrl') as string;
    const language = formData.get('language') as string;
    const habit = formData.get('habit') as string;
  
    await prisma.flower.create({
      data: { name, imageUrl, language, habit },
    });
  
    revalidatePath('/admin/flowers'); 
}

export async function deleteFlower(id: string) {
    await prisma.flower.delete({ where: { id } });
    revalidatePath('/admin/flowers');
}

// 新增：更新花卉信息
export async function updateFlower(id: string, formData: FormData) {
  const name = formData.get('name') as string;
  const imageUrl = formData.get('imageUrl') as string;
  const language = formData.get('language') as string;
  const habit = formData.get('habit') as string;

  await prisma.flower.update({
    where: { id },
    data: { name, imageUrl, language, habit },
  });

  // 刷新页面数据
  revalidatePath('/admin/flowers');
}