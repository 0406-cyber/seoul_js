/**
 * app.py의 Gemini/Gemma 호출 로직과 동일한 동작
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

      if (response.status === 429) continue;

      if (!response.ok) continue;

      const result = (await response.json()) as GenerateContentResponse;
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch {
      continue;
    }
  }

  return "⚠️ 모든 텍스트 AI 모델 호출에 실패했습니다. API 키나 한도를 확인하세요.";
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

  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) {
    jsonStr = fence[1].trim();
  }

  const brace = jsonStr.match(/\{[\s\S]*\}/);
  if (brace) {
    jsonStr = brace[0];
  }

  try {
    return JSON.parse(jsonStr) as ImageAnalysisResult;
  } catch {
    return null;
  }
}

/** app.py analyze_image_with_gemini — dataUrl: data:image/jpeg;base64,... */
export async function analyzeImageWithGemini(
  dataUrl: string,
  mimeTypeHint?: string
): Promise<{ result: ImageAnalysisResult; error: string | null }> {
  const apiKey = getApiKey();

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return { result: null, error: "이미지 데이터 형식이 올바르지 않습니다." };
  }

  const mimeType = mimeTypeHint || match[1] || "image/jpeg";
  const encodedImage = match[2];

  const prompt = `
    이 이미지를 분석해서 사용자가 '어떤 에너지 절약 행동'을 하고 있는지 파악해줘.
    그리고 그 행동으로 인해 대략 몇 kWh의 전기를 절약했을지 추정해줘. (예: 전등 끄기 1시간 = 0.05kWh 소모 가정)
    답변은 반드시 아래 JSON 형식으로만 해줘. 마크다운 기호 없이 순수 JSON 텍스트만 출력해.

    {
      "action_found": "true 또는 false",
      "description": "어떤 행동인지 한글 설명 (예: 빈 방 불 끄기)",
      "estimated_save_kwh": "추정 절약량 숫자만 (예: 0.1)"
    }
    `;

  for (const model of GEMINI_VISION_MODELS) {
    const url = `${API_BASE_URL}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
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
        signal: AbortSignal.timeout(30_000),
      });

      if (response.status === 429) continue;
      if (!response.ok) continue;

      const resultData = (await response.json()) as GenerateContentResponse;
      const resultText =
        resultData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!resultText) continue;

      const parsed = extractJsonObject(resultText);
      if (parsed) {
        return { result: parsed, error: null };
      }
    } catch {
      continue;
    }
  }

  return {
    result: null,
    error:
      "⚠️ 모든 AI 모델 호출에 실패했습니다. API 연결 상태를 확인하세요.",
  };
}
