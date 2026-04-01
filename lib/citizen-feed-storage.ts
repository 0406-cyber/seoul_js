export type CitizenPost = {
  id: string;
  author: string;
  title: string;
  body: string;
  imageDataUrl?: string;
  createdAt: number; // epoch ms
  likedBy: string[]; // usernames
};

type FeedState = {
  posts: CitizenPost[];
  updatedAt: number;
};

const FEED_KEY = "eco_citizen_feed_v1";
const CLAIM_KEY = "eco_citizen_feed_claims_v1"; // per-week claim record

export function loadFeed(): CitizenPost[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FEED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<FeedState> | CitizenPost[];
    const posts = Array.isArray(parsed) ? parsed : parsed.posts;
    return Array.isArray(posts) ? posts : [];
  } catch {
    return [];
  }
}

export function saveFeed(posts: CitizenPost[]) {
  if (typeof window === "undefined") return;
  const state: FeedState = { posts, updatedAt: Date.now() };
  localStorage.setItem(FEED_KEY, JSON.stringify(state));
}

export function weekKey(date = new Date()) {
  // ISO week-like key (YYYY-Www). Good enough for UI reward gating.
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
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === "object" ? parsed : {};
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

