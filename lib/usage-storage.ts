/** 브라우저에 사용자별 사용 기록을 두어 app.py get_usage_data / 차트와 유사하게 동작 */

export type UsageRecord = {
  date: string;
  elec_kwh: number;
  gas_m3: number;
  co2_kg: number;
};

const key = (username: string) => `eco_usage_${username}`;

export function loadUsageHistory(username: string): UsageRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key(username));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as UsageRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendUsageLocal(username: string, row: UsageRecord): UsageRecord[] {
  const prev = loadUsageHistory(username);
  const next = [...prev, row];
  localStorage.setItem(key(username), JSON.stringify(next));
  return next;
}
