// app/api/chat/route.ts
import { streamChatWithMessage } from '@/lib/gemini';

// 스트리밍을 위해 Edge 런타임 사용을 권장합니다.
export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, history } = body;

    if (!message) {
      return new Response(JSON.stringify({ error: '메시지가 필요합니다.' }), { status: 400 });
    }

    // 서버 측에서 생성된 스트림을 클라이언트로 전달하기 위해 ReadableStream 설정
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = streamChatWithMessage(message, history || []);
          
          for await (const chunk of generator) {
            // 들어오는 텍스트 청크를 인코딩하여 스트림 큐에 밀어 넣습니다.
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
        'Cache-Control': 'no-cache, no-transform', // 버퍼링 방지
      },
    });
  } catch (error) {
    console.error('API 라우트 처리 에러:', error);
    return new Response(JSON.stringify({ error: '서버 내부 오류가 발생했습니다.' }), { status: 500 });
  }
}