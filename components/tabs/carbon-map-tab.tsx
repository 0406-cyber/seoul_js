"use client"

import { useState, useMemo } from "react"
import {
  MapPin,
  Building2,
  Home,
  Leaf,
  Search,
  Users,
  Info,
  ChevronRight,
  LayoutGrid
} from "lucide-react"
import { Card } from "@/components/ui/card"

// 자치구별 데이터 및 SVG 경로 (서울 지형 근사치)
interface DistrictData {
  id: string
  name: string
  pop: number
  households: number
  aptRatio: number
  detRatio: number
  co2: number
  elec: number
  // 지형 윤곽선 (실제 지도 모양을 구성하는 핵심 데이터)
  path: string
  // 막대가 표시될 중심 좌표
  labelPos: { x: number; y: number }
}

const SEOUL_DISTRICTS: DistrictData[] = [
  { id: "gangnam", name: "강남구", pop: 546291, households: 242000, aptRatio: 85, detRatio: 5, co2: 232, elec: 450, labelPos: { x: 335, y: 390 }, path: "M310,360 L365,362 L380,410 L335,445 L310,410 Z" },
  { id: "songpa", name: "송파구", pop: 658338, households: 289000, aptRatio: 82, detRatio: 7, co2: 202, elec: 385, labelPos: { x: 410, y: 380 }, path: "M370,365 L430,365 L455,400 L430,450 L375,435 Z" },
  { id: "gangseo", name: "강서구", pop: 563500, households: 275000, aptRatio: 68, detRatio: 15, co2: 158, elec: 250, labelPos: { x: 80, y: 280 }, path: "M40,240 L110,210 L135,270 L100,330 L45,310 Z" },
  { id: "nowon", name: "노원구", pop: 498300, households: 219000, aptRatio: 88, detRatio: 4, co2: 162, elec: 260, labelPos: { x: 385, y: 110 }, path: "M360,60 L415,60 L425,140 L370,165 Z" },
  { id: "seocho", name: "서초구", pop: 404300, households: 172000, aptRatio: 86, detRatio: 6, co2: 215, elec: 420, labelPos: { x: 290, y: 410 }, path: "M260,365 L305,365 L315,455 L255,470 Z" },
  { id: "gwanak", name: "관악구", pop: 483100, households: 291000, aptRatio: 48, detRatio: 38, co2: 140, elec: 215, labelPos: { x: 220, y: 430 }, path: "M180,400 L250,415 L245,475 L180,465 Z" },
  { id: "yongsan", name: "용산구", pop: 215200, households: 109000, aptRatio: 61, detRatio: 26, co2: 195, elec: 345, labelPos: { x: 255, y: 310 }, path: "M230,285 L285,285 L285,345 L230,345 Z" },
  { id: "jongno", name: "종로구", pop: 140500, households: 78000, aptRatio: 42, detRatio: 36, co2: 168, elec: 275, labelPos: { x: 255, y: 210 }, path: "M225,170 L285,170 L285,245 L225,245 Z" },
  { id: "mapo", name: "마포구", pop: 365100, households: 182000, aptRatio: 72, detRatio: 14, co2: 172, elec: 285, labelPos: { x: 185, y: 280 }, path: "M150,250 L215,225 L235,285 L175,315 Z" },
  { id: "yeongdeungpo", name: "영등포구", pop: 376200, households: 192000, aptRatio: 70, detRatio: 14, co2: 170, elec: 295, labelPos: { x: 195, y: 345 }, path: "M145,325 L215,310 L225,390 L145,390 Z" },
  { id: "gangdong", name: "강동구", pop: 459100, households: 206000, aptRatio: 80, detRatio: 10, co2: 175, elec: 305, labelPos: { x: 450, y: 280 }, path: "M420,220 L475,220 L485,325 L430,345 Z" },
  { id: "eunpyeong", name: "은평구", pop: 463200, households: 216000, aptRatio: 62, detRatio: 24, co2: 150, elec: 235, labelPos: { x: 210, y: 150 }, path: "M175,100 L235,80 L255,185 L195,205 Z" },
  { id: "yangcheon", name: "양천구", pop: 435100, households: 183000, aptRatio: 84, detRatio: 8, co2: 185, elec: 320, labelPos: { x: 125, y: 350 }, path: "M85,330 L145,315 L155,385 L100,405 Z" },
  { id: "guro", name: "구로구", pop: 392500, households: 185000, aptRatio: 75, detRatio: 16, co2: 156, elec: 245, labelPos: { x: 110, y: 410 }, path: "M75,380 L140,380 L140,445 L75,445 Z" },
  { id: "geumcheon", name: "금천구", pop: 228200, households: 121000, aptRatio: 58, detRatio: 27, co2: 135, elec: 205, labelPos: { x: 170, y: 450 }, path: "M145,415 L195,415 L195,485 L145,485 Z" },
  { id: "dongjak", name: "동작구", pop: 381400, households: 188000, aptRatio: 72, detRatio: 18, co2: 160, elec: 255, labelPos: { x: 245, y: 375 }, path: "M225,350 L280,350 L280,405 L225,405 Z" },
  { id: "seongdong", name: "성동구", pop: 278500, households: 134000, aptRatio: 82, detRatio: 10, co2: 178, elec: 310, labelPos: { x: 325, y: 290 }, path: "M300,265 L360,265 L360,330 L300,330 Z" },
  { id: "gwangjin", name: "광진구", pop: 334100, households: 171000, aptRatio: 51, detRatio: 29, co2: 146, elec: 230, labelPos: { x: 385, y: 300 }, path: "M365,265 L420,265 L420,350 L365,350 Z" },
  { id: "dongdaemun", name: "동대문구", pop: 341200, households: 175000, aptRatio: 60, detRatio: 21, co2: 152, elec: 238, labelPos: { x: 335, y: 220 }, path: "M310,185 L365,185 L365,260 L310,260 Z" },
  { id: "jungnang", name: "중랑구", pop: 382400, households: 188000, aptRatio: 52, detRatio: 28, co2: 148, elec: 225, labelPos: { x: 395, y: 215 }, path: "M375,185 L430,185 L430,260 L375,260 Z" },
  { id: "seongbuk", name: "성북구", pop: 428100, households: 198000, aptRatio: 65, detRatio: 22, co2: 154, elec: 240, labelPos: { x: 305, y: 165 }, path: "M265,135 L345,135 L345,195 L265,195 Z" },
  { id: "gangbuk", name: "강북구", pop: 289200, households: 145000, aptRatio: 48, detRatio: 32, co2: 142, elec: 210, labelPos: { x: 290, y: 95 }, path: "M255,50 L325,50 L325,130 L255,130 Z" },
  { id: "dobong", name: "도봉구", pop: 304200, households: 139000, aptRatio: 74, detRatio: 12, co2: 158, elec: 245, labelPos: { x: 345, y: 70 }, path: "M330,30 L385,30 L385,100 L330,100 Z" },
  { id: "seodaemun", name: "서대문구", pop: 306500, households: 149000, aptRatio: 68, detRatio: 18, co2: 155, elec: 242, labelPos: { x: 200, y: 230 }, path: "M175,195 L235,195 L225,265 L165,265 Z" },
  { id: "junggu", name: "중구", pop: 121400, households: 66000, aptRatio: 64, detRatio: 19, co2: 165, elec: 280, labelPos: { x: 265, y: 265 }, path: "M245,255 L300,255 L300,300 L245,300 Z" },
]

export function CarbonMapTab() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredData = useMemo(() => 
    SEOUL_DISTRICTS.filter(d => d.name.includes(searchTerm)), [searchTerm]
  )

  const selectedData = useMemo(() => 
    SEOUL_DISTRICTS.find(d => d.id === selectedId) || null, [selectedId]
  )

  const getLevelColor = (co2: number) => {
    if (co2 >= 200) return "fill-rose-500"
    if (co2 >= 170) return "fill-orange-500"
    if (co2 >= 150) return "fill-amber-500"
    return "fill-emerald-500"
  }

  const getDistrictFill = (d: DistrictData) => {
    if (selectedId === d.id) return "fill-emerald-100"
    return "fill-slate-100/80"
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700">
      
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input 
          type="text"
          placeholder="자치구 명칭으로 검색하세요"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Real Map Layout */}
        <Card className="xl:col-span-8 p-4 bg-white dark:bg-slate-950 border-none shadow-xl flex items-center justify-center min-h-[550px] relative overflow-hidden">
          <div className="relative w-full aspect-square max-w-[550px]">
            <svg viewBox="0 0 500 500" className="w-full h-full drop-shadow-2xl overflow-visible">
              {/* Layer 1: District Boundaries */}
              <g>
                {SEOUL_DISTRICTS.map((d) => (
                  <path
                    key={`path-${d.id}`}
                    d={d.path}
                    className={`transition-all duration-300 cursor-pointer stroke-slate-300 dark:stroke-slate-700 hover:fill-emerald-50 ${getDistrictFill(d)}`}
                    strokeWidth="1.5"
                    onClick={() => setSelectedId(d.id)}
                  />
                ))}
              </g>

              {/* Layer 2: Data Bars Overlay */}
              {SEOUL_DISTRICTS.map((d) => {
                const barHeight = (d.co2 / 250) * 55
                const isActive = selectedId === d.id
                
                return (
                  <g key={`bar-group-${d.id}`} className="cursor-pointer" onClick={() => setSelectedId(d.id)}>
                    {/* Bar Background */}
                    <rect x={d.labelPos.x - 3} y={d.labelPos.y - 60} width="6" height="60" rx="3" className="fill-slate-200/50 dark:fill-slate-800/50" />
                    {/* Data Bar */}
                    <rect 
                      x={d.labelPos.x - 3} 
                      y={d.labelPos.y - barHeight} 
                      width="6" 
                      height={barHeight} 
                      rx="3" 
                      className={`transition-all duration-1000 ${getLevelColor(d.co2)}`}
                      style={{ filter: isActive ? "brightness(1.1)" : "" }}
                    />
                    {/* Indicator Dot */}
                    <circle cx={d.labelPos.x} cy={d.labelPos.y} r="2.5" className={isActive ? "fill-emerald-600" : "fill-slate-400"} />
                    {/* Label Text */}
                    <text 
                      x={d.labelPos.x} 
                      y={d.labelPos.y + 14} 
                      textAnchor="middle" 
                      className={`text-[9px] font-black tracking-tighter transition-colors select-none ${isActive ? "fill-emerald-600" : "fill-slate-500"}`}
                    >
                      {d.name.replace("구", "")}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Map Legend */}
          <div className="absolute bottom-6 left-6 flex flex-col gap-2 bg-white/95 dark:bg-slate-900/95 p-3 rounded-xl border border-slate-100 shadow-sm text-[10px] font-bold">
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> 150kg 이하 (안전)</div>
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> 150 - 170kg (보통)</div>
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-orange-500" /> 170 - 200kg (높음)</div>
            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-rose-500" /> 200kg 이상 (주의)</div>
          </div>
        </Card>

        {/* District Detail Card */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          {selectedData ? (
            <Card className="p-6 border-none shadow-xl bg-white dark:bg-slate-900 animate-in slide-in-from-right duration-500">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-50 dark:border-slate-800">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">{selectedData.name}</h3>
                  <p className="text-[10px] text-emerald-600 font-bold tracking-widest uppercase mt-1">Real-time Data</p>
                </div>
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950 rounded-xl">
                  <MapPin className="w-6 h-6 text-emerald-600" />
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 font-black mb-1 flex items-center gap-1"><Users className="w-3 h-3" /> 인구</p>
                    <p className="text-sm font-black">{selectedData.pop.toLocaleString()} 명</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] text-slate-400 font-black mb-1 flex items-center gap-1"><LayoutGrid className="w-3 h-3" /> 가구</p>
                    <p className="text-sm font-black">{selectedData.households.toLocaleString()} 세대</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-[11px] font-black mb-2 text-blue-600">
                      <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> 아파트 비율</span>
                      <span>{selectedData.aptRatio}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${selectedData.aptRatio}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-black mb-2 text-amber-600">
                      <span className="flex items-center gap-1.5"><Home className="w-3.5 h-3.5" /> 단독주택 비율</span>
                      <span>{selectedData.detRatio}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${selectedData.detRatio}%` }} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">Carbon Footprint</span>
                    <Leaf className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-3xl font-black mb-1">{selectedData.co2}<span className="text-sm font-normal ml-1 text-slate-400">kg CO₂</span></div>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                    가구당 월평균 전력 사용량: **{selectedData.elec}kWh**
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="flex-1 border-2 border-dashed border-slate-100 dark:border-slate-800 bg-transparent flex flex-col items-center justify-center p-12 text-center rounded-2xl">
              <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-full shadow-lg flex items-center justify-center mb-6">
                <MapPin className="w-10 h-10 text-emerald-500 animate-bounce" />
              </div>
              <p className="text-sm font-black text-slate-400 leading-relaxed">
                서울 지도의 구역이나 <br /> 막대 그래프를 클릭해 보세요.
              </p>
            </Card>
          )}

          <Card className="p-5 bg-emerald-600 text-white border-none shadow-xl flex items-center gap-4 group cursor-pointer hover:bg-emerald-700 transition-all">
            <div className="p-2 bg-white/20 rounded-lg">
              <Info className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-emerald-200">에너지 효율 리포트</p>
              <p className="text-xs font-bold leading-snug">
                전력 사용량이 가장 높은 구는 **강남구** 입니다.
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/50 group-hover:translate-x-1 transition-transform" />
          </Card>
        </div>
      </div>
    </div>
  )
}
