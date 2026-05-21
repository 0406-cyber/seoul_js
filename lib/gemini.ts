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
  "gemini-3.5-flash"
];

let aiInstance: any = null;

function getAI() {
  if (!aiInstance) {
    let key = undefined;
    try {
      const context = getRequestContext();
      if (context && context.env) {
        key = context.env.GEMINI_API_KEY || context.env.NEXT_PUBLIC_GEMINI_API_KEY;
      }
    } catch (e) {}
    
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
        config: { temperature: 0.6 }
      });
      if (response && response.text) return response.text.trim();
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
      const prompt = `이미지를 분석해서 에너지 절약 행동을 파악해 주세요.`;
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              { inlineData: { data: encodedImage, mimeType } }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              action_found: { type: "STRING" },
              description: { type: "STRING" },
              estimated_save_kwh: { type: "STRING" }
            },
            required: ["action_found", "description", "estimated_save_kwh"]
          }
        }
      });
      if (response && response.text) {
        return { result: JSON.parse(response.text) as ImageAnalysisResult, error: null };
      }
    } catch (error: any) {
      lastErrorDetails = `[${modelName} 예외 발생] ${error.message}`;
      continue;
    }
  }
  return { result: null, error: `상세 에러: ${lastErrorDetails}` };
}

/**
 * 멀티턴 대화 내역을 포함하여 스트리밍 방식으로 답변을 반환 (Reasoning Chain JSON 프로토콜 반영)
 */
export async function* streamChatWithMessage(
  message: string,
  history: { role: "user" | "model"; parts: { text: string }[] }[] = [],
  modelName: string = "gemini-3-flash-preview"
) {
  const ai = getAI();
  if (!ai) throw new Error("⚠️ Gemini API Key가 설정되지 않았습니다.");

  const enerviewTools = [
    {
      functionDeclarations: [
        {
          name: "getUsageHistory",
          description: "사용자의 과거 전기 사용량, 가스 사용량 및 탄소 배출량 이력을 데이터베이스에서 직접 조회합니다.",
          parameters: {
            type: "OBJECT",
            properties: {
              username: { type: "STRING", description: "조회할 대상 사용자의 닉네임" }
            },
            required: ["username"]
          }
        },
        {
          name: "getPointLogs",
          description: "사용자가 에너뷰 앱 내에서 획득하거나 사용한 포인트 내역 히스토리를 조회합니다.",
          parameters: {
            type: "OBJECT",
            properties: {
              username: { type: "STRING", description: "포인트를 조회할 대상 사용자의 닉네임" }
            },
            required: ["username"]
          }
        }
      ]
    }
  ];

  const chat = ai.chats.create({
    model: modelName,
    history: history,
    config: {
      tools: enerviewTools, 
      systemInstruction: "너는 친환경 에너지 가이드 에너뷰(Enerview) 코치야. 사용자가 과거 기록이나 포인트 조회를 요청하면 관련 함수를 알아서 호출해줘. 모든 답변은 따뜻한 한국어로 해줘. 답변하기 전에 단계적으로 추론하는 경우 추론 과정을 충실히 보여줘."
    }
  });

  const stream = await chat.sendMessageStream({ message });

  for await (const chunk of stream) {
    // 1. 만약 엔진 내부의 구조적 추론 파트(Thought)가 있다면 생각 스트림으로 전송
    const candidate = chunk.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.thought && part.text) {
          yield JSON.stringify({ type: "think", text: part.text }) + "\n";
        }
      }
    }

    // 2. 데이터베이스 함수 호출이 트리거된 경우 시스템 가동 과정을 생각 스트림으로 전환 전송
    if (chunk.functionCalls && chunk.functionCalls.length > 0) {
      for (const call of chunk.functionCalls) {
        let functionResult = null;
        try {
          const args = call.args as any;
          const targetUser = args.username;
          
          yield JSON.stringify({ type: "think", text: `\n[에너뷰 시스템 인프라 연동] 데이터베이스에서 '${call.name}' 함수를 활성화하여 '${targetUser}' 님의 리얼타임 이력을 매핑하고 있습니다...\n` }) + "\n";

          if (call.name === "getUsageHistory") {
            const { getUsageHistory } = await import("./db");
            functionResult = await getUsageHistory(targetUser);
          } else if (call.name === "getPointLogs") {
            const { getPointLogs } = await import("./db");
            functionResult = await getPointLogs(targetUser);
          }

          const followUpStream = await chat.sendMessageStream({
            message: [
              {
                functionResponse: {
                  id: call.id,
                  name: call.name,
                  response: { result: functionResult || "조회된 데이터가 없습니다." }
                }
              }
            ]
          });

          for await (const followUpChunk of followUpStream) {
            if (followUpChunk.text) {
              yield JSON.stringify({ type: "text", text: followUpChunk.text }) + "\n";
            }
          }
        } catch (err: any) {
          yield JSON.stringify({ type: "text", text: `\n⚠️ 내부 데이터 조회 실패: ${err.message}\n` }) + "\n";
        }
      }
    }

    // 3. 일반 최종 텍스트 출력
    if (chunk.text) {
      yield JSON.stringify({ type: "text", text: chunk.text }) + "\n";
    }
  }
}

