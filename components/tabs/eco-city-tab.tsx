"use client"

import { useEffect, useMemo, useState } from "react"
import { CloudSun, PawPrint, Sprout, TreePine } from "lucide-react"

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}

type Stage = {
  id: number
  minPoints: number
  label: string
  subtitle: string
}

const STAGES: Stage[] = [
  {
    id: 0,
    minPoints: 0,
    label: "회색 도시",
    subtitle: "아직은 칙칙하지만, 시작이 반이에요.",
  },
  {
    id: 1,
    minPoints: 200,
    label: "새싹이 돋는 골목",
    subtitle: "작은 실천이 초록을 불러옵니다.",
  },
  {
    id: 2,
    minPoints: 600,
    label: "나무가 자라는 공원",
    subtitle: "하늘이 맑아지고, 생명이 찾아와요.",
  },
  {
    id: 3,
    minPoints: 1200,
    label: "에코 시티",
    subtitle: "동물들이 모이고, 도시는 완전히 살아났어요.",
  },
]

export function EcoCityTab({ nickname, points }: { nickname: string; points: number }) {
  const stage = useMemo(() => {
    const sorted = [...STAGES].sort((a, b) => a.minPoints - b.minPoints)
    let cur = sorted[0]
    for (const s of sorted) if (points >= s.minPoints) cur = s
    const next = sorted.find((s) => s.minPoints > cur.minPoints) ?? null
    return { cur, next }
  }, [points])

  const progress = useMemo(() => {
    const curMin = stage.cur.minPoints
    const nextMin = stage.next?.minPoints ?? stage.cur.minPoints + 1
    return clamp01((points - curMin) / (nextMin - curMin))
  }, [points, stage.cur.minPoints, stage.next?.minPoints])

  const [pulse, setPulse] = useState(false)
  useEffect(() => {
    setPulse(true)
    const t = setTimeout(() => setPulse(false), 500)
    return () => clearTimeout(t)
  }, [stage.cur.id])

  const sky = stage.cur.id === 0
    ? "from-slate-950 via-slate-900 to-slate-950"
    : stage.cur.id === 1
      ? "from-sky-950 via-slate-900 to-slate-950"
      : stage.cur.id === 2
        ? "from-sky-800 via-sky-900 to-slate-950"
        : "from-sky-500 via-sky-700 to-slate-900"

  const haze = stage.cur.id === 0 ? "opacity-60" : stage.cur.id === 1 ? "opacity-35" : stage.cur.id === 2 ? "opacity-15" : "opacity-0"

  return (
    <div className="space-y-6 pb-28">
      <div className="bg-card rounded-3xl p-6 border border-border">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">나만의 에코 시티</p>
            <h3 className="text-xl font-bold text-foreground truncate">
              {stage.cur.label}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{stage.cur.subtitle}</p>
          </div>
          <div className={`w-12 h-12 rounded-3xl bg-primary/20 flex items-center justify-center ${pulse ? "eco-pop" : ""}`}>
            {stage.cur.id <= 1 ? <Sprout className="w-6 h-6 text-primary" /> : <TreePine className="w-6 h-6 text-primary" />}
          </div>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{nickname}의 포인트</span>
            <span className="text-foreground font-semibold">{points.toLocaleString()}P</span>
          </div>
          <div className="mt-2 h-3 w-full bg-secondary rounded-full overflow-hidden border border-border">
            <div
              className="h-full bg-primary transition-all duration-700"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>{stage.cur.minPoints.toLocaleString()}P</span>
            <span>
              {stage.next ? `다음 단계 ${stage.next.minPoints.toLocaleString()}P` : "최고 단계 달성"}
            </span>
          </div>
        </div>
      </div>

      <div className={`rounded-3xl border border-border overflow-hidden bg-gradient-to-b ${sky}`}>
        <div className="relative h-80">
          {/* sky elements */}
          <div className={`absolute inset-0 transition-opacity duration-700 ${haze}`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent_45%),radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.06),transparent_40%)]" />
          </div>

          {stage.cur.id >= 1 && (
            <div className="absolute top-10 left-8 eco-float">
              <CloudSun className="w-10 h-10 text-sky-200/80" />
            </div>
          )}

          {/* city base */}
          <div className="absolute inset-x-0 bottom-0 h-44">
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-28 flex items-end justify-between px-6 pb-2">
              <div className={`eco-building ${stage.cur.id >= 2 ? "eco-building-good" : "eco-building-bad"}`} />
              <div className={`eco-building eco-building-tall ${stage.cur.id >= 2 ? "eco-building-good" : "eco-building-bad"}`} />
              <div className={`eco-building ${stage.cur.id >= 2 ? "eco-building-good" : "eco-building-bad"}`} />
              <div className={`eco-building eco-building-mid ${stage.cur.id >= 2 ? "eco-building-good" : "eco-building-bad"}`} />
            </div>
          </div>

          {/* trees */}
          {stage.cur.id >= 1 && (
            <>
              <div className="absolute bottom-10 left-10 eco-grow" style={{ animationDelay: "0ms" }}>
                <div className="eco-tree">
                  <div className="eco-tree-canopy" />
                  <div className="eco-tree-trunk" />
                </div>
              </div>
              {stage.cur.id >= 2 && (
                <div className="absolute bottom-12 right-12 eco-grow" style={{ animationDelay: "120ms" }}>
                  <div className="eco-tree eco-tree-lg">
                    <div className="eco-tree-canopy" />
                    <div className="eco-tree-trunk" />
                  </div>
                </div>
              )}
            </>
          )}

          {/* animals */}
          {stage.cur.id >= 3 && (
            <>
              <div className="absolute bottom-20 left-32 eco-hop">
                <PawPrint className="w-7 h-7 text-emerald-200/90" />
              </div>
              <div className="absolute bottom-24 right-28 eco-hop" style={{ animationDelay: "180ms" }}>
                <PawPrint className="w-6 h-6 text-emerald-200/80" />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-card rounded-3xl p-6 border border-border space-y-3">
        <h4 className="text-lg font-semibold text-foreground">오늘의 성장 힌트</h4>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>- 텀블러 사용 / 대중교통 / 분리수거 인증으로 포인트를 모아보세요.</p>
          <p>- 시민 기자단 피드에서 좋아요를 많이 받으면 추가 보상을 받을 수 있어요.</p>
        </div>
      </div>
    </div>
  )
}

