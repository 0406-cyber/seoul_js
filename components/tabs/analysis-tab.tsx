"use client"

import { useState } from "react"
import { Zap, Flame, Leaf, TrendingDown } from "lucide-react"
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

  const handleCalculate = async () => {
    setIsCalculating(true)
    try {
      await onCalculate()
    } finally {
      setIsCalculating(false)
    }
  }

  return (
    // ✨ Bento Grid 컨테이너 적용
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pb-28">
      
      {/* Carbon Emission Metric Card (왼쪽 상단 1칸) */}
      <div className="glass-card rounded-[2rem] p-8 flex flex-col justify-center relative overflow-hidden">
        {/* 장식용 배경 블러 원 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        
        <div className="flex items-center gap-3 mb-6 relative z-10">
          <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center shadow-inner">
            <Leaf className="w-5 h-5 text-primary" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">현재 탄소 배출량</span>
        </div>
        
        <div className="flex items-baseline gap-2 relative z-10">
          <span className="text-7xl font-extrabold tracking-tighter text-foreground drop-shadow-sm">
            {carbonEmission !== null ? carbonEmission.toFixed(1) : "0"}
          </span>
          <span className="text-2xl font-bold text-muted-foreground">kg CO₂</span>
        </div>
        
        {carbonEmission !== null && (
          <div className="flex items-center gap-2 mt-6 text-primary bg-primary/10 w-fit px-4 py-2 rounded-full relative z-10">
            <TrendingDown className="w-4 h-4" />
            <span className="text-sm font-bold">지난달 대비 12% 감소</span>
          </div>
        )}
      </div>

      {/* Input Form (오른쪽 상단 1칸) */}
      <div className="glass-card rounded-[2rem] p-8 space-y-6 flex flex-col justify-between">
        <h3 className="text-xl font-bold text-foreground">사용량 입력</h3>

        <div className="space-y-5">
          {/* Electricity Input */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-yellow-500" />
              </div>
              <label className="text-sm font-semibold text-foreground">전기 사용량</label>
            </div>
            <div className="relative">
              <input
                type="number"
                value={electricityUsage}
                onChange={(e) => onElectricityChange(e.target.value)}
                placeholder="0"
                className="w-full bg-black/20 dark:bg-black/40 rounded-2xl px-5 py-4 text-lg font-medium text-foreground placeholder:text-muted-foreground border border-white/5 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-inner"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                kWh
              </span>
            </div>
          </div>

          {/* Gas Input */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
              <label className="text-sm font-semibold text-foreground">가스 사용량</label>
            </div>
            <div className="relative">
              <input
                type="number"
                value={gasUsage}
                onChange={(e) => onGasChange(e.target.value)}
                placeholder="0"
                className="w-full bg-black/20 dark:bg-black/40 rounded-2xl px-5 py-4 text-lg font-medium text-foreground placeholder:text-muted-foreground border border-white/5 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-inner"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                m³
              </span>
            </div>
          </div>
        </div>

        {/* Calculate Button */}
        <button
          onClick={() => void handleCalculate()}
          disabled={isCalculating || isSaving || (!electricityUsage && !gasUsage)}
          className="w-full bg-primary text-primary-foreground rounded-2xl py-4 mt-2 text-lg font-bold shadow-[0_0_20px_rgba(74,222,128,0.3)] transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {isCalculating || isSaving ? "기록 중..." : "기록 및 분석"}
        </button>
      </div>

      {/* Area Chart (하단 전체 2칸 차지) */}
      <div className="glass-card rounded-[2rem] p-8 md:col-span-2">
        <h3 className="text-xl font-bold text-foreground mb-8">일자별 탄소 배출 추이</h3>
        <div className="h-[300px] w-full">
          {chartData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
                <TrendingDown className="w-8 h-8 opacity-50" />
              </div>
              <p className="text-sm font-medium">아직 기록된 데이터가 없습니다.</p>
              <p className="text-xs opacity-70 mt-1">사용량을 입력하고 변화를 추적해보세요.</p>
            </div>
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCarbon" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ADE80" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#4ADE80" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }}
                tickFormatter={(value) => `${value}kg`}
                dx={-10}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(30, 30, 30, 0.8)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '16px',
                  color: '#ffffff',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                }}
                itemStyle={{ color: '#4ADE80', fontWeight: 'bold' }}
                labelStyle={{ color: '#9CA3AF', marginBottom: '4px' }}
              />
              <Area
                type="monotone"
                dataKey="carbon"
                stroke="#4ADE80"
                strokeWidth={4}
                fill="url(#colorCarbon)"
                activeDot={{ r: 6, strokeWidth: 0, fill: '#ffffff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
          )}
        </div>
      </div>
      
    </div>
  )
}
