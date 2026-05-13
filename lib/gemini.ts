/**
 * 텍스트: Groq API (Gemma 4 31B -> 26B Fallback 적용)
 * 이미지 분석: Google AI Studio (Gemini Vision 멀티 모델 적용)
 */

const GOOGLE_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const GROQ_API_BASE = "https://api.groq.com/openai/v1/chat/completions";

// 텍스트 처리를 위한 Gemma 4 모델 우선순위 리스트
const GEMMA_TEXT_MODELS = [
  "gemma-4-31b-it",     // 1순위: 최고 성능 Dense 모델
  "gemma-4-26b-a4b-it", // 2순위: 빠른 속도의 MoE 모델 (Fallback용)
];

// 이미지 분석을 위한 Gemini 모델 리스트
const GEMINI_VISION_MODELS = [
  "gemini-3-flash-preview",
  "gemini-2.5-flash",
  "gemini-3.1-flash-lite-preview",
  "gemini-3.1-flash-live-preview",
];

/**
 * 환경 변수 유효성 검사 및 로드
 */
function getGoogleApiKey(): string {
  const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!key) throw new Error("NEXT_PUBLIC_GEMINI_API_KEY가 설정되지 않았습니다.");
  return key.trim(); 
}

function getGroqApiKey(): string {
  const key = process.env.NEXT_PUBLIC_GROQ_API_KEY;
  if (!key) throw new Error("NEXT_PUBLIC_GROQ_API_KEY가 설정되지 않았습니다.");
  return key.trim(); 
}

// =====================================================================
// 1. 텍스트 로직 (Gemma 4 멀티 모델 Fallback)
// =====================================================================

export async function callTextApiWithFallback(prompt: string): Promise<string> {
  const apiKey = getGroqApiKey();
  const safePrompt = prompt ? prompt.trim() : "안녕하세요.";
  let lastError = "";

  // 정의된 Gemma 4 모델 리스트를 순회하며 시도합니다.
  for (const model of GEMMA_TEXT_MODELS) {
    try {
      const payload = {
        model: model,
        messages: [
          { role: "system", content: "당신은 에너지 절약 및 탄소 중립 전문가입니다. 친절한 한국어로 답변하세요." },
          { role: "user", content: safePrompt }
        ],
        temperature: 0.6,
      };

      const response = await fetch(GROQ_API_BASE, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15_000), // 각 모델당 15초 대기
      });

      if (!response.ok) {
        lastError = `[${model}] HTTP ${response.status} 에러`;
        continue; // 다음 모델로 시도
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content;
      
      if (content) return content.trim();

    } catch (error: any) {
      lastError = `[${model}] 호출 실패: ${error.message}`;
      continue; // 다음 모델로 시도
    }
  }

  return `⚠️ 모든 Gemma 4 모델 호출에 실패했습니다. (최종 에러: ${lastError})`;
}

export async function getGemmaAdvice(elec: number, gas: number, co2: number): Promise<string> {
  const prompt = `사용자 데이터: 전기 ${elec}kWh, 가스 ${gas}m3, 탄소배출 ${co2.toFixed(2)}kg. 에너지 절약 팁을 3문장 이내로 친절하게 조언해줘.`;
  return callTextApiWithFallback(prompt);
}

export async function askGemmaCustomQuestion(userMessage: string): Promise<string> {
  return callTextApiWithFallback(userMessage);
}

// =====================================================================
// 2. 이미지 분석 로직 (Gemini Vision 멀티 모델)
// =====================================================================

export type ImageAnalysisResult = {
  action_found?: string;
  description?: string;
  estimated_save_kwh?: string;
} | null;

function extractJsonObject(text: string): ImageAnalysisResult {
  const trimmed = text.trim();
  let jsonStr = trimmed;
  const startIdx = trimmed.indexOf("```");
  if (startIdx !== -1) {
    const endIdx = trimmed.lastIndexOf("
```");
    if (endIdx > startIdx) {
      jsonStr = trimmed.substring(startIdx + 3, endIdx);
      if (jsonStr.toLowerCase().startsWith("json")) jsonStr = jsonStr.substring(4);
    }
  }
  const braceStart = jsonStr.indexOf("{");
  const braceEnd = jsonStr.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
    jsonStr = jsonStr.substring(braceStart, braceEnd + 1);
  }
  try {
    return JSON.parse(jsonStr) as ImageAnalysisResult;
  } catch {
    return null;
  }
}

export async function analyzeImageWithGemini(
  dataUrl: string,
  mimeTypeHint?: string
): Promise<{ result: ImageAnalysisResult; error: string | null }> {
  const apiKey = getGoogleApiKey(); 
  let lastErrorDetails = ""; 

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return { result: null, error: "이미지 데이터 형식이 올바르지 않습니다." };

  const mimeType = mimeTypeHint || match[1];
  const encodedImage = match[2];

  const prompt = `이 이미지를 분석하여 에너지 절약 행동 여부를 JSON 형식으로만 답변해줘. {"action_found": "true/false", "description": "행동 설명", "estimated_save_kwh": "숫자"}`;

  for (const model of GEMINI_VISION_MODELS) {
    try {
      const url = `${GOOGLE_API_BASE}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const payload = {
        contents: [{
          parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: encodedImage } }]
        }]
      };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(60_000), 
      });

      if (!response.ok) {
        lastErrorDetails = `[${model}] HTTP ${response.status}`;
        continue;
      }

      const resultData = await response.json();
      const resultText = resultData.candidates?.[0]?.content?.parts?.[0]?.text;
      
      const parsed = extractJsonObject(resultText || "");
      if (parsed) return { result: parsed, error: null };

    } catch (error: any) {
      lastErrorDetails = `[${model}] 예외: ${error.message}`;
      continue;
    }
  }

  return { result: null, error: `이미지 분석 실패: ${lastErrorDetails}` };
}
