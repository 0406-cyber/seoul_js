"use client"

import { useMemo, useState } from "react"
import {
  Droplets,
  ShowerHead,
  Shirt,
  Beaker,
  Waves,
  CalendarDays,
  BarChart3,
} from "lucide-react"

type Inputs = {
  showerMinutesPerDay: number
  laundryLoadsPerWeek: number
  dishwashCyclesPerWeek: number
}

function round(n: number, digits = 1) {
  const p = Math.pow(10, digits)
  return Math.round(n * p) / p
}

export function WaterFootprintTab() {
  const [inputs, setInputs] = useState<Inputs>({
    showerMinutesPerDay: 8,
    laundryLoadsPerWeek: 3,
    dishwashCyclesPerWeek: 4,
  })

  const model = useMemo(() => {
    // Simple, explainable heuristic model (MVP)
    // - Shower flow: 9 L/min (typical shower head)
    // - Laundry: 70 L/load (modern washer)
    // - Dishwasher: 12 L/cycle
    // Water pollution proxy (chemical perspective):
    // - COD-like load proxy in grams/day (not a lab measurement; a risk index)
    //   Laundry detergents contribute more; dishwashing moderate; shower low.

    const showerLPerDay = inputs.showerMinutesPerDay * 9
    const laundryLPerDay = (inputs.laundryLoadsPerWeek * 70) / 7
    const dishLPerDay = (inputs.dishwashCyclesPerWeek * 12) / 7

    const totalLPerDay = showerLPerDay + laundryLPerDay + dishLPerDay
    const totalLPerMonth = totalLPerDay * 30

    const codProxyGPerDay =
      inputs.showerMinutesPerDay * 0.6 +
      (inputs.laundryLoadsPerWeek / 7) * 18 +
      (inputs.dishwashCyclesPerWeek / 7) * 8

    const pollutionIndex = Math.min(100, round((codProxyGPerDay / 35) * 100, 0))

    const tips: string[] = []
    if (inputs.showerMinutesPerDay >= 10) tips.push("샤워 시간을 2분만 줄여도 월 수십 리터를 절약할 수 있어요.")
    if (inputs.laundryLoadsPerWeek >= 4) tips.push("세탁은 한 번에 모아서(만수위) 돌리면 물과 세제를 함께 줄일 수 있어요.")
    if (inputs.dishwashCyclesPerWeek >= 5) tips.push("식기세척기는 ‘에코 모드’ + 헹굼 최소화가 오염도(세제)에도 유리해요.")
    if (tips.length === 0) tips.push("현재 습관이 꽤 좋아요. 세제 사용량(권장량)만 지켜도 오염도 지표가 더 내려가요.")

    return {
      showerLPerDay,
      laundryLPerDay,
      dishLPerDay,
      totalLPerDay,
      totalLPerMonth,
      codProxyGPerDay,
      pollutionIndex,
      tips,
    }
  }, [inputs])

  return (
    <div className="space-y-6 pb-28">
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-card rounded-3xl p-4 border border-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-primary/15 flex items-center justify-center">
              <Droplets className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">예상 물 사용량</p>
              <p className="text-lg font-black text-foreground truncate">
                {round(model.totalLPerDay, 0).toLocaleString()} L/일
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-3xl p-4 border border-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-blue-500/10 flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">월 환산(30일)</p>
              <p className="text-lg font-black text-foreground truncate">
                {round(model.totalLPerMonth, 0).toLocaleString()} L/월
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-3xl p-4 border border-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-orange-500/10 flex items-center justify-center">
              <Beaker className="w-4 h-4 text-orange-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">오염도 지표</p>
              <p className="text-lg font-black text-foreground truncate">
                {model.pollutionIndex} / 100
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-3xl p-4 border border-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-secondary flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">COD 프록시</p>
              <p className="text-lg font-black text-foreground truncate">
                {round(model.codProxyGPerDay, 1)} g/일
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-[2.5rem] p-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center shadow-inner">
            <Droplets className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              Water Footprint (심화)
            </p>
            <p className="text-base text-foreground">
              물 사용량 + 세제/배출 특성을 반영한 <span className="text-primary font-bold">오염도 지표</span>까지 함께 봅니다.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Inputs */}
        <div className="glass-morphism rounded-[2.5rem] p-8 space-y-5">
          <h3 className="text-xl font-bold text-foreground">생활 습관 입력</h3>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-2xl bg-sky-500/20 flex items-center justify-center">
                <ShowerHead className="w-4 h-4 text-sky-400" />
              </div>
              <label className="text-sm font-medium text-foreground">샤워 시간 (분/일)</label>
            </div>
            <input
              type="number"
              min={0}
              value={inputs.showerMinutesPerDay}
              onChange={(e) =>
                setInputs((p) => ({
                  ...p,
                  showerMinutesPerDay: Number(e.target.value || 0),
                }))
              }
              className="w-full bg-black/5 dark:bg-white/5 rounded-2xl px-6 py-5 text-xl font-bold text-foreground placeholder:text-muted-foreground/50 border border-black/10 dark:border-white/5 focus:border-primary/50 focus:bg-black/10 dark:focus:bg-white/10 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                <Shirt className="w-4 h-4 text-emerald-400" />
              </div>
              <label className="text-sm font-medium text-foreground">세탁 횟수 (회/주)</label>
            </div>
            <input
              type="number"
              min={0}
              value={inputs.laundryLoadsPerWeek}
              onChange={(e) =>
                setInputs((p) => ({
                  ...p,
                  laundryLoadsPerWeek: Number(e.target.value || 0),
                }))
              }
              className="w-full bg-black/5 dark:bg-white/5 rounded-2xl px-6 py-5 text-xl font-bold text-foreground placeholder:text-muted-foreground/50 border border-black/10 dark:border-white/5 focus:border-primary/50 focus:bg-black/10 dark:focus:bg-white/10 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-2xl bg-indigo-500/20 flex items-center justify-center">
                <Waves className="w-4 h-4 text-indigo-300" />
              </div>
              <label className="text-sm font-medium text-foreground">
                식기세척기/설거지 사이클 (회/주)
              </label>
            </div>
            <input
              type="number"
              min={0}
              value={inputs.dishwashCyclesPerWeek}
              onChange={(e) =>
                setInputs((p) => ({
                  ...p,
                  dishwashCyclesPerWeek: Number(e.target.value || 0),
                }))
              }
              className="w-full bg-black/5 dark:bg-white/5 rounded-2xl px-6 py-5 text-xl font-bold text-foreground placeholder:text-muted-foreground/50 border border-black/10 dark:border-white/5 focus:border-primary/50 focus:bg-black/10 dark:focus:bg-white/10 outline-none transition-all"
            />
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="glass-card rounded-[2.5rem] p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">예상 물 사용량</p>
                <p className="text-4xl font-black text-foreground">
                  {round(model.totalLPerDay, 0).toLocaleString()}{" "}
                  <span className="text-base text-muted-foreground font-medium">L/일</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {round(model.totalLPerMonth, 0).toLocaleString()} L/월 (30일 기준)
                </p>
              </div>
              <div className="w-14 h-14 rounded-3xl bg-primary/20 flex items-center justify-center">
                <Droplets className="w-7 h-7 text-primary" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-muted-foreground">
              <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-3">
                <p className="font-bold text-foreground/90">샤워</p>
                <p className="mt-1">{round(model.showerLPerDay, 0)} L/일</p>
              </div>
              <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-3">
                <p className="font-bold text-foreground/90">세탁</p>
                <p className="mt-1">{round(model.laundryLPerDay, 0)} L/일</p>
              </div>
              <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-3">
                <p className="font-bold text-foreground/90">설거지</p>
                <p className="mt-1">{round(model.dishLPerDay, 0)} L/일</p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-[2.5rem] p-8">
            <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-muted-foreground">수질 화학 관점 오염도(추정)</p>
                <p className="text-4xl font-black text-foreground">
                  {model.pollutionIndex}
                  <span className="text-base text-muted-foreground font-medium"> / 100</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  COD 유사 부하(프록시): {round(model.codProxyGPerDay, 1)} g/일
                </p>
              </div>
              <div className="w-14 h-14 rounded-3xl bg-orange-500/20 flex items-center justify-center">
                <Beaker className="w-7 h-7 text-orange-300" />
              </div>
            </div>

            <div className="mt-4 h-3 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden border border-black/10 dark:border-white/10">
              <div
                className="h-full bg-orange-400 transition-all duration-700"
                style={{
                  width: `${Math.max(2, Math.min(100, model.pollutionIndex))}%`,
                }}
              />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              * 본 지표는 “실험실 측정값”이 아니라, 생활 입력 기반의 위험도 추정 지표(MVP)입니다.
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-[2.5rem] p-8 space-y-4">
        <h4 className="text-xl font-bold text-foreground">개선 팁</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {model.tips.map((t, i) => (
            <li
              key={i}
              className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-5 py-4"
            >
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

