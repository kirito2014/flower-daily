import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'], // 开发时开启查询日志，方便调试
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;