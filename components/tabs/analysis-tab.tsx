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
  /** app.py get_usage_data 기반 일자별 co2 추이 */
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
    <div className="space-y-6 pb-28">
      {/* Carbon Emission Metric Card */}
      <div className="bg-card rounded-3xl p-6 border border-border">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm text-muted-foreground">현재 탄소 배출량</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-6xl font-bold text-foreground">
            {carbonEmission !== null ? carbonEmission.toFixed(1) : "0"}
          </span>
          <span className="text-xl text-muted-foreground">kg CO₂</span>
        </div>
        {carbonEmission !== null && (
          <div className="flex items-center gap-2 mt-4 text-primary">
            <TrendingDown className="w-4 h-4" />
            <span className="text-sm font-medium">지난달 대비 12% 감소</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="bg-card rounded-3xl p-6 border border-border space-y-5">
        <h3 className="text-lg font-semibold text-foreground">사용량 입력</h3>
        
        {/* Electricity Input */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-2xl bg-yellow-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-yellow-500" />
            </div>
            <label className="text-sm font-medium text-foreground">전기 사용량</label>
          </div>
          <div className="relative">
            <input
              type="number"
              value={electricityUsage}
              onChange={(e) => onElectricityChange(e.target.value)}
              placeholder="0"
              className="w-full bg-secondary rounded-2xl px-5 py-4 text-lg font-medium text-foreground placeholder:text-muted-foreground border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
              kWh
            </span>
          </div>
        </div>

        {/* Gas Input */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-2xl bg-orange-500/20 flex items-center justify-center">
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <label className="text-sm font-medium text-foreground">가스 사용량</label>
          </div>
          <div className="relative">
            <input
              type="number"
              value={gasUsage}
              onChange={(e) => onGasChange(e.target.value)}
              placeholder="0"
              className="w-full bg-secondary rounded-2xl px-5 py-4 text-lg font-medium text-foreground placeholder:text-muted-foreground border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
              m³
            </span>
          </div>
        </div>

        {/* Calculate Button */}
        <button
          onClick={() => void handleCalculate()}
          disabled={isCalculating || isSaving || (!electricityUsage && !gasUsage)}
          className="w-full bg-primary text-primary-foreground rounded-2xl py-4 text-lg font-semibold transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCalculating || isSaving ? "기록 중..." : "기록 및 분석"}
        </button>
      </div>

      {/* Area Chart */}
      <div className="bg-card rounded-3xl p-6 border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-6">일자별 탄소 배출 추이</h3>
        <div className="h-64 w-full">
          {chartData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-16">
              아직 기록된 데이터가 없습니다. 사용량을 입력해 주세요.
            </p>
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
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                tickFormatter={(value) => `${value}kg`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E1E1E',
                  border: '1px solid #2C2C2E',
                  borderRadius: '16px',
                  color: '#ffffff',
                }}
                labelStyle={{ color: '#9CA3AF' }}
              />
              <Area
                type="monotone"
                dataKey="carbon"
                stroke="#4ADE80"
                strokeWidth={3}
                fill="url(#colorCarbon)"
              />
            </AreaChart>
          </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
