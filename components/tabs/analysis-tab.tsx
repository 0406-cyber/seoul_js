"use client"

import { useState } from "react"
import { Zap, Flame, Leaf, TrendingDown, History, Info } from "lucide-react"
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
<<<<<<< HEAD
    <div className="space-y-6 pb-28">
      {/* Bento Grid Header */}
      <div className="grid grid-cols-2 gap-4">
        {/* Main Emission Card */}
        <div className="col-span-2 glass-card rounded-[2.5rem] p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Leaf className="w-32 h-32 text-primary rotate-12" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center backdrop-blur-md">
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

            <div className="mt-8 flex items-center gap-4">
              <div className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold text-primary">-12.4%</span>
              </div>
              <span className="text-xs text-muted-foreground">vs. last month</span>
            </div>
=======
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pb-28">
      
      {/* 1. 현재 배출량 리퀴드 카드 */}
      <div className="liquid-glass rounded-[2rem] p-8 flex flex-col justify-center relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-[1rem] bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
            <Leaf className="w-5 h-5 text-primary drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
          </div>
          <span className="text-sm font-semibold text-white/80 tracking-wide">현재 탄소 배출량</span>
        </div>
        
        <div className="flex items-baseline gap-2">
          <span className="text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50 drop-shadow-lg">
            {carbonEmission !== null ? carbonEmission.toFixed(1) : "0"}
          </span>
          <span className="text-2xl font-bold text-white/60">kg CO₂</span>
        </div>
        
        {carbonEmission !== null && (
          <div className="flex items-center gap-2 mt-6 text-primary bg-primary/10 border border-primary/20 w-fit px-4 py-2 rounded-full backdrop-blur-md shadow-[0_0_15px_rgba(74,222,128,0.2)]">
            <TrendingDown className="w-4 h-4" />
            <span className="text-sm font-bold">지난달 대비 12% 감소</span>
>>>>>>> 26cb3e58e653a05b9132959d8659f5c8893cbeba
          </div>
        </div>

        {/* Secondary Info Card 1 */}
        <div className="glass-card rounded-[2rem] p-6 flex flex-col justify-between aspect-square">
          <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1 font-medium">Electricity</p>
            <p className="text-xl font-bold text-foreground">{electricityUsage || "0"} <span className="text-xs text-muted-foreground font-normal">kWh</span></p>
          </div>
        </div>

        {/* Secondary Info Card 2 */}
        <div className="glass-card rounded-[2rem] p-6 flex flex-col justify-between aspect-square">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center">
            <Flame className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1 font-medium">Natural Gas</p>
            <p className="text-xl font-bold text-foreground">{gasUsage || "0"} <span className="text-xs text-muted-foreground font-normal">m³</span></p>
          </div>
        </div>
      </div>

<<<<<<< HEAD
      {/* Input Section - Refined Glassmorphism */}
      <div className="glass-morphism rounded-[2.5rem] p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-foreground">데이터 기록</h3>
          <Info className="w-5 h-5 text-muted-foreground" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground ml-2 uppercase tracking-widest">Electricity</label>
            <div className="relative group">
=======
      {/* 2. 사용량 입력 리퀴드 카드 */}
      <div className="liquid-glass rounded-[2rem] p-8 space-y-6 flex flex-col justify-between">
        <h3 className="text-xl font-bold text-white drop-shadow-md">사용량 입력</h3>

        <div className="space-y-5">
          {/* 음각 처리된 투명 인풋 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]" />
              <label className="text-sm font-semibold text-white/90">전기 사용량</label>
            </div>
            <div className="relative">
>>>>>>> 26cb3e58e653a05b9132959d8659f5c8893cbeba
              <input
                type="number"
                value={electricityUsage}
                onChange={(e) => onElectricityChange(e.target.value)}
                placeholder="0"
<<<<<<< HEAD
                className="w-full bg-white/5 rounded-2xl px-6 py-5 text-xl font-bold text-foreground placeholder:text-muted-foreground/30 border border-white/5 focus:border-primary/50 focus:bg-white/10 outline-none transition-all"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">kWh</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground ml-2 uppercase tracking-widest">Natural Gas</label>
            <div className="relative group">
=======
                className="w-full liquid-glass-inner px-5 py-4 text-lg font-bold text-white placeholder:text-white/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/30 outline-none transition-all rounded-2xl"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-white/50 font-bold">kWh</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400 drop-shadow-[0_0_5px_rgba(251,146,60,0.8)]" />
              <label className="text-sm font-semibold text-white/90">가스 사용량</label>
            </div>
            <div className="relative">
>>>>>>> 26cb3e58e653a05b9132959d8659f5c8893cbeba
              <input
                type="number"
                value={gasUsage}
                onChange={(e) => onGasChange(e.target.value)}
                placeholder="0"
<<<<<<< HEAD
                className="w-full bg-white/5 rounded-2xl px-6 py-5 text-xl font-bold text-foreground placeholder:text-muted-foreground/30 border border-white/5 focus:border-primary/50 focus:bg-white/10 outline-none transition-all"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">m³</span>
=======
                className="w-full liquid-glass-inner px-5 py-4 text-lg font-bold text-white placeholder:text-white/30 focus:border-primary/50 focus:ring-2 focus:ring-primary/30 outline-none transition-all rounded-2xl"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-white/50 font-bold">m³</span>
>>>>>>> 26cb3e58e653a05b9132959d8659f5c8893cbeba
            </div>
          </div>
        </div>

        <button
          onClick={() => void handleCalculate()}
          disabled={isCalculating || isSaving || (!electricityUsage && !gasUsage)}
<<<<<<< HEAD
          className="w-full bg-primary text-primary-foreground rounded-2xl py-5 text-lg font-black transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:hover:scale-100 shadow-[0_20px_50px_rgba(74,222,128,0.3)]"
=======
          className="w-full bg-gradient-to-r from-primary to-emerald-400 text-[#0f1115] rounded-[1.25rem] py-4 mt-2 text-lg font-extrabold shadow-[0_0_20px_rgba(74,222,128,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed border border-white/20"
>>>>>>> 26cb3e58e653a05b9132959d8659f5c8893cbeba
        >
          {isCalculating || isSaving ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              <span>SAVING...</span>
            </div>
          ) : "분석 결과 기록하기"}
        </button>
      </div>

<<<<<<< HEAD
      {/* Chart Section - Darker & Cleaner */}
      <div className="glass-card rounded-[2.5rem] p-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-bold text-foreground">배출량 히스토리</h3>
          <History className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="h-72 w-full">
          {chartData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
              <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center">
                <BarChart3 className="w-8 h-8 opacity-20" />
              </div>
              <p className="text-sm font-medium">표시할 데이터가 아직 없어요</p>
=======
      {/* 3. 일자별 추이 차트 리퀴드 카드 */}
      <div className="liquid-glass rounded-[2rem] p-8 md:col-span-2">
        <h3 className="text-xl font-bold text-white mb-8 drop-shadow-md">일자별 탄소 배출 추이</h3>
        <div className="h-[300px] w-full">
          {chartData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-white/50">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 shadow-inner border border-white/5">
                <TrendingDown className="w-8 h-8 opacity-50" />
              </div>
              <p className="text-sm font-bold">아직 기록된 데이터가 없습니다.</p>
>>>>>>> 26cb3e58e653a05b9132959d8659f5c8893cbeba
            </div>
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCarbon" x1="0" y1="0" x2="0" y2="1">
<<<<<<< HEAD
                  <stop offset="5%" stopColor="#4ADE80" stopOpacity={0.3} />
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
=======
                  <stop offset="5%" stopColor="#4ADE80" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#4ADE80" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600 }} tickFormatter={(value) => `${value}kg`} dx={-10} />
>>>>>>> 26cb3e58e653a05b9132959d8659f5c8893cbeba
              <Tooltip
                cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                contentStyle={{
<<<<<<< HEAD
                  backgroundColor: 'rgba(30, 30, 30, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '20px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                  padding: '12px 16px'
                }}
                itemStyle={{ color: '#4ADE80', fontWeight: 'bold' }}
                labelStyle={{ color: '#9CA3AF', marginBottom: '4px', fontSize: '12px' }}
              />
              <Area
                type="monotone"
                dataKey="carbon"
                stroke="#4ADE80"
                strokeWidth={4}
                fill="url(#colorCarbon)"
                animationDuration={2000}
=======
                  backgroundColor: 'rgba(20, 20, 20, 0.6)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '16px',
                  color: '#ffffff',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                }}
                itemStyle={{ color: '#4ADE80', fontWeight: '900' }}
                labelStyle={{ color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}
>>>>>>> 26cb3e58e653a05b9132959d8659f5c8893cbeba
              />
              <Area type="monotone" dataKey="carbon" stroke="#4ADE80" strokeWidth={4} fill="url(#colorCarbon)" activeDot={{ r: 6, strokeWidth: 0, fill: '#ffffff', filter: 'drop-shadow(0 0 8px #4ADE80)' }} />
            </AreaChart>
          </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}

import { BarChart3 } from "lucide-react"
