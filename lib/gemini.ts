  /**
   * app.py의 Gemini/Gemma 호출 로직과 동일한 동작
   * + 진짜 에러 메시지 화면 출력 기능 추가
   * + 복사 에러 방지용 안전한 파싱 로직 적용 (문자열 자르기)
   */

  // 💡 Gemma 3 등 최신 모델을 지원하는 v1alpha 주소로 변경
  const API_BASE_URL = "https://generativelanguage.googleapis.com/v1alpha/models";

  const GEMMA_MODELS = [
    "gemma-4-31b-it",     // 1순위: 최고 성능 Dense 모델
    "gemma-4-26b-a4b-it", // 2순위: 빠른 속도의 MoE 모델 (Fallback용)
  ];

  // 이미지 분석을 위한 Gemini 모델 리스트
  const GEMINI_VISION_MODELS = [
    "gemini-3-flash-preview",
    "gemini-3.1-flash-lite-preview",
    "gemini-3.1-flash-live-preview",
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
    }>;
  };

  export async function callTextApiWithFallback(
    prompt: string,
    models: string[] = GEMMA_MODELS
  ): Promise<string> {
    const apiKey = getApiKey();
    let lastErrorDetails = "알 수 없는 오류";

    for (const model of models) {
      const url = `${API_BASE_URL}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const payload = { contents: [{ parts: [{ text: prompt }] }] };

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
        let text = candidate?.content?.parts?.[0]?.text;

        // 1. 텍스트가 존재하는 경우 처리
        // callTextApiWithFallback 내부 수정
        if (text) {
          // 1. 태그 삭제
          text = text.replace(/<thought>[\s\S]*?<\/thought>/gi, "");
          
          // 2. "분석:", "Option 1:", "해설:" 등 흔한 추론 패턴 이후만 남기기
          // 보통 "최종 답변:" 이라는 문구 뒤에 진짜 답이 오도록 유도했으므로 그 부분을 찾습니다.
          const answerMarker = "최종 답변:";
          if (text.includes(answerMarker)) {
            text = text.split(answerMarker).pop() || text;
          }

          // 3. 불필요한 마크다운 기호나 줄바꿈 정리
          text = text.replace(/\*\*분석:\*\*|Analysis:|Option \d:/gi, "");
          
          return text.trim();
        }
        
        // 2. 텍스트가 없거나 차단된 경우 (Safety Filter 등)
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
    const prompt = `사용자가 이번 달에 전기 ${elec}kWh, 가스 ${gas}m3를 사용하여 총 ${co2.toFixed(2)}kg의 탄소를 배출했어. 이 사용자에게 에너지 절약을 독려하고 실생활에서 실천할 수 있는 팁을 친절하게 한국어 3문장 이내로 조언해줘.`;
    return callTextApiWithFallback(prompt, GEMMA_MODELS);
  }

  export async function askGemmaCustomQuestion(userMessage: string): Promise<string> {
  // 💡 모델이 헛소리할 틈을 주지 않는 시스템 명령문
    const systemInstruction = `[필독 지시사항]
  1. 분석, 생각 과정, 대안 제시(Option 1, 2)를 절대로 출력하지 마십시오.
  2. 인사말도 생략하고 오직 사용자의 질문에 대한 '최종 답변'만 한국어로 한두 문장 내로 즉시 출력하십시오.
  3. 마치 친구와 대화하듯 친절하지만 아주 짧게 대답하십시오.`;

    const strictPrompt = `${systemInstruction}\n\n사용자 질문: "${userMessage}"\n\n최종 답변:`;
    
    return callTextApiWithFallback(strictPrompt, GEMMA_MODELS);
  }

  export type ImageAnalysisResult = {
    action_found?: string;
    description?: string;
    estimated_save_kwh?: string;
  } | null;

  function extractJsonObject(text: string): ImageAnalysisResult {
    const trimmed = text.trim();
    let jsonStr = trimmed;

    // 복사 시 에러가 나지 않도록 특수기호를 빼고 indexOf 방식 적용
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
          signal: AbortSignal.timeout(30_000),
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