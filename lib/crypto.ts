// lib/crypto.ts
import crypto from 'crypto';

// 读取环境变量中的加密密钥，如果没有则使用默认值（仅供开发警告，生产环境必须配置）
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; // 必须是 32 位
const IV_LENGTH = 16; // AES 初始化向量长度

/**
 * 加密函数
 */
export function encrypt(text: string): string {
  if (!text) return text;
  
  // 生成随机初始化向量
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  // 返回格式: iv:encryptedData (十六进制)
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * 解密函数
 */
export function decrypt(text: string): string {
  if (!text) return text;

  try {
    const textParts = text.split(':');
    
    // 兼容性处理：如果数据库里存的是旧的明文 Key（没有冒号或格式不对），直接返回原值
    if (textParts.length < 2) return text; 

    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
  } catch (error) {
    // 如果解密失败（可能是旧数据的格式问题），为了不崩坏，返回原文本
    console.warn("解密失败，返回原始值", error);
    return text;
  }
}