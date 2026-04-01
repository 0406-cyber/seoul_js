export type PointsState = {
  points: number;
  updatedAt: number; // epoch ms
};

const key = (username: string) => `eco_points_${username}`;

export function loadPoints(username: string, fallback = 100): number {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key(username));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<PointsState> | number;
    if (typeof parsed === "number") return parsed;
    if (typeof parsed?.points === "number") return parsed.points;
    return fallback;
  } catch {
    return fallback;
  }
}

export function savePoints(username: string, points: number) {
  if (typeof window === "undefined") return;
  const state: PointsState = { points, updatedAt: Date.now() };
  localStorage.setItem(key(username), JSON.stringify(state));
}

