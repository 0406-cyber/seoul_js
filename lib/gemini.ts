import { GoogleGenAI } from "@google/genai";

/**
 * @google/genai SDK를 사용하여 모델의 응답을 가져옵니다.
 * 싱글톤 인스턴스를 통해 API 키 누락으로 인한 런타임 에러를 방지합니다.
 */

const GEMMA_MODELS = [
  "gemma-4-31b-it",     // 1순위
  "gemma-4-26b-a4b-it", // 2순위
];

const GEMINI_VISION_MODELS = [
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite-preview",
  "gemini-2.5-flash-lite",
];

// 싱글톤 인스턴스 관리
let aiInstance: any = null;

function getAI() {
  if (!aiInstance) {
    // Cloudflare Pages 환경 변수 우선 순위 설정
    const key = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!key) {
      console.error("⚠️ Gemini API Key가 설정되지 않았습니다.");
      return null;
    }
    
    // @google/genai SDK는 객체 형태로 키를 받습니다.
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
}

/**
 * AI 응답에서 남을 수 있는 추론 태그 및 불필요한 메타데이터(User:, Draft: 등)를 제거합니다.
 */
function finalCleanUp(text: string): string {
  if (!text) return "";
  let cleaned = text;

  // 1. 태그 및 생각 블록 제거 (<thought>, ```thought)
  cleaned = cleaned.replace(/<thought>[\s\S]*?<\/thought>/gi, "");
  cleaned = cleaned.replace(/
```thought[\s\S]*?```/gi, "");

  // 2. 줄 단위 정제 (한글이 포함된 실제 답변 줄만 추출)
  const lines = cleaned.split("\n");
  const filteredLines = lines.filter(line => {
    const trimmed = line.trim();
    if (!trimmed) return false;

    const blacklist = ["User:", "Example:", "Draft", "Response:", "Analysis:", "Goal:", "Constraint:"];
    const isBlacklisted = blacklist.some(k => trimmed.toLowerCase().includes(k.toLowerCase()));
    const hasKorean = /[가-힣]/.test(trimmed);
    
    return !isBlacklisted && hasKorean;
  });

  // 모든 줄을 합친 후 괄호 안의 영어 번역 등을 제거
  cleaned = filteredLines.join(" ").trim();
  cleaned = cleaned.replace(/\s*\([A-Za-z0-9\s.,!?'"]+\)/g, ""); 
  
  return cleaned.replace(/^[*"' ]+|[*"' ]+$/g, ""); // 앞뒤 특수기호 정리
}

/**
 * 텍스트 API 호출 (Fallback 포함)
 */
export async function callTextApiWithFallback(
  prompt: string,
  models: string[] = GEMMA_MODELS,
  systemInstruction: string = "너는 친절한 AI 어시스턴트야. 생각 과정은 생략하고 한국어로 최종 답변만 해줘."
): Promise<string> {
  const ai = getAI();
  if (!ai) return "⚠️ API 키 설정 오류 (환경 변수를 확인하세요)";

  let lastErrorDetails = "알 수 없는 오류";

  for (const modelName of models) {
    try {
      // @google/genai 최신 호출 방식 적용
      const response = await ai.models.generateContent({
        model: modelName,
        systemInstruction: systemInstruction,
        contents: prompt,
        config: {
          stopSequences: ["\n\n"],
          temperature: 0.4,
          maxOutputTokens: 500,
        }
      });

      // SDK가 1차적으로 정제한 텍스트 추출
      const text = response.text;

      if (text) {
        return finalCleanUp(text); // 2차 최종 정제 후 반환
      }
    } catch (error: any) {
      lastErrorDetails = `[${modelName} 예외 발생] ${error.message}`;
      continue;
    }
  }

  return `⚠️ AI 호출 실패 원인:\n\n${lastErrorDetails}`;
}

export async function getGemmaAdvice(elec: number, gas: number, co2: number): Promise<string> {
  const prompt = `사용자가 이번 달에 전기 ${elec}kWh, 가스 ${gas}m3를 사용하여 총 ${co2.toFixed(2)}kg의 탄소를 배출했어. 이 사용자에게 에너지 절약을 독려하고 실생활에서 실천할 수 있는 팁을 친절하게 한국어 3문장 이내로 조언해줘.`;
  const systemInstruction = "너는 에너지 절약 전문가야. 분석 단계 없이 따뜻한 조언을 한국어로만 말해줘.";
  return callTextApiWithFallback(prompt, GEMMA_MODELS, systemInstruction);
}

export async function askGemmaCustomQuestion(userMessage: string): Promise<string> {
  const systemInstruction = "너는 친구 같은 AI야. 분석이나 생각 과정 없이 오직 사용자의 말에 대한 최종 답변만 한국어로 친절하게 대답해.";
  return callTextApiWithFallback(userMessage, GEMMA_MODELS, systemInstruction);
}

// 이미지 분석 결과 타입
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
      if (jsonStr.toLowerCase().startsWith("json")) jsonStr = jsonStr.substring(4);
    }
  }
  const braceStart = jsonStr.indexOf("{");
  const braceEnd = jsonStr.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
    jsonStr = jsonStr.substring(braceStart, braceEnd + 1);
  }
  try { return JSON.parse(jsonStr) as ImageAnalysisResult; } catch { return null; }
}

export async function analyzeImageWithGemini(
  dataUrl: string,
  mimeTypeHint?: string
): Promise<{ result: ImageAnalysisResult; error: string | null }> {
  const ai = getAI();
  if (!ai) return { result: null, error: "API 키 설정 오류" };

  let lastErrorDetails = ""; 
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return { result: null, error: "이미지 데이터 형식이 올바르지 않습니다." };

  const mimeType = mimeTypeHint || match[1] || "image/jpeg";
  const encodedImage = match[2];

  for (const modelName of GEMINI_VISION_MODELS) {
    try {
      const prompt = `이미지를 분석해서 에너지 절약 행동을 파악하고 JSON으로만 답변해: {"action_found": "true/false", "description": "설명", "estimated_save_kwh": "숫자"}`;

      // SDK 방식의 멀티모달 호출
      const result = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              { inlineData: { data: encodedImage, mimeType } }
            ]
          }
        ]
      });

      const resultText = result.text;
      if (!resultText) continue;

      const parsed = extractJsonObject(resultText);
      if (parsed) return { result: parsed, error: null };
    } catch (error: any) {
      lastErrorDetails = `[${modelName} 예외 발생] ${error.message}`;
      continue;
    }
  }
  return { result: null, error: `상세 에러: ${lastErrorDetails}` };
}