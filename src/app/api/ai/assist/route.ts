import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const payload = await getCurrentUser();
    if (!payload) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { code, question, language } = body;

    if (!code || !question || !language) {
      return NextResponse.json(
        { error: 'Code, question, and language are required' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();
    const response = await zai.createChatCompletion({
      model: 'default',
      messages: [
        {
          role: 'system',
          content: `You are a helpful coding assistant. The user is working with ${language}. Help them with their code. Be concise and provide code examples when relevant.`,
        },
        {
          role: 'user',
          content: `${question}\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\``,
        },
      ],
    });

    const text = response?.choices?.[0]?.message?.content || '';

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error('AI assist error:', error);
    return NextResponse.json(
      { error: 'Failed to get AI response', details: String(error) },
      { status: 500 }
    );
  }
}