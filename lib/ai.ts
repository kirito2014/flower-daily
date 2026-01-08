// lib/ai.ts
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';
import OpenAI from 'openai';

/**
 * 获取并初始化当前激活的 AI 客户端
 */
export async function getAIClient() {
  // 1. 从数据库查找激活的 AI 配置
  const config = await prisma.appConfig.findFirst({
    where: { isActive: true },
  });

  if (!config) {
    throw new Error('SYSTEM_NO_ACTIVE_AI_CONFIG');
  }

  // 2. 解密 API Key
  const apiKey = decrypt(config.apiKey);
  if (!apiKey) {
    throw new Error('SYSTEM_INVALID_API_KEY');
  }

  // 3. 初始化 OpenAI 客户端 (支持自定义 BaseURL，兼容 DeepSeek/Moonshot 等)
  const client = new OpenAI({
    baseURL: config.baseUrl,
    apiKey: apiKey,
  });

  return { client, modelName: config.modelName };
}