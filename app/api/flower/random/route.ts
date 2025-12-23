import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 完结时的赞美语料库
const COMPLIMENTS = [
  "看了那么多花，其实你才是最美的那个。",
  "花期有时，但你的光芒永不凋谢。",
  "世间万物皆有裂痕，那是光照进来的地方，也是你盛开的地方。",
  "你比这一百种花，更值得被爱。",
  "赠人玫瑰，手有余香。今天也要开心哦。"
];

export async function POST(request: Request) {
  try {
    const { seenIds } = await request.json(); // 获取前端传来的已读 ID 数组

    // 1. 查询数据库中所有未看过的花朵 ID
    // 注意：Prisma 不支持直接的 ORDER BY RANDOM()，所以我们先取 ID 列表，在内存中随机
    const availableFlowers = await prisma.flower.findMany({
      where: {
        id: { notIn: seenIds || [] }
      },
      select: { id: true } // 只取 ID，减少传输量
    });

    // 2. 判断是否已看完
    if (availableFlowers.length === 0) {
      const randomCompliment = COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)];
      return NextResponse.json({ 
        finished: true, 
        message: randomCompliment 
      });
    }

    // 3. 随机抽取一个 ID
    const randomIndex = Math.floor(Math.random() * availableFlowers.length);
    const targetId = availableFlowers[randomIndex].id;

    // 4. 获取该花朵的完整详情
    const flower = await prisma.flower.findUnique({
      where: { id: targetId }
    });

    return NextResponse.json({ finished: false, data: flower });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}