import { analyzeImageWithGemini } from '@/lib/gemini';

// Cloudflare Pages 배포 호환을 위해 Edge 런타임 선언
export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { dataUrl } = body;

    if (!dataUrl) {
      return new Response(JSON.stringify({ error: '이미지 데이터가 필요합니다.' }), { status: 400 });
    }
    // 서버 측 환경에서 안전하게 API 키를 주입받아 이미지 분석 함수 실행
    const { result, error } = await analyzeImageWithGemini(dataUrl);

    if (error) {
      return new Response(JSON.stringify({ error }), { status: 500 });
    }

    return new Response(JSON.stringify({ result }), { status: 200 });
  } catch (error: any) {
    console.error('이미지 분석 API 라우트 에러:', error);
    return new Response(JSON.stringify({ error: '서버 내부 오류가 발생했습니다.' }), { status: 500 });
  }
}