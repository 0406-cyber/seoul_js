import { GoogleGenAI } from "@google/genai";
import { getRequestContext } from '@cloudflare/next-on-pages';

const GEMMA_MODELS = [
  "gemma-4-31b-it",     
  "gemma-4-26b-a4b-it", 
];

const GEMINI_VISION_MODELS = [
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite-preview",
  "gemini-2.5-flash-lite",
];

let aiInstance: any = null;

function getAI() {
  if (!aiInstance) {
    let key = undefined;
    
    // Cloudflare Pages 런타임 암호화 변수(Secrets) 우선 로드
    try {
      const context = getRequestContext();
      if (context && context.env) {
        key = context.env.GEMINI_API_KEY || context.env.NEXT_PUBLIC_GEMINI_API_KEY;
      }
    } catch (e) {
      // 컴파일 타임 대응 예외처리
    }
    
    // 로컬 환경 또는 하위 호환성용 대피책
    if (!key) {
      key = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    }
    
    if (!key) {
      console.error("⚠️ Gemini API Key가 설정되지 않았습니다.");
      return null;
    }
    
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
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
      const response = await ai.models.generateContent({
        model: modelName,
        systemInstruction: systemInstruction,
        contents: prompt,
        config: {
          temperature: 0.6,
        }
      });

      if (response && response.text) {
        return response.text.trim();
      }
    } catch (error: any) {
      lastErrorDetails = `[${modelName} 예외 발생] ${error.message}`;
      continue;
    }
  }

  return `⚠️ AI 호출 실패 원인:\n\n${lastErrorDetails}`;
}

export async function getGemmaAdvice(elec: number, gas: number, co2: number): Promise<string> {
  const prompt = `사용자가 이번 달에 전기 ${elec}kWh, 가스 ${gas}m3를 사용하여 총 ${co2.toFixed(2)}kg의 탄소를 배출했어. 이 사용자에게 에너지 절약을 독려하고 실생활에서 실천할 수 있는 팁을 친절하게 한국어로 조언해줘.`;
  const systemInstruction = "너는 에너지 절약 전문가야. 분석과 따뜻한 조언을 한국어로만 짧게 말해줘.";
  return callTextApiWithFallback(prompt, GEMMA_MODELS, systemInstruction);
}

export async function askGemmaCustomQuestion(userMessage: string): Promise<string> {
  const systemInstruction = "너는 친구 같은 AI야. 사용자의 말에 대한 최종 답변만 한국어로 친절하게 짧게 대답해.";
  return callTextApiWithFallback(userMessage, GEMMA_MODELS, systemInstruction);
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

/**
 * 멀티턴 대화 내역을 포함하여 스트리밍 방식으로 답변을 반환하는 제너레이터 함수
 */
export async function* streamChatWithMessage(
  message: string,
  history: { role: "user" | "model"; parts: { text: string }[] }[] = [],
  modelName: string = "gemini-3-flash-preview"
) {
  const ai = getAI();
  if (!ai) throw new Error("⚠️ Gemini API Key가 설정되지 않았습니다.");

  const chat = ai.chats.create({
    model: modelName,
    history: history,
  });

  const stream = await chat.sendMessageStream({ message });

  for await (const chunk of stream) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
}