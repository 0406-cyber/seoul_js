const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

const GEMMA_MODELS = [
  "gemma-3-27b-it",
  "gemma-3-12b-it",
  "gemma-3-4b-it",
  "gemma-3-1b-it",
  "gemma-4-31b-it",
  "gemma-4-26b-a4b-it",
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
    throw new Error("NEXT_PUBLIC_GEMINI_API_KEY가 설정되지 않았습니다.");
  }
  return key;
}

type GenerateContentResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
};

// 💡 시스템 명령(페르소나) 추가
const SYSTEM_INSTRUCTION = `당신은 서울시 기획봉사단 'SEOUL EnerView'의 친절하고 전문적인 AI 에너지 코치입니다.
절대 사고 과정(Thought Process)이나 내면의 생각, 영어 해석 과정을 사용자에게 보여주지 마십시오.
어떤 질문이 오더라도 항상 부드럽고 긍정적인 '한국어'로만 최종 결과물만 바로 대답하십시오.`;

export async function callTextApiWithFallback(
  prompt: string,
  models: string[] = GEMMA_MODELS
): Promise<string> {
  const apiKey = getApiKey();
  let lastErrorDetails = "";

  for (const model of models) {
    const url = `${API_BASE_URL}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    
    // 💡 payload에 시스템 명령과 모델에게 줄 강력한 제약 조건을 포함합니다.
    const payload = { 
      system_instruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }]
      },
      contents: [{ 
        role: "user",
        parts: [{ text: prompt }] 
      }],
      generationConfig: {
        temperature: 0.7, // 너무 창의적으로 나가는 것을 방지
      }
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(120_000), 
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

      const result = (await response.json()) as GenerateContentResponse;
      let text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      // 💡 만약 모델이 말을 안 듣고 <think> 같은 태그로 생각을 적었을 경우를 대비해 필터링 (최후의 방어선)
      text = text.replace(/<think>[\s\S]*?<\/think>\n*/g, "").trim();
      
      if (text) return text;
    } catch (error: any) {
      lastErrorDetails = `[${model} 예외 발생] ${error.message}`;
      continue;
    }
  }

  return `⚠️ AI 호출 실패 원인:\n\n${lastErrorDetails}`;
}

export async function getGemmaAdvice(
  elec: number,
  gas: number,
  co2: number
): Promise<string> {
  const prompt = `사용자가 이번 달에 전기 ${elec}kWh, 가스 ${gas}m3를 사용하여 총 ${co2.toFixed(2)}kg의 탄소를 배출했어. 이 사용자에게 에너지 절약을 독려하고 실생활에서 실천할 수 있는 팁을 친절하게 한국어 3문장 이내로 조언해줘.`;
  return callTextApiWithFallback(prompt, GEMMA_MODELS);
}

export async function askGemmaCustomQuestion(userMessage: string): Promise<string> {
  // 사용자의 메시지에 한 번 더 쐐기를 박습니다.
  const fortifiedMessage = `[절대 사고 과정을 노출하지 말고, 최종 결과만 한국어로 짧고 친절하게 대답해라] ${userMessage}`;
  return callTextApiWithFallback(fortifiedMessage, GEMMA_MODELS);
}

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
  const apiKey = getApiKey();
  let lastErrorDetails = ""; 

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return { result: null, error: "이미지 데이터 형식이 올바르지 않습니다." };
  }

  const mimeType = mimeTypeHint || match[1] || "image/jpeg";
  const encodedImage = match[2];

  const prompt = `이 이미지를 분석해서 사용자가 '어떤 에너지 절약 행동'을 하고 있는지 파악해줘. 그리고 그 행동으로 인해 대략 몇 kWh의 전기를 절약했을지 추정해줘. (예: 전등 끄기 1시간 = 0.05kWh 소모 가정) 답변은 반드시 아래 JSON 형식으로만 해줘. 마크다운 기호 없이 순수 JSON 텍스트만 출력해. {"action_found": "true 또는 false", "description": "어떤 행동인지 한글 설명", "estimated_save_kwh": "추정 절약량 숫자만"}`;

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
        signal: AbortSignal.timeout(120_000), 
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

      const resultData = (await response.json()) as GenerateContentResponse;
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
