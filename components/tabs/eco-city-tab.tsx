"use client"

import { useEffect, useMemo, useState } from "react"
import { Building2, SunMedium, Zap, Droplets, Activity, Wind, LightbulbOff } from "lucide-react"

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}

type Stage = {
  id: number
  minPoints: number
  label: string
  subtitle: string
  Icon: React.ElementType
}

const STAGES: Stage[] = [
  {
    id: 0,
    minPoints: 0,
    label: "에너지 낭비 도심",
    subtitle: "노후화된 인프라 - 에너지 손실률 높음",
    Icon: LightbulbOff,
  },
  {
    id: 1,
    minPoints: 200,
    label: "스마트 빌딩 리모델링",
    subtitle: "스마트 조명 및 고효율 창호 도입",
    Icon: Building2,
  },
  {
    id: 2,
    minPoints: 600,
    label: "수자원/조명 인프라 연계",
    subtitle: "자원 순환 활성화 및 인프라 최적화",
    Icon: Droplets,
  },
  {
    id: 3,
    minPoints: 1200,
    label: "AI 마이크로그리드 완성",
    subtitle: "신재생 에너지 자급자족 - 제로 에너지 시티",
    Icon: Zap,
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

  // 도심 배경색 변화 (어두운 회색 -> 테크놀로지 블루 -> 딥 네이비 스마트그리드)
  const sky = stage.cur.id === 0
    ? "from-stone-900 via-stone-800 to-stone-950"
    : stage.cur.id === 1
      ? "from-slate-900 via-slate-800 to-slate-900"
      : stage.cur.id === 2
        ? "from-blue-950 via-slate-900 to-slate-950"
        : "from-indigo-950 via-blue-950 to-slate-950"

  const haze = stage.cur.id === 0 ? "opacity-60" : stage.cur.id === 1 ? "opacity-30" : "opacity-0"

  const isSmart = stage.cur.id >= 1
  const isAdvanced = stage.cur.id >= 2
  const isGrid = stage.cur.id >= 3

  const CurrentIcon = stage.cur.Icon

  return (
    <div className="space-y-6 pb-28">
      {/* 상태 헤더 카드 */}
      <div className="bg-card rounded-3xl p-6 border border-border shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-bold text-primary tracking-widest uppercase">Smart Infra Status</p>
            <h3 className="text-xl font-black text-foreground truncate mt-1">
              {stage.cur.label}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{stage.cur.subtitle}</p>
          </div>
          <div className={`w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(74,222,128,0.2)] ${pulse ? "eco-pop" : ""}`}>
            <CurrentIcon className="w-6 h-6 text-primary" />
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium mb-2">
            <span className="uppercase tracking-wider">Energy Points</span>
            <span className="text-foreground font-bold text-sm">{points.toLocaleString()} <span className="text-primary">P</span></span>
          </div>
          <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden border border-border shadow-inner">
            <div
              className="h-full bg-primary transition-all duration-1000 relative"
              style={{ width: `${Math.round(progress * 100)}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <span>LV.{stage.cur.id} ({stage.cur.minPoints}P)</span>
            <span>
              {stage.next ? `NEXT: LV.${stage.next.id} (${stage.next.minPoints}P)` : "MAX LEVEL"}
            </span>
          </div>
        </div>
      </div>

      {/* 시각화 컨테이너 */}
      <div className={`rounded-3xl border border-border overflow-hidden bg-gradient-to-b ${sky} relative shadow-inner`}>
        <div className="relative h-80">
          
          {/* 스모그 및 배경 파티클 */}
          <div className={`absolute inset-0 transition-opacity duration-1000 ${haze}`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(0,0,0,0.8),transparent_50%),radial-gradient(circle_at_70%_20%,rgba(0,0,0,0.6),transparent_40%)]" />
          </div>

          {/* 홀로그램 데이터 대시보드 (2단계 이상) */}
          {isAdvanced && (
             <div className="absolute top-5 right-5 flex flex-col gap-2 z-30 transition-opacity duration-700">
                <div className="bg-cyan-950/60 border border-cyan-500/30 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] text-cyan-200 font-mono flex items-center gap-2 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                   <Activity className="w-3 h-3 text-cyan-400" />
                   GRID EFF: {Math.min(99.9, 45 + progress * 55).toFixed(1)}%
                </div>
                {isGrid && (
                   <div className="bg-blue-950/60 border border-blue-500/30 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] text-blue-200 font-mono flex items-center gap-2 shadow-[0_0_10px_rgba(59,130,246,0.2)] animate-in slide-in-from-right-4">
                     <SunMedium className="w-3 h-3 text-blue-400" />
                     SOLAR OUT: {Math.floor(points * 1.2)} kWh
                   </div>
                )}
             </div>
          )}

          {/* 풍력 발전기 (3단계) */}
          {isGrid && (
            <div className="absolute inset-0 z-0">
              <div className="absolute top-12 left-10 opacity-70">
                <Wind className="w-16 h-16 text-cyan-300/80 animate-[spin_4s_linear_infinite]" />
                <div className="w-1 h-28 bg-cyan-900 mx-auto -mt-4 shadow-[0_0_10px_rgba(6,182,212,0.3)]" />
              </div>
              <div className="absolute top-20 right-28 opacity-50">
                <Wind className="w-10 h-10 text-blue-300/60 animate-[spin_3s_linear_infinite]" />
                <div className="w-0.5 h-20 bg-blue-900 mx-auto -mt-2" />
              </div>
            </div>
          )}

          {/* 빛나는 전력선 (3단계) */}
          {isGrid && (
            <div className="absolute bottom-12 left-0 right-0 z-10 flex flex-col gap-4 opacity-60">
              <div className="h-0.5 w-full bg-cyan-900 relative overflow-hidden">
                <div className="absolute inset-y-0 left-0 w-1/3 bg-cyan-400 blur-[2px] animate-[eco-float_2s_linear_infinite]" />
              </div>
              <div className="h-0.5 w-full bg-blue-900 relative overflow-hidden">
                <div className="absolute inset-y-0 right-0 w-1/4 bg-blue-400 blur-[2px] animate-[eco-float_3s_linear_infinite_reverse]" />
              </div>
            </div>
          )}

          {/* 빌딩 및 기반 시설 */}
          <div className="absolute inset-x-0 bottom-0 h-44 z-20">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent" />
            <div className="absolute bottom-4 left-0 right-0 h-28 flex items-end justify-between px-8 pb-0">
              
              {/* 빌딩 1 */}
              <div className={`relative eco-building transition-all duration-1000 ${isSmart ? 'bg-slate-800 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'bg-stone-800 border-stone-700'}`}>
                {isSmart ? (
                  <div className="absolute inset-x-2 top-4 bottom-2 bg-[linear-gradient(180deg,transparent_48%,rgba(6,182,212,0.3)_50%)] bg-[length:100%_8px]" />
                ) : (
                  <div className="absolute top-4 left-2 w-3 h-4 bg-yellow-600/30" />
                )}
                {isGrid && <div className="absolute -top-1.5 left-1 w-8 h-1.5 bg-blue-400/80 -skew-x-12 shadow-[0_0_10px_rgba(96,165,250,0.5)]" />}
              </div>

              {/* 빌딩 2 (Tall) */}
              <div className={`relative eco-building eco-building-tall transition-all duration-1000 ${isSmart ? 'bg-slate-800 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'bg-stone-800 border-stone-700'}`}>
                 {isSmart ? (
                   <div className="absolute inset-x-2 top-4 bottom-2 flex flex-wrap gap-1.5 justify-center content-start">
                     {[...Array(10)].map((_, i) => (
                       <div key={i} className="w-3 h-4 bg-cyan-400/60 rounded-sm animate-pulse" style={{ animationDelay: `${i * 150}ms`}}/>
                     ))}
                   </div>
                 ) : (
                   <div className="absolute top-10 right-2 w-3 h-4 bg-orange-600/40" />
                 )}
                 {isGrid && <div className="absolute -top-1.5 right-1 w-10 h-1.5 bg-cyan-300/90 skew-x-12 shadow-[0_0_10px_rgba(103,232,249,0.6)]" />}
              </div>

              {/* 빌딩 3 */}
              <div className={`relative eco-building transition-all duration-1000 ${isSmart ? 'bg-slate-800 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'bg-stone-800 border-stone-700'}`}>
                {isSmart && <div className="absolute inset-x-2 top-4 bottom-2 bg-[linear-gradient(180deg,transparent_48%,rgba(6,182,212,0.3)_50%)] bg-[length:100%_8px]" />}
                {isGrid && <div className="absolute -top-1.5 left-1 w-8 h-1.5 bg-blue-400/80 -skew-x-12" />}
              </div>

              {/* 빌딩 4 (Mid) */}
              <div className={`relative eco-building eco-building-mid transition-all duration-1000 ${isSmart ? 'bg-slate-800 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-stone-800 border-stone-700'}`}>
                {isSmart && (
                  <div className="absolute inset-x-3 top-4 bottom-2 flex flex-col gap-2">
                    {[...Array(5)].map((_, i) => <div key={i} className="w-full h-2 bg-blue-400/50 rounded-sm" />)}
                  </div>
                )}
              </div>
            </div>
            
            {/* 하단 수자원 파이프라인 (2단계 이상) */}
            {isAdvanced && (
              <div className="absolute bottom-0 left-0 right-0 h-3 bg-cyan-950/80 border-t border-cyan-500/40 z-30 overflow-hidden shadow-[0_-5px_15px_rgba(6,182,212,0.2)]">
                <div className="w-[200%] h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(34,211,238,0.3)_10px,rgba(34,211,238,0.3)_20px)] animate-[eco-float_3s_linear_infinite]" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 엔지니어링 기반 힌트 텍스트 */}
      <div className="bg-card rounded-3xl p-6 border border-border space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-secondary flex items-center justify-center">
            <LightbulbOff className="w-3 h-3 text-muted-foreground" />
          </div>
          <h4 className="text-sm font-bold text-foreground">인프라 성장 힌트</h4>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground bg-secondary/30 rounded-2xl p-4 border border-border/50">
          <p className="flex gap-2 leading-relaxed">
            <span className="text-primary font-bold">1.</span> 
            건물의 에너지 효율을 높이려면 단열재 보강과 고효율 창호(스마트 윈도우) 도입이 필수적입니다.
          </p>
          <p className="flex gap-2 leading-relaxed">
            <span className="text-primary font-bold">2.</span> 
            상하수도 수자원망 최적화와 스마트 가로등 제어가 결합되면 도시의 유지보수 전력과 탄소 배출량이 급감합니다.
          </p>
          <p className="flex gap-2 leading-relaxed">
            <span className="text-primary font-bold">3.</span> 
            신재생 에너지(풍력, 태양광)와 AI 센서가 마이크로그리드로 연계되면 진정한 제로 에너지 시티(Zero Energy City)가 완성됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}
