"use server";

import { GoogleAuth } from "google-auth-library";

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

function todayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 구글 인증 및 토큰 발급 (디버깅 로그 포함) */
async function getAccessToken() {
  console.log("🔐 [인증 시작] 환경 변수를 확인합니다...");
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const spreadsheetId = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_SPREADSHEET_ID;

  if (!clientEmail || !privateKey || !spreadsheetId) {
    console.error("❌ [인증 실패] 필수 환경 변수가 누락되었습니다.");
    throw new Error("환경 변수 누락");
  }

  try {
    const auth = new GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const client = await auth.getClient();
    const token = await client.getAccessToken();
    return { token: token.token, spreadsheetId };
  } catch (err: any) {
    console.error("💥 [인증 에러] 구글 인증 실패:", err.message);
    throw err;
  }
}

/** 데이터 저장 기능 */
export async function saveUsage(username: string, elec: number, gas: number, co2: number): Promise<void> {
  console.log(`📝 [기록 시도] 유저: ${username}`);
  const { token, spreadsheetId } = await getAccessToken();
  const range = encodeURIComponent("usage!A:E");
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

  const values = [[username, todayYmd(), String(elec), String(gas), String(co2)]];

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("❌ [저장 실패]:", err);
    throw new Error(`저장 실패: ${err}`);
  }
  console.log("✅ [저장 성공]");
}

/** 로그인 및 횟수 업데이트 */
export async function loginUser(username: string): Promise<void> {
  console.log(`🔑 [로그인] 유저: ${username}`);
  const { token, spreadsheetId } = await getAccessToken();
  const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/users!A:C`;
  
  const getRes = await fetch(getUrl, { headers: { Authorization: `Bearer ${token}` } });
  const data = await getRes.json();
  const rows = data.values || [];

  let rowIndex = -1;
  let currentLogins = 0;

  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === username) {
      rowIndex = i + 1;
      currentLogins = Number(rows[i][1]) || 0;
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
      body: JSON.stringify({ values: [[username, 1, 0]] })
    });
  }
}

/** 포인트 업데이트 */
export async function updateUserPoints(username: string, points: number): Promise<void> {
  const { token, spreadsheetId } = await getAccessToken();
  const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/users!A:C`;
  
  const getRes = await fetch(getUrl, { headers: { Authorization: `Bearer ${token}` } });
  const data = await getRes.json();
  const rows = data.values || [];

  let rowIndex = -1;
  let currentPoints = 0;

  for (let i = 0; i < rows.length; i++) {
    if (rows[i][0] === username) {
      rowIndex = i + 1;
      currentPoints = Number(rows[i][2]) || 0;
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
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;

    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });

    const data = await response.json();
    const rows = data.values || [];
    
    if (rows.length <= 1) return [];
    return rows.slice(1).map((row: any, index: number) => ({
      id: String(index + 1),
      name: row[0] || "이름 없음",
      loginCount: Number(row[1]) || 0,
      points: Number(row[2]) || 0,
      carbonSaved: Math.floor(Number(row[2]) / 10) || 0,
      streak: 0
    })).sort((a: any, b: any) => b.points - a.points);
  } catch (error) {
    console.error("리더보드 에러:", error);
    return [];
  }
}
