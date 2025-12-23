import crypto from 'crypto';
import { createHash } from 'crypto';

// 读取环境变量中的加密密钥，如果没有则使用默认值
// 注意：AES 加密需要 32 位密钥，用于 encrypt/decrypt 函数
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; 
const IV_LENGTH = 16; 

/**
 * ==========================================
 * 第一部分：登录验证用的哈希函数 (新增)
 * ==========================================
 */

/**
 * 使用 SHA-256 算法对密码进行不可逆哈希加密
 * 用于生成存入 .env 的密码
 */
export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

/**
 * 校验密码是否正确
 * @param inputPassword 用户在登录框输入的明文密码
 * @param storedHash 存储在 .env 中的哈希值
 */
export function verifyPassword(inputPassword: string, storedHash: string): boolean {
  // 防御性编程：如果环境变量没配置，直接拒绝
  if (!storedHash) return false;
  
  const inputHash = hashPassword(inputPassword);
  // 比对计算出的哈希值与存储的哈希值是否一致
  return inputHash === storedHash;
}

/**
 * ==========================================
 * 第二部分：数据加密用的 AES 函数 (保留原有)
 * ==========================================
 */

export function encrypt(text: string): string {
  if (!text) return text;
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
  if (!text) return text;

  try {
    const textParts = text.split(':');
    if (textParts.length < 2) return text; 

    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
  } catch (error) {
    console.warn("解密失败，返回原始值", error);
    return text;
  }
}