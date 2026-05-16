"use server";

export type UsageRow = {
  username: string;
  date: string;
  elec_kwh: number;
  gas_m3: number;
  co2_kg: number;
};

// CO2 계산 함수
export async function computeCo2Kg(elecKwh: number, gasM3: number): Promise<number> {
  return elecKwh * 0.4781 + gasM3 * 2.176;
}

function safeNum(val: any): number {
  const n = parseFloat(String(val).replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? 0 : n;
}

function todayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// 안전하게 정수로 변환하는 헬퍼 함수 (NaN 방지)
function safeParseInt(val: any): number {
  if (val === undefined || val === null || val === "") return 0;
  const cleaned = String(val).replace(/[^0-9.-]/g, "");
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

// 안전하게 소수로 변환하는 헬퍼 함수 (NaN 방지)
function safeParseFloat(val: any): number {
  if (val === undefined || val === null || val === "") return 0;
  const cleaned = String(val).replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

// ==========================================
// 🚀 Edge 호환용 경량화 JWT(토큰) 발급기
// ==========================================
function base64urlEncode(str: string) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlEncodeBuffer(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getAccessToken() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const spreadsheetId = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_SPREADSHEET_ID;

  if (!clientEmail || !privateKey || !spreadsheetId) {
    throw new Error("서버 환경 변수가 누락되었습니다.");
  }

  try {
    // 1. JWT 헤더(Header) 생성
    const header = { alg: "RS256", typ: "JWT" };
    // 2. JWT 페이로드(Payload) 생성
    const now = Math.floor(Date.now() / 1000);
    const claimSet = {
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    };

    const encodedHeader = base64urlEncode(JSON.stringify(header));
    const encodedClaimSet = base64urlEncode(JSON.stringify(claimSet));
    const signatureInput = `${encodedHeader}.${encodedClaimSet}`;

    // 3. 비밀키 텍스트 정제 (헤더, 푸터, 줄바꿈 제거)
    const pemContents = privateKey
      .replace(/-----BEGIN PRIVATE KEY-----/g, "")
      .replace(/-----END PRIVATE KEY-----/g, "")
      .replace(/\s/g, "");
      
    // 4. Web Crypto API를 사용한 서명 (가장 빠르고 가벼움)
    const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
    const cryptoKey = await globalThis.crypto.subtle.importKey(
      "pkcs8",
      binaryDer.buffer,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await globalThis.crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      new TextEncoder().encode(signatureInput)
    );

    const jwt = `${signatureInput}.${base64urlEncodeBuffer(signature)}`;

    // 5. 생성된 JWT를 구글에 보내 진짜 Access Token으로 교환
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`구글 토큰 발급 실패: ${errText}`);
    }

    const data = await res.json();
    return { token: data.access_token, spreadsheetId };
  } catch (err: any) {
    throw new Error(`인증 에러: ${err.message}`);
  }
}
// ==========================================

/** 데이터 저장 기능 */
export async function saveUsage(username: string, elec: number, gas: number, co2: number): Promise<void> {
  try {
    const { token, spreadsheetId } = await getAccessToken();
    const range = encodeURIComponent("usage!A:E");
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

    // 숫자를 문자열로 안전하게 변환하여 전송
    const values = [[
      username, 
      todayYmd(), 
      String(safeNum(elec)), 
      String(safeNum(gas)), 
      String(safeNum(co2.toFixed(2)))
    ]];

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values }),
    });

    if (!response.ok) {
      const errorDetail = await response.text();
      throw new Error(`시트 저장 실패: ${errorDetail}`);
    }
  } catch (err: any) {
    console.error("saveUsage 에러 상세:", err.message);
    throw err;
  }
}

/** 로그인 및 횟수 업데이트 */
export async function loginUser(username: string): Promise<void> {
  const { token, spreadsheetId } = await getAccessToken();
  const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/users!A:C?t=${Date.now()}`;
  
  const getRes = await fetch(getUrl, { headers: { Authorization: `Bearer ${token}` }});
  const data = await getRes.json();
  const rows = data.values || [];

  let rowIndex = -1;
  let currentLogins = 0;

  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === username) {
      rowIndex = i + 1;
      currentLogins = safeParseInt(rows[i][1]); 
      break;
    }
  }

  if (rowIndex !== -1) {
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/users!B${rowIndex}?valueInputOption=USER_ENTERED`;
    await fetch(updateUrl, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values: [[currentLogins + 1]] })
    });
  } else {
    const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/users!A:C:append?valueInputOption=USER_ENTERED`;
    await fetch(appendUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values: [[username, 1, 100]] }) 
    });
  }
}

/** 포인트 업데이트 */
export async function updateUserPoints(username: string, points: number): Promise<void> {
  const { token, spreadsheetId } = await getAccessToken();
  const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/users!A:C?t=${Date.now()}`; 
  
  const getRes = await fetch(getUrl, { headers: { Authorization: `Bearer ${token}` }});
  const data = await getRes.json();
  const rows = data.values || [];

  let rowIndex = -1;
  let currentPoints = 0;

  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === username) {
      rowIndex = i + 1;
      currentPoints = safeParseInt(rows[i][2]);
      break;
    }
  }

  if (rowIndex !== -1) {
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/users!C${rowIndex}?valueInputOption=USER_ENTERED`;
    await fetch(updateUrl, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values: [[currentPoints + points]] })
    });
  }
}

/** 리더보드 가져오기 */
export async function getLeaderboardViaApi(): Promise<any[]> {
  try {
    const { token, spreadsheetId } = await getAccessToken();
    const range = encodeURIComponent("users!A:C");
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?t=${Date.now()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });

    if (!response.ok) throw new Error(`서버 응답 에러: ${response.status}`);

    const data = await response.json();
    const rows = data.values || [];
    
    if (rows.length <= 1) return [];

    return rows.slice(1).map((row: any, index: number) => {
      const p = safeParseInt(row[2]);
      const logins = safeParseInt(row[1]);

      return {
        id: `user-${index}`,
        name: row[0] || "이름 없음",
        loginCount: logins,
        points: p,
        carbonSaved: Math.floor(p / 50),
        streak: 1
      };
    }).sort((a: any, b: any) => b.points - a.points);
  } catch (error: any) {
    throw new Error(error.message);
  }
}

/** 포인트 상세 내역 저장 (logs 탭) */
export async function savePointLog(username: string, description: string, amount: number): Promise<void> {
  const { token, spreadsheetId } = await getAccessToken();
  const range = encodeURIComponent("logs!A:D");
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

  const dateStr = new Date().toLocaleDateString("ko-KR") + " " + new Date().toLocaleTimeString("ko-KR", {hour: '2-digit', minute:'2-digit'});
  const values = [[username, dateStr, description, String(amount)]];

  await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ values }),
  });
}

/** 포인트 상세 내역 불러오기 (logs 탭) */
export async function getPointLogs(username: string): Promise<any[]> {
  try {
    const { token, spreadsheetId } = await getAccessToken();
    const range = encodeURIComponent("logs!A:D");
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?t=${Date.now()}`;

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, "cache": "no-store" } });
    const data = await res.json();
    const rows = data.values || [];
    if (rows.length <= 1) return [];

    return rows.slice(1)
      .filter((row: any) => row[0] === username)
      .map((row: any, index: number) => ({
        id: `log-${index}`,
        date: row[1] || "",
        description: row[2] || "",
        amount: parseInt(row[3], 10) || 0
      })).reverse(); 
  } catch (e) {
    return [];
  }
}

/** 피드 관련 코드 (생략 안함) */
export async function getFeedPostsViaApi(): Promise<any[]> {
  try {
    const { token, spreadsheetId } = await getAccessToken();
    const range = encodeURIComponent("feed!A:G");
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?t=${Date.now()}`;

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, "cache": "no-store" } });
    const data = await res.json();
    const rows = data.values || [];
    if (rows.length <= 1) return [];

    return rows.slice(1)
      .filter((row: any) => row[0] && String(row[0]).trim() !== "") 
      .map((row: any) => ({
        id: row[0],
        author: row[1],
        title: row[2],
        body: row[3],
        imageDataUrl: row[4] || undefined,
        createdAt: Number(row[5]) || Date.now(),
        likedBy: row[6] ? JSON.parse(row[6]) : []
      })).reverse();
  } catch (e) {
    return [];
  }
}

export async function editFeedPostViaApi(postId: string, title: string, body: string): Promise<void> {
  const { token, spreadsheetId } = await getAccessToken();
  const range = encodeURIComponent("feed!A:G");
  const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?t=${Date.now()}`;
  const getRes = await fetch(getUrl, { headers: { Authorization: `Bearer ${token}`, "cache": "no-store" } });
  const data = await getRes.json();
  const rows = data.values || [];

  let rowIndex = -1;
  for(let i = 0; i < rows.length; i++) {
    if(rows[i][0] === postId) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex !== -1) {
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/feed!C${rowIndex}:D${rowIndex}?valueInputOption=USER_ENTERED`;
    await fetch(updateUrl, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values: [[title, body]] })
    });
  }
}

export async function deleteFeedPostViaApi(postId: string): Promise<void> {
  const { token, spreadsheetId } = await getAccessToken();
  const range = encodeURIComponent("feed!A:G");
  const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?t=${Date.now()}`;
  const getRes = await fetch(getUrl, { headers: { Authorization: `Bearer ${token}`, "cache": "no-store" } });
  const data = await getRes.json();
  const rows = data.values || [];

  let rowIndex = -1;
  for(let i = 0; i < rows.length; i++) {
    if(rows[i][0] === postId) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex !== -1) {
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/feed!A${rowIndex}:G${rowIndex}?valueInputOption=USER_ENTERED`;
    await fetch(updateUrl, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values: [["", "", "", "", "", "", ""]] }) 
    });
  }
}

export async function saveFeedPostViaApi(post: any): Promise<void> {
  const { token, spreadsheetId } = await getAccessToken();
  const range = encodeURIComponent("feed!A:G");
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

  const values = [[
    post.id,
    post.author,
    post.title,
    post.body,
    post.imageDataUrl || "",
    String(post.createdAt),
    JSON.stringify(post.likedBy || [])
  ]];

  await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ values }),
  });
}

export async function updateFeedPostLikesViaApi(postId: string, likedBy: string[]): Promise<void> {
  const { token, spreadsheetId } = await getAccessToken();
  const range = encodeURIComponent("feed!A:G");
  const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?t=${Date.now()}`;
  const getRes = await fetch(getUrl, { headers: { Authorization: `Bearer ${token}`, "cache": "no-store" } });
  const data = await getRes.json();
  const rows = data.values || [];

  let rowIndex = -1;
  for(let i = 0; i < rows.length; i++) {
    if(rows[i][0] === postId) {
      rowIndex = i + 1;
      break;
    }
  }
  
  if (rowIndex !== -1) {
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/feed!G${rowIndex}?valueInputOption=USER_ENTERED`;
    await fetch(updateUrl, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values: [[JSON.stringify(likedBy)]] })
    });
  }
}

export async function getAllPointLogs(): Promise<any[]> {
  try {
    const { token, spreadsheetId } = await getAccessToken();
    const range = encodeURIComponent("logs!A:D");
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?t=${Date.now()}`;

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, "cache": "no-store" } });
    const data = await res.json();
    const rows = data.values || [];
    if (rows.length <= 1) return [];

    return rows.slice(1)
      .map((row: any, index: number) => ({
        id: `log-${index}`,
        username: row[0] || "알 수 없음",
        date: row[1] || "",
        description: row[2] || "",
        amount: parseInt(row[3], 10) || 0
      })).reverse(); 
  } catch (e) {
    return [];
  }
}

export async function saveOrder(username: string, order: any): Promise<void> {
  const { token, spreadsheetId } = await getAccessToken();
  const range = encodeURIComponent("orders!A:G");
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

  const values = [[
    order.id,
    username,
    order.itemId,
    order.itemName,
    String(order.cost),
    new Date(order.requestedAt).toLocaleString("ko-KR"),
    order.status
  ]];

  await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ values }),
  });
}

export async function getAllOrders(): Promise<any[]> {
  try {
    const { token, spreadsheetId } = await getAccessToken();
    const range = encodeURIComponent("orders!A:G");
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?t=${Date.now()}`;

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, "cache": "no-store" } });
    const data = await res.json();
    const rows = data.values || [];
    if (rows.length <= 1) return [];

    return rows.slice(1)
      .map((row: any, index: number) => ({
        id: row[0] || "",
        username: row[1] || "",
        itemId: row[2] || "",
        itemName: row[3] || "",
        cost: parseInt(row[4], 10) || 0,
        requestedAt: row[5] || "",
        status: row[6] || "requested"
      })).reverse();
  } catch (e) {
    return [];
  }
}

export async function updateOrderStatus(orderId: string, newStatus: string): Promise<void> {
  const { token, spreadsheetId } = await getAccessToken();
  const range = encodeURIComponent("orders!A:G");
  const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?t=${Date.now()}`;
  const getRes = await fetch(getUrl, { headers: { Authorization: `Bearer ${token}`, "cache": "no-store" } });
  const data = await getRes.json();
  const rows = data.values || [];

  let rowIndex = -1;
  for(let i = 0; i < rows.length; i++) {
    if(rows[i][0] === orderId) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex !== -1) {
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/orders!G${rowIndex}?valueInputOption=USER_ENTERED`;
    await fetch(updateUrl, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values: [[newStatus]] })
    });
  }
}

export async function saveSystemLog(action: string, ip: string, country: string, userAgent: string): Promise<void> {
  try {
    const { token, spreadsheetId } = await getAccessToken();
    const range = encodeURIComponent("server_logs!A:E");
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

    const dateStr = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
    const isMobile = /Mobile|Android|iP(hone|od|ad)/i.test(userAgent) ? "Mobile" : "Desktop";

    const values = [[dateStr, action, ip, country, isMobile]];

    await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values }),
    });
  } catch (e) {
    console.error("시스템 로그 기록 실패", e);
  }
}

export async function getSystemLogs(): Promise<any[]> {
  try {
    const { token, spreadsheetId } = await getAccessToken();
    const range = encodeURIComponent("server_logs!A:E");
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?t=${Date.now()}`;

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, "cache": "no-store" } });
    const data = await res.json();
    const rows = data.values || [];
    if (rows.length <= 1) return [];

    return rows.slice(1).map((row: any, index: number) => ({
      id: `syslog-${index}`,
      date: row[0] || "",
      action: row[1] || "",
      ip: row[2] || "Unknown IP",
      country: row[3] || "-",
      device: row[4] || "-"
    })).reverse(); 
  } catch (e) {
    return [];
  }
}

export async function getUsageHistory(username: string): Promise<any[]> {
  try {
    const { token, spreadsheetId } = await getAccessToken();
    const range = encodeURIComponent("usage!A:E");
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?t=${Date.now()}`;

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, "cache": "no-store" } });
    const data = await res.json();
    const rows = data.values || [];
    
    if (rows.length <= 1) return [];

    return rows.slice(1)
      .filter((row: any) => row[0] === username)
      .map((row: any) => ({
        date: row[1] || "",
        elec_kwh: safeParseFloat(row[2]),
        gas_m3: safeParseFloat(row[3]),
        co2_kg: safeParseFloat(row[4]),
      }));
  } catch (e) {
    console.error("기록 불러오기 실패:", e);
    return [];
  }
}

// ♻️ 새롭게 추가된 친환경 인증 내역 저장 함수 (certifications 탭)
export async function saveCertification(username: string, date: string, type: string, points: number, id: string): Promise<void> {
  const { token, spreadsheetId } = await getAccessToken();
  const range = encodeURIComponent("certifications!A:E");
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

  const values = [[id, username, date, type, String(points)]];

  await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ values }),
  });
}

// ♻️ 새롭게 추가된 친환경 인증 내역 불러오기 함수 (certifications 탭)
export async function getCertifications(username: string): Promise<any[]> {
  try {
    const { token, spreadsheetId } = await getAccessToken();
    const range = encodeURIComponent("certifications!A:E");
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?t=${Date.now()}`;

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, "cache": "no-store" } });
    const data = await res.json();
    const rows = data.values || [];
    if (rows.length <= 1) return []; // 데이터가 없거나 헤더만 있는 경우

    // B열(인덱스 1)이 username인 데이터만 필터링하여 반환
    return rows.slice(1)
      .filter((row: any) => row[1] === username)
      .map((row: any) => ({
        id: row[0] || Date.now().toString(),
        date: row[2] || "",
        type: row[3] || "",
        points: parseInt(row[4], 10) || 0
      })).reverse(); // 최신순 정렬
  } catch (e) {
    console.error("인증 내역 불러오기 에러:", e);
    return [];
  }
}

// 💬 새롭게 추가된 AI 코칭 대화 내역 저장 함수 (coaching_chats 탭)
export async function saveChatMessage(username: string, role: string, content: string, id: string): Promise<void> {
  const { token, spreadsheetId } = await getAccessToken();
  const range = encodeURIComponent("coaching_chats!A:E");
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

  const dateStr = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  const values = [[id, username, role, content, dateStr]];

  await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ values }),
  });
}

// 💬 새롭게 추가된 AI 코칭 대화 내역 불러오기 함수 (coaching_chats 탭)
export async function getChatMessages(username: string): Promise<any[]> {
  try {
    const { token, spreadsheetId } = await getAccessToken();
    const range = encodeURIComponent("coaching_chats!A:E");
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?t=${Date.now()}`;

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, "cache": "no-store" } });
    const data = await res.json();
    const rows = data.values || [];
    if (rows.length <= 1) return [];

    return rows.slice(1)
      .filter((row: any) => row[1] === username)
      .map((row: any) => ({
        id: row[0],
        role: row[2] as "user" | "assistant",
        content: row[3] || "",
        // 생성 시간 순으로 보여주기 위해 별도로 reverse()를 하지 않습니다 (오래된 대화가 위로).
      }));
  } catch (e) {
    console.error("대화 내역 불러오기 에러:", e);
    return [];
  }
}