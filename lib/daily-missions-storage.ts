"use client"

export type DailyMissionsState = {
  lastClaimDate?: string // YYYY-MM-DD
  streak?: number
  claimed?: Record<string, boolean> // key -> claimed
}

const key = (username: string) => `eco_daily_${username}`

export function todayYmd(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function ymdAddDays(ymd: string, deltaDays: number) {
  const [y, m, d] = ymd.split("-").map((x) => parseInt(x, 10))
  const dt = new Date(y, (m ?? 1) - 1, d ?? 1)
  dt.setDate(dt.getDate() + deltaDays)
  return todayYmd(dt)
}

export function loadDaily(username: string): DailyMissionsState {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(key(username))
    if (!raw) return {}
    const parsed = JSON.parse(raw) as DailyMissionsState
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

export function saveDaily(username: string, state: DailyMissionsState) {
  if (typeof window === "undefined") return
  localStorage.setItem(key(username), JSON.stringify(state))
}

export function isClaimed(username: string, missionKey: string) {
  const s = loadDaily(username)
  return Boolean(s.claimed?.[missionKey])
}

export function claim(username: string, missionKey: string) {
  const s = loadDaily(username)
  const claimed = { ...(s.claimed ?? {}) }
  claimed[missionKey] = true

  const today = todayYmd()
  const yesterday = ymdAddDays(today, -1)
  const prev = s.lastClaimDate

  let streak = s.streak ?? 0
  if (prev === yesterday) streak += 1
  else if (prev === today) streak = streak || 1
  else streak = 1

  const next: DailyMissionsState = {
    ...s,
    claimed,
    lastClaimDate: today,
    streak,
  }
  saveDaily(username, next)
  return next
}

