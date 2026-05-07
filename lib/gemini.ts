/**
 * app.py의 Gemini/Gemma 호출 로직과 동일한 동작
 * + 진짜 에러 메시지 화면 출력 기능 추가
 */

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
  let lastErrorDetails = ""; // 💡 진짜 에러를 저장할 변수 추가

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
        // 💡 에러가 발생하면 서버가 보낸 메시지를 그대로 읽어옵니다.
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

  // 💡 챗봇 화면에 구글의 진짜 에러 메시지를 바로 띄워줍니다!
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

  const fence = trimmed.match(/
http://googleusercontent.com/immersive_entry_chip/0

---

### 💡 살짝 의심되는 부분 한 가지!
코드를 살펴보니 `gemma-3-27b-it` 같은 **Gemma** 모델 이름을 Google AI Studio(`generativelanguage.googleapis.com`) 주소로 호출하고 계십니다. 

Google AI Studio는 보통 `gemini-1.5-flash` 나 `gemini-2.0-flash` 같은 **Gemini** 모델 전용으로 많이 쓰이기 때문에, 구글 서버가 **"그런 이름의 모델은 우리 쪽에 없는데요? (404 Not Found)"** 라고 에러를 뱉으면서 막혔을 확률이 굉장히 높습니다.

이제 위 코드를 깃허브에 올리시고(당연히 클라우드플레어 재배포 확인!), 폰이나 PC에서 챗봇에 아무 말이나 쳐보세요. 

만약 **`[gemma-3-1b-it HTTP 404] ... "models/gemma-3-1b-it is not found"`** 같은 영어가 뜬다면 모델 이름이 틀려서 구글이 거절한 것이니 모델 이름을 `gemini-1.5-flash`로 바꿔주시면 바로 해결됩니다! 

챗봇이 어떤 "진짜 에러"를 토해내는지 확인해 보시고 영어 메시지를 복사해서 알려주세요!
