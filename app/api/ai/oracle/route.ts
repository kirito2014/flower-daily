// app/api/ai/oracle/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAIClient } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question, flowerId } = body;

    if (!question) {
      return NextResponse.json({ error: '请告诉我你的烦恼' }, { status: 400 });
    }

    // 1. 获取花朵信息 (作为 AI 的人设)
    const flower = flowerId 
      ? await prisma.flower.findUnique({ where: { id: flowerId } })
      : null;

    // 默认人设 (如果未提供花朵ID)
    const flowerName = flower?.name || '未知的花精灵';
    const flowerLanguage = flower?.language || '神秘与希望';
    const flowerHabit = flower?.habit || '生长在赛博空间的缝隙中';

    // 2. 初始化 AI 客户端
    let ai;
    try {
      ai = await getAIClient();
    } catch (e: any) {
      console.error('AI Config Error:', e);
      return NextResponse.json({ 
        error: e.message === 'SYSTEM_NO_ACTIVE_AI_CONFIG' 
          ? '占卜师正在休息 (未配置AI)' 
          : '连接占卜水晶球失败' 
      }, { status: 503 });
    }

    // 3. 构建 Prompt
    const systemPrompt = `
      你现在不是一个AI，而是一朵刚刚化为人形的"${flowerName}"。
      
      你的设定如下：
      - 花语：${flowerLanguage}
      - 习性：${flowerHabit}
      
      请根据你的花语和习性，用温柔、治愈、略带神秘感的口吻回答用户的烦恼。
      回答要求：
      1. 必须以"${flowerName}"的第一人称口吻（可以使用"我"或"本花"）。
      2. 结合你的习性或花语来给出建议或安慰。
      3. 字数控制在 100 字以内，短小精悍，富有诗意。
      4. 不要透露你是 AI 或语言模型。
    `;

    // 4. 调用 AI
    const completion = await ai.client.chat.completions.create({
      model: ai.modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question }
      ],
      temperature: 0.7, // 稍微高一点的创造性，让语气更灵动
      max_tokens: 200,
    });

    const answer = completion.choices[0]?.message?.content || '风把答案吹散了...请再问一次。';

    return NextResponse.json({ answer });

  } catch (error) {
    console.error('Oracle Error:', error);
    return NextResponse.json({ error: '占卜过程受到了干扰' }, { status: 500 });
  }
}