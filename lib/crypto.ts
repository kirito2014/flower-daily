// lib/crypto.ts
import crypto from 'crypto';
import { createHash } from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; 
const IV_LENGTH = 16; 

// === 1. 密码哈希 (单向加密) ===
export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export function verifyPassword(inputPassword: string, storedHash: string): boolean {
  if (!storedHash) return false;
  return hashPassword(inputPassword) === storedHash;
}

// === 2. 复杂度校验 (新增) ===
// 要求：>8位 (即9位及以上)，包含大写、小写、特殊字符
export function validatePasswordComplexity(password: string): boolean {
  const minLength = 9;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return password.length >= minLength && hasUpperCase && hasLowerCase && hasSpecialChar;
}

// === 3. 数据加密 (AES - 保留原有功能) ===
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
    console.warn("解密失败", error);
    return text;
  }
}