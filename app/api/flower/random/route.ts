import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Flower } from '@prisma/client';

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
    const body = await request.json();
    const seenIds: string[] = body.seenIds || [];
    const count: number = body.count || 1; // 支持传入 count，默认为 1

    // 1. 查询数据库中所有未看过的花朵 ID
    const availableFlowers = await prisma.flower.findMany({
      where: {
        id: { notIn: seenIds }
      },
      select: { id: true }
    });

    // 2. 判断是否已看完
    if (availableFlowers.length === 0) {
      const randomCompliment = COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)];
      return NextResponse.json({ 
        finished: true, 
        message: randomCompliment 
      });
    }

    // 3. 随机抽取 ID
    const targetFlowers: Flower[] = [];
    
    // 如果请求的数量大于剩余数量，则返回所有剩余的
    const loopCount = Math.min(count, availableFlowers.length);
    
    // 简单的随机抽取逻辑 (Fisher-Yates 洗牌的简化版，适合小数据量)
    // 为了性能，不打乱整个数组，而是随机选 indices
    const indices = new Set<number>();
    while (indices.size < loopCount) {
      const randomIndex = Math.floor(Math.random() * availableFlowers.length);
      indices.add(randomIndex);
    }

    const targetIds = Array.from(indices).map(i => availableFlowers[i].id);

    // 4. 获取花朵的完整详情
    const flowers = await prisma.flower.findMany({
      where: { id: { in: targetIds } }
    });

    // 如果只请求 1 个，保持原有数据结构返回单对象（兼容旧逻辑）
    // 如果请求 > 1 个，返回数组
    if (count === 1) {
       return NextResponse.json({ finished: false, data: flowers[0] });
    } else {
       return NextResponse.json({ finished: false, list: flowers });
    }

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}