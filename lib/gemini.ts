/**
 * app.py의 Gemini/Gemma 호출 로직과 동일한 동작
 * + 진짜 에러 메시지 화면 출력 기능 추가
 * + Vercel/Cloudflare 정규식 빌드 에러 수정 완료
 */

// 💡 주의: generativelanguage.googleapis.com 주소는 구글 API 전용이므로 
// gemma 모델 호출 시 404 에러가 날 수 있습니다.
// 만약 gemma 모델을 서빙하는 별도 API 주소가 있다면 그 주소로 변경하셔야 합니다.
const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

const GEMMA_MODELS = [
  "gemma-3-27b-it",
  "gemma-3-12b-it",
  "gemma-3-4b-it",
  "gemma-3-1b-it",
];

const GEMINI_VISION_MODELS = [
  "gemini-3-flash-preview",
  "gemini-2.5-flash",
  "gemini-3.1-flash-lite-preview",
  "gemini-3.1-flash-live-preview",
];

function getApiKey(): string {
  const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      "NEXT_PUBLIC_GEMINI_API_KEY가 설정되지 않았습니다. .env.local을 확인하세요."
    );
  }
  return key;
}

type GenerateContentResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
};

export async function callTextApiWithFallback(
  prompt: string,
  models: string[] = GEMMA_MODELS
): Promise<string> {
  const apiKey = getApiKey();
  let lastErrorDetails = ""; // 💡 진짜 에러를 저장할 변수

  for (const model of models) {
    const url = `${API_BASE_URL}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const payload = { contents: [{ parts: [{ text: prompt }] }] };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15_000),
      });

      if (response.status === 429) {
        lastErrorDetails = `[${model}] 429 Too Many Requests: 한도 초과`;
        continue;
      }

      if (!response.ok) {
        // 에러가 발생하면 서버가 보낸 메시지를 그대로 읽어옵니다.
        const errorText = await response.text();
        lastErrorDetails = `[${model} HTTP ${response.status}] ${errorText}`;
        continue;
      }

      const result = (await response.json()) as GenerateContentResponse;
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (error: any) {
      lastErrorDetails = `[${model} 예외 발생] ${error.message}`;
      continue;
    }
  }

  // 챗봇 화면에 구글의 진짜 에러 메시지를 바로 띄워줍니다.
  return `⚠️ AI 호출 실패 원인:\n\n${lastErrorDetails}`;
}

/** app.py get_gemma_advice */
export async function getGemmaAdvice(
  elec: number,
  gas: number,
  co2: number
): Promise<string> {
  const prompt = `사용자가 이번 달에 전기 ${elec}kWh, 가스 ${gas}m3를 사용하여 총 ${co2.toFixed(2)}kg의 탄소를 배출했어. 이 사용자에게 에너지 절약을 독려하고 실생활에서 실천할 수 있는 팁을 친절하게 한국어 3문장 이내로 조언해줘.`;
  return callTextApiWithFallback(prompt, GEMMA_MODELS);
}

/** app.py ask_gemma_custom_question */
export async function askGemmaCustomQuestion(userMessage: string): Promise<string> {
  return callTextApiWithFallback(userMessage, GEMMA_MODELS);
}

export type ImageAnalysisResult = {
  action_found?: string;
  description?: string;
  estimated_save_kwh?: string;
} | null;

function extractJsonObject(text: string): ImageAnalysisResult {
  const trimmed = text.trim();
  let jsonStr = trimmed;

  // 💡 정규식 문법 오류(Unterminated regexp literal) 수정 완료!
  const fence = trimmed.match(/
http://googleusercontent.com/immersive_entry_chip/0

이제 깃허브에 올리시면 막혔던 배포가 뻥 뚫리면서 초록색(Success) 불이 들어올 겁니다! 배포 후에 챗봇에 말을 걸어보시고, 혹시라도 에러 팝업이 뜨면 그 내용만 알려주시면 됩니다.
