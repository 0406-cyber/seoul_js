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

function todayYmd(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 1. 데이터 저장 기능 (usage 테이블) */
export async function saveUsage(username: string, elec: number, gas: number, co2: number): Promise<void> {
  const db = process.env.DB;
  if (!db) throw new Error("D1 데이터베이스가 바인딩되지 않았습니다.");

  await db.prepare(
    "INSERT INTO usage (username, date, elec_kwh, gas_m3, co2_kg) VALUES (?, ?, ?, ?, ?)"
  )
  .bind(username, todayYmd(), elec, gas, parseFloat(co2.toFixed(2)))
  .run();
}

/** 2. 로그인 및 횟수 업데이트 (users 테이블) */
export async function loginUser(username: string): Promise<void> {
  const db = process.env.DB;
  if (!db) throw new Error("D1 데이터베이스가 바인딩되지 않았습니다.");

  const existingUser = await db.prepare("SELECT username, login_count FROM users WHERE username = ?")
    .bind(username)
    .first<{ username: string; login_count: number }>();

  if (existingUser) {
    await db.prepare("UPDATE users SET login_count = login_count + 1 WHERE username = ?")
      .bind(username)
      .run();
  } else {
    await db.prepare("INSERT INTO users (username, login_count, points) VALUES (?, 1, 100)")
      .bind(username)
      .run();
  }
}

/** 3. 포인트 업데이트 (users 테이블) */
export async function updateUserPoints(username: string, points: number): Promise<void> {
  const db = process.env.DB;
  if (!db) throw new Error("D1 데이터베이스가 바인딩되지 않았습니다.");

  await db.prepare("UPDATE users SET points = points + ? WHERE username = ?")
    .bind(points, username)
    .run();
}

/** 4. 리더보드 가져오기 (users 테이블) */
export async function getLeaderboardViaApi(): Promise<any[]> {
  const db = process.env.DB;
  if (!db) return [];

  const { results } = await db.prepare("SELECT username, login_count, points FROM users ORDER BY points DESC").all();
  
  return results.map((row: any, index: number) => ({
    id: `user-${index}`,
    name: row.username,
    loginCount: row.login_count,
    points: row.points,
    carbonSaved: Math.floor(row.points / 50),
    streak: 1
  }));
}

/** 5. 포인트 상세 내역 저장 (logs 테이블) */
export async function savePointLog(username: string, description: string, amount: number): Promise<void> {
  const db = process.env.DB;
  if (!db) return;

  const dateStr = new Date().toLocaleDateString("ko-KR") + " " + new Date().toLocaleTimeString("ko-KR", {hour: '2-digit', minute:'2-digit'});

  await db.prepare("INSERT INTO logs (username, date, description, amount) VALUES (?, ?, ?, ?)")
    .bind(username, dateStr, description, amount)
    .run();
}

/** 6. 포인트 상세 내역 불러오기 (logs 테이블) */
export async function getPointLogs(username: string): Promise<any[]> {
  const db = process.env.DB;
  if (!db) return [];

  // 순차 기록 후 인덱스 역순 가공 정렬 규칙 준수
  const { results } = await db.prepare("SELECT date, description, amount FROM logs WHERE username = ? ORDER BY id ASC").bind(username).all();
  
  return results.map((row: any, index: number) => ({
    id: `log-${index}`,
    date: row.date,
    description: row.description,
    amount: row.amount
  })).reverse();
}

/** 7. 전체 포인트 로그 리스트 조회 (logs 테이블) */
export async function getAllPointLogs(): Promise<any[]> {
  const db = process.env.DB;
  if (!db) return [];

  const { results } = await db.prepare("SELECT username, date, description, amount FROM logs ORDER BY id ASC").all();
  
  return results.map((row: any, index: number) => ({
    id: `log-${index}`,
    username: row.username,
    date: row.date,
    description: row.description,
    amount: row.amount
  })).reverse();
}

/** 8. 피드 게시글 전체 가져오기 (feed 테이블) */
export async function getFeedPostsViaApi(): Promise<any[]> {
  const db = process.env.DB;
  if (!db) return [];

  try {
    // 디비 레벨에서 최신순으로 딱 50개만 잘라서 읽어옴 (한도 극적으로 절약)
    const { results } = await db.prepare(
      "SELECT id, author, title, body, imageDataUrl, createdAt, likedBy FROM feed WHERE id IS NOT NULL AND id != '' ORDER BY createdAt DESC LIMIT 50"
    ).all();
    
    return results.map((row: any) => ({
      id: row.id,
      author: row.author,
      title: row.title,
      body: row.body,
      imageDataUrl: row.imageDataUrl || undefined,
      createdAt: Number(row.createdAt) || Date.now(),
      likedBy: row.likedBy ? JSON.parse(row.likedBy) : []
    }));
  } catch (e) {
    console.error("피드 데이터 조회 실패:", e);
    return [];
  }
}

/** 9. 피드 게시글 수정 (feed 테이블) */
export async function editFeedPostViaApi(postId: string, title: string, body: string): Promise<void> {
  const db = process.env.DB;
  if (!db) throw new Error("D1 데이터베이스가 바인딩되지 않았습니다.");

  await db.prepare("UPDATE feed SET title = ?, body = ? WHERE id = ?")
    .bind(title, body, postId)
    .run();
}

/** 10. 피드 게시글 삭제 (feed 테이블) */
export async function deleteFeedPostViaApi(postId: string): Promise<void> {
  const db = process.env.DB;
  if (!db) throw new Error("D1 데이터베이스가 바인딩되지 않았습니다.");

  await db.prepare("DELETE FROM feed WHERE id = ?")
    .bind(postId)
    .run();
}

/** 11. 피드 게시글 저장 (feed 테이블) */
export async function saveFeedPostViaApi(post: any): Promise<void> {
  const db = process.env.DB;
  if (!db) throw new Error("D1 데이터베이스가 바인딩되지 않았습니다.");

  await db.prepare(
    "INSERT INTO feed (id, author, title, body, imageDataUrl, createdAt, likedBy) VALUES (?, ?, ?, ?, ?, ?, ?)"
  )
  .bind(post.id, post.author, post.title, post.body, post.imageDataUrl || "", post.createdAt, JSON.stringify(post.likedBy || []))
  .run();
}

/** 12. 피드 좋아요 상태 동기화 (feed 테이블) */
export async function updateFeedPostLikesViaApi(postId: string, likedBy: string[]): Promise<void> {
  const db = process.env.DB;
  if (!db) throw new Error("D1 데이터베이스가 바인딩되지 않았습니다.");

  await db.prepare("UPDATE feed SET likedBy = ? WHERE id = ?")
    .bind(JSON.stringify(likedBy), postId)
    .run();
}

/** 13. 상품 교환 주문 저장 (orders 테이블) */
export async function saveOrder(username: string, order: any): Promise<void> {
  const db = process.env.DB;
  if (!db) throw new Error("D1 데이터베이스가 바인딩되지 않았습니다.");

  await db.prepare(
    "INSERT INTO orders (id, username, itemId, itemName, cost, requestedAt, status) VALUES (?, ?, ?, ?, ?, ?, ?)"
  )
  .bind(order.id, username, order.itemId, order.itemName, order.cost, new Date(order.requestedAt).toLocaleString("ko-KR"), order.status)
  .run();
}

/** 14. 전체 주문 데이터 리스트 추출 (orders 테이블) */
export async function getAllOrders(): Promise<any[]> {
  const db = process.env.DB;
  if (!db) return [];

  const { results } = await db.prepare("SELECT id, username, itemId, itemName, cost, requestedAt, status FROM orders ORDER BY requestedAt ASC").all();
  
  return results.map((row: any) => ({
    id: row.id,
    username: row.username,
    itemId: row.itemId,
    itemName: row.itemName,
    cost: row.cost,
    requestedAt: row.requestedAt,
    status: row.status || "requested"
  })).reverse();
}

/** 15. 주문 상태 업데이트어 (orders 테이블) */
export async function updateOrderStatus(orderId: string, newStatus: string): Promise<void> {
  const db = process.env.DB;
  if (!db) throw new Error("D1 데이터베이스가 바인딩되지 않았습니다.");

  await db.prepare("UPDATE orders SET status = ? WHERE id = ?")
    .bind(newStatus, orderId)
    .run();
}

/** 16. 보안 인프라 시스템 로그 저장 (server_logs 테이블) */
export async function saveSystemLog(action: string, ip: string, country: string, userAgent: string): Promise<void> {
  const db = process.env.DB;
  if (!db) return;

  const dateStr = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  const isMobile = /Mobile|Android|iP(hone|od|ad)/i.test(userAgent) ? "Mobile" : "Desktop";

  await db.prepare("INSERT INTO server_logs (date, action, ip, country, device) VALUES (?, ?, ?, ?, ?)")
    .bind(dateStr, action, ip, country, isMobile)
    .run();
}

/** 17. 보안 시스템 로그 어레이 반환 (server_logs 테이블) */
export async function getSystemLogs(): Promise<any[]> {
  const db = process.env.DB;
  if (!db) return [];

  // 디비 자체에서 최신순 정렬 후 100개만 컷
  const { results } = await db.prepare(
    "SELECT id, date, action, ip, country, device FROM server_logs ORDER BY id DESC LIMIT 100"
  ).all();
  
  return results.map((row: any) => ({
    id: `syslog-${row.id}`,
    date: row.date,
    action: row.action,
    ip: row.ip,
    country: row.country,
    device: row.device
  }));
}

/** 18. 사용자의 가스/전기 이력 조회 (usage 테이블) */
export async function getUsageHistory(username: string): Promise<any[]> {
  const db = process.env.DB;
  if (!db) return [];

  const { results } = await db.prepare("SELECT date, elec_kwh, gas_m3, co2_kg FROM usage WHERE username = ? ORDER BY id ASC").bind(username).all();
  
  return results.map((row: any) => ({
    date: row.date,
    elec_kwh: row.elec_kwh,
    gas_m3: row.gas_m3,
    co2_kg: row.co2_kg,
  }));
}

/** 19. 친환경 인증 타임라인 라인업 추가 (certifications 테이블) */
export async function saveCertification(username: string, date: string, type: string, points: number, id: string): Promise<void> {
  const db = process.env.DB;
  if (!db) throw new Error("D1 데이터베이스가 바인딩되지 않았습니다.");

  await db.prepare("INSERT INTO certifications (id, username, date, type, points) VALUES (?, ?, ?, ?, ?)")
    .bind(id, username, date, type, points)
    .run();
}

/** 20. 친환경 인증 타임라인 컴포넌트 로드 (certifications 테이블) */
export async function getCertifications(username: string): Promise<any[]> {
  const db = process.env.DB;
  if (!db) return [];

  const { results } = await db.prepare("SELECT id, date, type, points FROM certifications WHERE username = ? ORDER BY date ASC").bind(username).all();
  
  return results.map((row: any) => ({
    id: row.id,
    date: row.date,
    type: row.type,
    points: row.points
  })).reverse();
}

/** 21. 코칭 챗 단건 컨텍스트 기록 (coaching_chats 테이블) */
export async function saveChatMessage(username: string, role: string, content: string, id: string): Promise<void> {
  const db = process.env.DB;
  if (!db) throw new Error("D1 데이터베이스가 바인딩되지 않았습니다.");

  const dateStr = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

  await db.prepare("INSERT INTO coaching_chats (id, username, role, content, createdAt) VALUES (?, ?, ?, ?, ?)")
    .bind(id, username, role, content, dateStr)
    .run();
}

/** 22. 코칭 챗 히스토리 복원 로드 (coaching_chats 테이블) */
export async function getChatMessages(username: string): Promise<any[]> {
  const db = process.env.DB;
  if (!db) return [];

  const { results } = await db.prepare("SELECT id, role, content FROM coaching_chats WHERE username = ? ORDER BY createdAt ASC").bind(username).all();
  
  return results.map((row: any) => ({
    id: row.id,
    role: row.role,
    content: row.content
  }));
}