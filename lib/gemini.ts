/**
 * app.py의 Gemini/Gemma 호출 로직과 동일한 동작
 * + 실시간 추론 과정(Thought Process) 및 쓰레기 텍스트 제거 필터 적용
 * + 진짜 에러 메시지 화면 출력 기능 추가
 * + 복사 에러 방지용 안전한 파싱 로직 적용
 */

const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

const GEMMA_MODELS = [
  "gemma-4-31b-it",     // 1순위: 최고 성능 Dense 모델
  "gemma-4-26b-a4b-it", // 2순위: 빠른 속도의 MoE 모델
];

const GEMINI_VISION_MODELS = [
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite-preview",
  "gemini-2.5-flash-lite",
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
    finishReason?: string;
  }>;
};
function cleanAiResponse(text: string): string {
  if (!text) return "";

  let cleaned = text;

  try {
    // 1. 생각 과정 태그 및 블록 삭제
    cleaned = cleaned.replace(/<(thought|details)>[\s\S]*?<\/\1>/gi, "");
    cleaned = cleaned.replace(/```thought[\s\S]*?```/gi, "");

    // 2. 줄 단위 정제
    const lines = cleaned.split("\n");
    const filteredLines = lines.map(line => {
      let trimmed = line.trim();
      
      // 🚫 블랙리스트 키워드 포함 시 삭제
      const blacklist = ["User:", "Example:", "Response:", "Analysis:", "Tone:"];
      if (blacklist.some(k => trimmed.toLowerCase().startsWith(k.toLowerCase()))) return "";

      // 🚫 괄호 안에 한글이 없는 "영어 주석" (예: (Advice/Closing)) 강제 삭제
      // [^가-힣]은 한글이 없는 문자열을 의미하며, / 기호 등 특수문자도 포함합니다.
      trimmed = trimmed.replace(/\s*\([^가-힣]+\)/g, "");

      // 🚫 문장 시작의 번호(1., 2.)나 기호(*, -) 삭제 (선택 사항)
      trimmed = trimmed.replace(/^[0-9+*-]+[\s.)]+/, "");

      return trimmed;
    }).filter(line => line.length > 0 && /[가-힣]/.test(line)); // 한글이 포함된 유효한 줄만 남김

    // 3. 마지막 줄만 가져오는 대신, 모든 유효한 문장을 합칩니다.
    cleaned = filteredLines.join(" ");

    // 4. 앞뒤 불필요한 기호 정리
    cleaned = cleaned.replace(/^[*"' ]+|[*"' ]+$/g, "");

  } catch (e) {
    console.error("정제 로직 에러:", e);
  }

  return cleaned.trim();
}

export async function callTextApiWithFallback(
  prompt: string,
  models: string[] = GEMMA_MODELS,
  systemInstruction: string = "너는 친절한 AI 어시스턴트야. 생각 과정, 분석, 옵션 제시는 절대로 출력하지 말고 오직 한국어 최종 답변만 말해."
): Promise<string> {
  const apiKey = getApiKey();
  let lastErrorDetails = "알 수 없는 오류";

  for (const model of models) {
    const url = `${API_BASE_URL}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    
    const payload = {
      system_instruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.6, // 온도를 낮춰서 헛소리 확률 감소
      }
    };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      lastErrorDetails = `[${model} HTTP ${response.status}] ${errorText}`;
      continue;
    }

    const result = (await response.json()) as GenerateContentResponse;
    const candidate = result.candidates?.[0];
    const rawText = candidate?.content?.parts?.[0]?.text;

    if (rawText) {
      // 💡 여기서 정제 로직 실행
      const filteredText = cleanAiResponse(rawText);
      if (filteredText) return filteredText;
    }
    
    const finishReason = candidate?.finishReason || "REASON_UNKNOWN";
    lastErrorDetails = `[${model}] 답변 생성 실패 (사유: ${finishReason})`;
    continue;
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
  const prompt = `사용자가 이번 달에 전기 ${elec}kWh, 가스 ${gas}m3를 사용하여 총 ${co2.toFixed(2)}kg의 탄소를 배출했어. 이 사용자에게 에너지 절약을 독려하고 실생활에서 실천할 수 있는 팁을 친절하게 한국어로 조언해줘.`;
  
  // 💡 getGemmaAdvice 전용 시스템 지침 강화
  const systemInstruction = "너는 에너지 절약 전문가야. 분석이나 옵션, 사용자에게 건네는 따뜻한 조언 등을 말해줘.";
  return callTextApiWithFallback(prompt, GEMMA_MODELS, systemInstruction);
}

export async function askGemmaCustomQuestion(userMessage: string): Promise<string> {
  const systemInstruction = "너는 친구 같은 AI야. 분석, 생각 과정, 대안 제시를 절대로 하지 마. 오직 사용자의 말에 대한 최종 답변만 친절하게 한국어로 한 줄로 대답해.";
  return callTextApiWithFallback(userMessage, GEMMA_MODELS, systemInstruction);
}

// --- 아래는 이미지 분석 관련 (기존 로직 유지) ---

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

  const prompt = `이미지 분석 후 다음 JSON만 출력: {"action_found": "true/false", "description": "설명", "estimated_save_kwh": "숫자"}`;

  for (const model of GEMINI_VISION_MODELS) {
    const url = `${API_BASE_URL}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const payload = {
      contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: encodedImage } }
          ]
      }]
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        lastErrorDetails = `[${model} HTTP ${response.status}] ${errorText}`;
        continue;
      }

      const resultData = (await response.json()) as GenerateContentResponse;
      const resultText = resultData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!resultText) continue;

      const parsed = extractJsonObject(resultText);
      if (parsed) return { result: parsed, error: null };
    } catch (error: any) {
      lastErrorDetails = `[${model} 예외 발생] ${error.message}`;
      continue;
    }
  }

  return { result: null, error: `상세 에러: ${lastErrorDetails}` };
}