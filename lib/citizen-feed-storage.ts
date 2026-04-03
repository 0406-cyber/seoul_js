import { getFeedPostsViaApi, saveFeedPostViaApi, updateFeedPostLikesViaApi } from "./googleSheets";

export type CitizenPost = {
  id: string;
  author: string;
  title: string;
  body: string;
  imageDataUrl?: string;
  createdAt: number; 
  likedBy: string[]; 
};

const CLAIM_KEY = "eco_citizen_feed_claims_v1"; 

// ⭐️ 구글 시트에서 피드 불러오기
export async function loadFeedAsync(): Promise<CitizenPost[]> {
  return await getFeedPostsViaApi();
}

// ⭐️ 구글 시트에 새 글 작성하기
export async function saveNewPostAsync(post: CitizenPost): Promise<void> {
  await saveFeedPostViaApi(post);
}

// ⭐️ 구글 시트에 좋아요 업데이트하기
export async function updateLikesAsync(postId: string, likedBy: string[]): Promise<void> {
  await updateFeedPostLikesViaApi(postId, likedBy);
}

// 주간 보상 여부(로컬 유지)
export function weekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function loadClaims(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CLAIM_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function markClaimed(week: string, username: string) {
  if (typeof window === "undefined") return;
  const claims = loadClaims();
  claims[week] = username;
  localStorage.setItem(CLAIM_KEY, JSON.stringify(claims));
}
