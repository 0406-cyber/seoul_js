"use client"

import { useMemo, useState } from "react"
import {
  Zap,
  Flame,
  Leaf,
  TrendingDown,
  TrendingUp,
  History,
  Info,
  BarChart3,
  CalendarDays,
} from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"

interface AnalysisTabProps {
  electricityUsage: string
  gasUsage: string
  onElectricityChange: (value: string) => void
  onGasChange: (value: string) => void
  onCalculate: () => Promise<void>
  carbonEmission: number | null
  chartData: { date: string; carbon: number }[]
  isSaving?: boolean
}

export function AnalysisTab({
  electricityUsage,
  gasUsage,
  onElectricityChange,
  onGasChange,
  onCalculate,
  carbonEmission,
  chartData,
  isSaving,
}: AnalysisTabProps) {
  const [isCalculating, setIsCalculating] = useState(false)

  const stats = useMemo(() => {
    const last = chartData.at(-1)?.carbon ?? null
    const prev = chartData.at(-2)?.carbon ?? null
    const delta = last !== null && prev !== null ? last - prev : null
    const deltaPct =
      last !== null && prev !== null && prev !== 0 ? (delta / prev) * 100 : null

    const last30 = chartData.slice(Math.max(0, chartData.length - 30))
    const avg30 =
      last30.length > 0
        ? last30.reduce((acc, d) => acc + d.carbon, 0) / last30.length
        : null

    return { last, prev, delta, deltaPct, avg30, count: chartData.length }
  }, [chartData])

  const handleCalculate = async () => {
    setIsCalculating(true)
    try {
      await onCalculate()
    } finally {
      setIsCalculating(false)
    }
  }

  return (
    <div className="space-y-6 pb-28">
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-card rounded-3xl p-4 border border-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-primary/15 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">최근 배출량</p>
              <p className="text-lg font-black text-foreground truncate">
                {stats.last !== null ? `${stats.last.toFixed(1)}kg` : "—"}
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
              <p className="text-xs text-muted-foreground">최근 30회 평균</p>
              <p className="text-lg font-black text-foreground truncate">
                {stats.avg30 !== null ? `${stats.avg30.toFixed(1)}kg` : "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-3xl p-4 border border-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-orange-500/10 flex items-center justify-center">
              {stats.delta !== null && stats.delta <= 0 ? (
                <TrendingDown className="w-4 h-4 text-primary" />
              ) : (
                <TrendingUp className="w-4 h-4 text-orange-500" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">직전 대비</p>
              <p className="text-lg font-black text-foreground truncate">
                {stats.delta === null ? (
                  "—"
                ) : (
                  <>
                    {stats.delta > 0 ? "+" : ""}
                    {stats.delta.toFixed(1)}kg
                  </>
                )}
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
              <p className="text-xs text-muted-foreground">기록 횟수</p>
              <p className="text-lg font-black text-foreground truncate">
                {stats.count.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        
        {/* Main Emission Card */}
        <div className="glass-card rounded-[2.5rem] p-8 relative overflow-hidden group flex flex-col justify-center">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Leaf className="w-32 h-32 text-primary rotate-12" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center shadow-inner">
                <Leaf className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Carbon Footprint</span>
            </div>
            
            <div className="flex items-baseline gap-3">
              <span className="text-7xl font-bold text-foreground tracking-tighter text-glow">
                {carbonEmission !== null ? carbonEmission.toFixed(1) : "0"}
              </span>
              <span className="text-2xl font-medium text-muted-foreground">kg CO₂</span>
            </div>

            {carbonEmission !== null && (
              <div className="mt-8 flex items-center gap-4">
                <div className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold text-primary">
                    {stats.deltaPct === null
                      ? "—"
                      : `${stats.deltaPct > 0 ? "+" : ""}${stats.deltaPct.toFixed(1)}%`}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">직전 기록 대비</span>
              </div>
            )}
          </div>
        </div>

        {/* Input Section */}
        <div className="glass-morphism rounded-[2.5rem] p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-foreground">데이터 기록</h3>
            <Info className="w-5 h-5 text-muted-foreground" />
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground ml-2 uppercase tracking-widest">
                <Zap className="w-4 h-4 text-yellow-500" /> Electricity
              </label>
              <div className="relative group">
                {/* 배경을 투명하게 하거나 라이트/다크모드 대응 */}
                <input
                  type="number"
                  value={electricityUsage}
                  onChange={(e) => onElectricityChange(e.target.value)}
                  placeholder="0"
                  className="w-full bg-black/5 dark:bg-white/5 rounded-2xl px-6 py-5 text-xl font-bold text-foreground placeholder:text-muted-foreground/50 border border-black/10 dark:border-white/5 focus:border-primary/50 focus:bg-black/10 dark:focus:bg-white/10 outline-none transition-all"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">kWh</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground ml-2 uppercase tracking-widest">
                <Flame className="w-4 h-4 text-orange-500" /> Natural Gas
              </label>
              <div className="relative group">
                <input
                  type="number"
                  value={gasUsage}
                  onChange={(e) => onGasChange(e.target.value)}
                  placeholder="0"
                  className="w-full bg-black/5 dark:bg-white/5 rounded-2xl px-6 py-5 text-xl font-bold text-foreground placeholder:text-muted-foreground/50 border border-black/10 dark:border-white/5 focus:border-primary/50 focus:bg-black/10 dark:focus:bg-white/10 outline-none transition-all"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">m³</span>
              </div>
            </div>
          </div>

          {/* Calculate Button */}
          <button
            onClick={() => void handleCalculate()}
            disabled={isCalculating || isSaving || (!electricityUsage && !gasUsage)}
            className="w-full bg-primary text-primary-foreground rounded-2xl py-5 text-lg font-black transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:hover:scale-100 shadow-[0_20px_50px_rgba(74,222,128,0.3)]"
          >
            {isCalculating || isSaving ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                <span>SAVING...</span>
              </div>
            ) : "분석 결과 기록하기"}
          </button>
        </div>
      </div>

      {/* Chart Section */}
      <div className="glass-card rounded-[2.5rem] p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-foreground">배출량 히스토리</h3>
            {stats.count > 0 && (
              <span className="text-xs font-bold text-muted-foreground bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 px-2 py-1 rounded-full">
                최근 {stats.count}회
              </span>
            )}
          </div>
          <History className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="h-72 w-full">
          {chartData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
              <div className="w-16 h-16 rounded-3xl bg-black/5 dark:bg-white/5 flex items-center justify-center">
                <BarChart3 className="w-8 h-8 opacity-40" />
              </div>
              <p className="text-sm font-medium">표시할 데이터가 아직 없어요</p>
              <p className="text-xs text-muted-foreground">
                위에서 전기/가스 사용량을 입력하고 기록하면 그래프가 채워져요.
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCarbon" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ADE80" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4ADE80" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 600 }}
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 600 }}
                  tickFormatter={(value) => `${value}kg`}
                />
                <Tooltip
                  cursor={{ stroke: 'rgba(74,222,128,0.2)', strokeWidth: 2 }}
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    borderColor: 'var(--border)',
                    borderRadius: '16px',
                    color: 'var(--foreground)',
                    boxShadow: '0 10px 30px var(--glass-shadow)',
                    padding: '12px 16px'
                  }}
                  itemStyle={{ color: '#4ADE80', fontWeight: 'bold' }}
                  labelStyle={{ color: 'var(--muted-foreground)', marginBottom: '4px', fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="carbon"
                  stroke="#4ADE80"
                  strokeWidth={4}
                  fill="url(#colorCarbon)"
                  animationDuration={1500}
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#4ADE80' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      
    </div>
  )
}
