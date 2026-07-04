import { NextRequest } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const payload = await getCurrentUser();
    if (!payload) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { code, question, language, stream = true } = body;

    if (!code || !question || !language) {
      return new Response(
        JSON.stringify({ error: 'Code, question, and language are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const zai = await ZAI.create();

    if (stream) {
      // Streaming response
      const responseStream = await zai.createChatCompletion({
        model: 'default',
        stream: true,
        messages: [
          {
            role: 'system',
            content: `You are a helpful coding assistant. The user is working with ${language}. Help them with their code. Be concise and provide code examples when relevant. Use markdown formatting.`,
          },
          {
            role: 'user',
            content: `${question}\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\``,
          },
        ],
      });

      if (responseStream && typeof responseStream.getReader === 'function') {
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        const transformStream = new TransformStream({
          async transform(chunk, controller) {
            const text = decoder.decode(chunk, { stream: true });
            // Parse SSE data
            const lines = text.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                if (data === '[DONE]') {
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                  return;
                }
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  if (content) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                  }
                } catch {
                  // Skip malformed JSON
                }
              }
            }
          },
        });

        const readable = responseStream.pipeThrough(transformStream);

        return new Response(readable, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          },
        });
      }
    }

    // Fallback: non-streaming response
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

    return new Response(JSON.stringify({ response: text }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('AI assist error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get AI response', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}