"use client"

import * as React from "react"
import { CalendarDays, CheckCircle2, Flame, Zap } from "lucide-react"
import { toast } from "sonner"
import {
  claim,
  isClaimed,
  loadDaily,
  todayYmd,
  type DailyMissionsState,
} from "@/lib/daily-missions-storage"

type DailyMissionsCardProps = {
  nickname: string
  points: number
  hasUsageToday: boolean
  onGrantPoints: (delta: number, reason: string) => Promise<void> | void
}

const MISSION_CHECKIN = () => `checkin:${todayYmd()}`
const MISSION_USAGE = () => `usage:${todayYmd()}`

export function DailyMissionsCard({
  nickname,
  points,
  hasUsageToday,
  onGrantPoints,
}: DailyMissionsCardProps) {
  const [state, setState] = React.useState<DailyMissionsState>(() =>
    loadDaily(nickname)
  )
  const [isWorking, setIsWorking] = React.useState(false)

  const checkinClaimed = isClaimed(nickname, MISSION_CHECKIN())
  const usageClaimed = isClaimed(nickname, MISSION_USAGE())

  const streak = state.streak ?? 0

  const doClaim = async (key: string, delta: number, reason: string) => {
    if (isWorking) return
    setIsWorking(true)
    try {
      const next = claim(nickname, key)
      setState(next)
      await onGrantPoints(delta, reason)
      toast.success(`미션 완료! +${delta}P`)
    } catch (e: any) {
      toast.error(e?.message ?? "처리 중 오류가 발생했습니다.")
    } finally {
      setIsWorking(false)
    }
  }

  return (
    <div className="glass-card rounded-[2.5rem] p-8 border border-border">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Daily missions
          </p>
          <h3 className="text-xl font-black text-foreground mt-1">오늘의 미션</h3>
          <p className="text-sm text-muted-foreground mt-2">
            매일 짧게 완료하고 스트릭을 쌓아보세요.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-xs font-black text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
            {points.toLocaleString()}P
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="font-bold text-foreground">{streak}</span>
            <span>일 연속</span>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Check-in */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-primary/15 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-foreground">출석 체크</p>
                <p className="text-xs text-muted-foreground mt-1">
                  오늘 접속 보너스 받기
                </p>
              </div>
            </div>

            {checkinClaimed ? (
              <span className="inline-flex items-center gap-1 text-xs font-black text-primary">
                <CheckCircle2 className="w-4 h-4" />
                완료
              </span>
            ) : (
              <button
                onClick={() => void doClaim(MISSION_CHECKIN(), 10, "오늘의 미션: 출석 체크")}
                disabled={isWorking}
                className="px-4 py-2 rounded-2xl bg-primary text-primary-foreground font-black disabled:opacity-50"
              >
                +10P
              </button>
            )}
          </div>
        </div>

        {/* Usage */}
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-black text-foreground">오늘 기록</p>
                <p className="text-xs text-muted-foreground mt-1">
                  탄소 분석에서 오늘 데이터를 저장하기
                </p>
              </div>
            </div>

            {usageClaimed ? (
              <span className="inline-flex items-center gap-1 text-xs font-black text-primary">
                <CheckCircle2 className="w-4 h-4" />
                완료
              </span>
            ) : (
              <button
                onClick={() => {
                  if (!hasUsageToday) {
                    toast.message("먼저 '탄소 분석'에서 오늘 데이터를 기록해 주세요.")
                    return
                  }
                  void doClaim(MISSION_USAGE(), 30, "오늘의 미션: 오늘 기록")
                }}
                disabled={isWorking}
                className={`px-4 py-2 rounded-2xl font-black disabled:opacity-50 ${
                  hasUsageToday
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                +30P
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

