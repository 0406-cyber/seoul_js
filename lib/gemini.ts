/**
 * 텍스트: Groq API (meta-llama/llama-prompt-guard-2-86m 적용)
 * 이미지 분석: Google AI Studio (기존 Gemini Vision 유지)
 */

const GOOGLE_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const GROQ_API_BASE = "https://api.groq.com/openai/v1/chat/completions";

const GROQ_MODEL = "meta-llama/llama-prompt-guard-2-86m"; 

const GEMINI_VISION_MODELS = [
  "gemini-3-flash-preview",
  "gemini-2.5-flash",
  "gemini-3.1-flash-lite-preview",
  "gemini-3.1-flash-live-preview",
];

function getGoogleApiKey(): string {
  const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!key) {
    throw new Error("NEXT_PUBLIC_GEMINI_API_KEY가 설정되지 않았습니다.");
  }
  return key.trim(); 
}

function getGroqApiKey(): string {
  const key = process.env.NEXT_PUBLIC_GROQ_API_KEY;
  if (!key) {
    throw new Error("NEXT_PUBLIC_GROQ_API_KEY가 설정되지 않았습니다. Cloudflare 환경 변수를 확인하세요.");
  }
  return key.trim(); 
}

// =====================================================================
// 1. 텍스트 로직 (Groq - Prompt Guard 모델 적용)
// =====================================================================

export async function callTextApiWithFallback(prompt: string): Promise<string> {
  try {
    const apiKey = getGroqApiKey();
    const safePrompt = prompt ? prompt.trim() : "안녕하세요.";

    const payload = {
      model: GROQ_MODEL,
      messages: [
        { role: "user", content: safePrompt }
      ],
      temperature: 0.0,
      max_tokens: 100,
    };

    const response = await fetch(GROQ_API_BASE, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      // 💡 바보같이 빼먹었던 핵심 데이터 본문(body)을 드디어 추가했습니다!!!
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000), 
    });

    if (!response.ok) {
      const errorText = await response.text();
      return `⚠️ Groq API 에러 (${response.status}):\n${errorText}`;
    }

    const result = await response.json();
    let text = result.choices?.[0]?.message?.content || "응답을 생성하지 못했습니다.";
    
    return text.trim();

  } catch (error: any) {
    return `⚠️ 텍스트 AI 호출 실패:\n${error.message}`;
  }
}

export async function getGemmaAdvice(
  elec: number,
  gas: number,
  co2: number
): Promise<string> {
  const prompt = `사용자가 이번 달에 전기 ${elec}kWh, 가스 ${gas}m3를 사용하여 총 ${co2.toFixed(2)}kg의 탄소를 배출했어. 이 사용자에게 에너지 절약을 독려하고 실생활에서 실천할 수 있는 팁을 친절하게 한국어 3문장 이내로 조언해줘.`;
  return callTextApiWithFallback(prompt);
}

export async function askGemmaCustomQuestion(userMessage: string): Promise<string> {
  return callTextApiWithFallback(userMessage);
}

// =====================================================================
// 2. 이미지 분석 로직 (기존 구글 Gemini 원본 그대로 유지)
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
    const endIdx = trimmed.lastIndexOf("```");
    if (endIdx > startIdx) {
      jsonStr = trimmed.substring(startIdx + 3, endIdx);
      if (jsonStr.toLowerCase().startsWith("json")) {
        jsonStr = jsonStr.substring(4);
      }
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
  if (!match) {
    return { result: null, error: "이미지 데이터 형식이 올바르지 않습니다." };
  }

  const mimeType = mimeTypeHint || match[1] || "image/jpeg";
  const encodedImage = match[2];

  const prompt = `이 이미지를 분석해서 사용자가 '어떤 에너지 절약 행동'을 하고 있는지 파악해줘. 그리고 그 행동으로 인해 대략 몇 kWh의 전기를 절약했을지 추정해줘. (예: 전등 끄기 1시간 = 0.05kWh 소모 가정) 답변은 반드시 아래 JSON 형식으로만 해줘. 마크다운 기호 없이 순수 JSON 텍스트만 출력해. {"action_found": "true 또는 false", "description": "어떤 행동인지 한글 설명", "estimated_save_kwh": "추정 절약량 숫자만"}`;

  for (const model of GEMINI_VISION_MODELS) {
    const url = `${GOOGLE_API_BASE}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const payload = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: encodedImage,
              },
            },
          ],
        },
      ],
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(60_000), 
      });

      if (response.status === 429) {
        lastErrorDetails = `[${model}] 429 Too Many Requests: 한도 초과`;
        continue;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        lastErrorDetails = `[${model} HTTP ${response.status}] ${errorText}`;
        continue;
      }

      const resultData = await response.json();
      const resultText = resultData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!resultText) continue;

      const parsed = extractJsonObject(resultText);
      if (parsed) {
        return { result: parsed, error: null };
      }
    } catch (error: any) {
      lastErrorDetails = `[${model} 예외 발생] ${error.message}`;
      continue;
    }
  }

  return {
    result: null,
    error: `상세 에러: ${lastErrorDetails}`,
  };
}