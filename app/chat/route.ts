// app/api/chat/route.ts
import { streamChatWithMessage } from '@/lib/gemini';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history } = body;

    if (!message) {
      return new Response(JSON.stringify({ error: '메시지가 필요합니다.' }), { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = streamChatWithMessage(message, history || []);
          
          for await (const chunk of generator) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch (error) {
          console.error('스트리밍 에러:', error);
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Nginx, Cloudflare 등의 버퍼링 강제 해제
        'Content-Encoding': 'none', // 압축으로 인한 버퍼링 대기 방지
      },
    });
  } catch (error) {
    console.error('API 라우트 처리 에러:', error);
    return new Response(JSON.stringify({ error: '서버 내부 오류가 발생했습니다.' }), { status: 500 });
  }
}