"use client"

import { useMemo, useState, useEffect } from "react"
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
// 전기요금에서 kWh를 역산하기 위한 계산 함수

const calculateBill = (kwh: number): number => {
  let basic = 0
  let energy = 0
  
  if (kwh <= 200) {
    basic = 730
    energy = kwh * 105.0
  } else if (kwh <= 400) {
    basic = 1260
    energy = (200 * 105.0) + ((kwh - 200) * 174.0)
  } else {
    basic = 6060
    energy = (200 * 105.0) + (200 * 174.0) + ((kwh - 400) * 242.3)
  }
  
  const climate = kwh * 9.0
  const fuel = kwh * 5.0
  
  const pureTotal = basic + energy + climate + fuel
  
  // 부가가치세 10% (원 단위 반올림)
  const vat = Math.round(pureTotal * 0.1)
  
  // 전력산업기반기금 2.7% (10원 미만 절사, 2025.7.1 개정 인하 요율 반영)
  const fund = Math.floor((pureTotal * 0.027) / 10) * 10 
  
  const total = pureTotal + vat + fund
  
  // 최종 청구금액 (10원 단위 미만 절사)
  return Math.floor(total / 10) * 10
}

const inverseCalculateKwh = (targetBill: number): number => {
  if (targetBill <= 0) return 0
  
  let low = 0
  let high = 50000 // 일반 가정 최대치를 넘어가는 여유 탐색 범위
  let mid = 0
  
  // 10원 단위 절사로 인한 계단식 값을 이분 탐색(Binary Search)으로 추적
  for (let i = 0; i < 100; i++) {
    mid = (low + high) / 2
    const currentBill = calculateBill(mid)
    
    if (currentBill === targetBill) {
      break
    } else if (currentBill < targetBill) {
      low = mid
    } else {
      high = mid
    }
  }
  
  return Number(mid.toFixed(1))
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

  // 입력된 전기요금을 시각적으로 관리하기 위한 로컬 상태
  const [electricityBill, setElectricityBill] = useState(() => {
    return electricityUsage ? String(calculateBill(Number(electricityUsage))) : ""
  })

  // 외부(부모 컴포넌트)에서 초기화되거나 값이 변경될 때 로컬 요금 상태를 동기화
  useEffect(() => {
    if (!electricityUsage) {
      setElectricityBill("")
    } else {
      const currentKwh = inverseCalculateKwh(Number(electricityBill))
      // 부모의 kWh가 현재 화면의 요금에서 역산된 kWh와 다르다면 외부에서 덮어씌운 것으로 간주하여 동기화
      if (Number(electricityUsage) !== currentKwh) {
        setElectricityBill(String(calculateBill(Number(electricityUsage))))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [electricityUsage])

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

  // 요금 입력 시 kWh로 역산하여 전달
  const handleElectricityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const bill = e.target.value
    setElectricityBill(bill)
    
    if (!bill || isNaN(Number(bill))) {
      onElectricityChange("")
    } else {
      const kwh = inverseCalculateKwh(Number(bill))
      onElectricityChange(kwh.toString())
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
                <Zap className="w-4 h-4 text-yellow-500" /> Electricity (고압 요금 역산)
              </label>
              <div className="relative group">
                <input
                  type="number"
                  value={electricityBill}
                  onChange={handleElectricityChange}
                  placeholder="전기요금 입력"
                  className="w-full bg-black/5 dark:bg-white/5 rounded-2xl px-6 py-5 text-xl font-bold text-foreground placeholder:text-muted-foreground/50 border border-black/10 dark:border-white/5 focus:border-primary/50 focus:bg-black/10 dark:focus:bg-white/10 outline-none transition-all"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">원</span>
              </div>
              {/* 역산된 kWh 수치를 사용자에게 시각적으로 안내 */}
              {electricityUsage && (
                <p className="text-xs text-right text-muted-foreground mr-2 font-medium">
                  누진세 환산 시 약 <span className="text-primary">{electricityUsage}</span> kWh 사용됨
                </p>
              )}
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

      {/* 요금 계산 기준 안내 (작은 글씨) */}
      <div className="text-[11px] text-muted-foreground/50 bg-black/5 dark:bg-white/5 rounded-2xl p-4 space-y-1.5">
        <p className="font-bold text-muted-foreground/70 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5" />
          전기요금 역산 적용 기준 (한국전력 주택용 고압, 기타계절)
        </p>
        <ul className="list-disc list-inside space-y-1 ml-1">
          <li>누진제: 1단계(~200kWh) 105.0원 / 2단계(201~400kWh) 174.0원 / 3단계(400초과) 242.3원</li>
          <li>기본요금: 1단계 730원 / 2단계 1,260원 / 3단계 6,060원</li>
          <li>별도요금: 기후환경요금(9원/kWh) 및 연료비조정요금(5원/kWh)</li>
          <li>제세공과금: 부가가치세 10% 및 전력산업기반기금 2.7% 반영</li>
          <li>복지제도 적용, 기타 활인 적용 등에 따라 오차 발생 가능합니다. 참고용으로 사용</li>
        </ul>
        <p className="pt-1 opacity-70">
          ※ 10원 단위 절사 규정으로 인해 입력된 요금에서 역산된 전력량(kWh)은 산출된 근사치입니다.
        </p>
      </div>
      
    </div>
  )
}