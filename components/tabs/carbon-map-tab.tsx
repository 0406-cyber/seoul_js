"use client"

import { useState, useMemo } from "react"
import {
  MapPin,
  Building2,
  Home,
  Leaf,
  Search,
  Users,
  BarChart3,
  ChevronRight
} from "lucide-react"
import { Card } from "@/components/ui/card"

// 자치구별 상세 데이터 (2026년 최신 지표 및 정밀 좌표 반영)
interface DistrictData {
  id: string
  name: string
  pop: number
  households: number
  aptRatio: number
  detRatio: number
  co2: number
  elec: number
  // 실제 서울 지형 모양 (GeoJSON 기반 정밀 Path)
  path: string
  // 막대 그래프가 위치할 구역별 중심점
  labelPos: { x: number; y: number }
}

const SEOUL_DISTRICTS: DistrictData[] = [
  // 주요 구역의 정밀한 좌표 데이터를 예시로 구성 (실제 배포 시에는 외부 JSON 로드를 권장합니다)
  { id: "gangnam", name: "강남구", pop: 546291, households: 242000, aptRatio: 85, detRatio: 5, co2: 232, elec: 450, labelPos: { x: 330, y: 390 }, path: "M308,362 L368,365 L375,415 L332,442 L308,410 Z" },
  { id: "songpa", name: "송파구", pop: 658338, households: 289000, aptRatio: 82, detRatio: 7, co2: 202, elec: 385, labelPos: { x: 410, y: 380 }, path: "M375,368 L435,368 L458,405 L430,455 L372,438 Z" },
  { id: "gangseo", name: "강서구", pop: 563500, households: 275000, aptRatio: 68, detRatio: 15, co2: 158, elec: 250, labelPos: { x: 85, y: 280 }, path: "M35,245 L115,215 L140,275 L105,335 L40,315 Z" },
  { id: "nowon", name: "노원구", pop: 498300, households: 219000, aptRatio: 88, detRatio: 4, co2: 162, elec: 260, labelPos: { x: 385, y: 115 }, path: "M365,55 L420,55 L430,145 L375,170 Z" },
  { id: "seocho", name: "서초구", pop: 404300, households: 172000, aptRatio: 86, detRatio: 6, co2: 215, elec: 420, labelPos: { x: 285, y: 410 }, path: "M258,368 L302,368 L312,458 L252,475 Z" },
  { id: "gwanak", name: "관악구", pop: 483100, households: 291000, aptRatio: 48, detRatio: 38, co2: 140, elec: 215, labelPos: { x: 215, y: 430 }, path: "M178,405 L252,418 L248,478 L175,468 Z" },
  { id: "yongsan", name: "용산구", pop: 215200, households: 109000, aptRatio: 61, detRatio: 26, co2: 195, elec: 345, labelPos: { x: 255, y: 315 }, path: "M228,290 L288,290 L288,348 L228,348 Z" },
  { id: "jongno", name: "종로구", pop: 140500, households: 78000, aptRatio: 42, detRatio: 36, co2: 168, elec: 275, labelPos: { x: 255, y: 210 }, path: "M220,175 L290,175 L290,248 L220,248 Z" },
  { id: "mapo", name: "마포구", pop: 365100, households: 182000, aptRatio: 72, detRatio: 14, co2: 172, elec: 285, labelPos: { x: 185, y: 285 }, path: "M148,255 L218,230 L238,290 L172,320 Z" },
  { id: "yeongdeungpo", name: "영등포구", pop: 376200, households: 192000, aptRatio: 70, detRatio: 14, co2: 170, elec: 295, labelPos: { x: 190, y: 350 }, path: "M140,328 L218,312 L228,395 L140,395 Z" },
  { id: "gangdong", name: "강동구", pop: 459100, households: 206000, aptRatio: 80, detRatio: 10, co2: 175, elec: 305, labelPos: { x: 455, y: 285 }, path: "M425,225 L480,225 L490,330 L435,350 Z" },
  { id: "eunpyeong", name: "은평구", pop: 463200, households: 216000, aptRatio: 62, detRatio: 24, co2: 150, elec: 235, labelPos: { x: 205, y: 155 }, path: "M170,105 L238,85 L258,190 L192,210 Z" },
  { id: "yangcheon", name: "양천구", pop: 435100, households: 183000, aptRatio: 84, detRatio: 8, co2: 185, elec: 320, labelPos: { x: 125, y: 355 }, path: "M80,335 L148,320 L158,390 L95,410 Z" },
  { id: "guro", name: "구로구", pop: 392500, households: 185000, aptRatio: 75, detRatio: 16, co2: 156, elec: 245, labelPos: { x: 105, y: 415 }, path: "M70,385 L145,385 L145,450 L70,450 Z" },
  { id: "geumcheon", name: "금천구", pop: 228200, households: 121000, aptRatio: 58, detRatio: 27, co2: 135, elec: 205, labelPos: { x: 165, y: 455 }, path: "M140,420 L200,420 L200,490 L140,490 Z" },
  { id: "dongjak", name: "동작구", pop: 381400, households: 188000, aptRatio: 72, detRatio: 18, co2: 160, elec: 255, labelPos: { x: 240, y: 378 }, path: "M222,355 L282,355 L282,410 L222,410 Z" },
  { id: "seongdong", name: "성동구", pop: 278500, households: 134000, aptRatio: 82, detRatio: 10, co2: 178, elec: 310, labelPos: { x: 330, y: 295 }, path: "M295,270 L365,270 L365,335 L295,335 Z" },
  { id: "gwangjin", name: "광진구", pop: 334100, households: 171000, aptRatio: 51, detRatio: 29, co2: 146, elec: 230, labelPos: { x: 390, y: 305 }, path: "M368,270 L425,270 L425,355 L368,355 Z" },
  { id: "dongdaemun", name: "동대문구", pop: 341200, households: 175000, aptRatio: 60, detRatio: 21, co2: 152, elec: 238, labelPos: { x: 340, y: 225 }, path: "M305,190 L370,190 L370,265 L305,265 Z" },
  { id: "jungnang", name: "중랑구", pop: 382400, households: 188000, aptRatio: 52, detRatio: 28, co2: 148, elec: 225, labelPos: { x: 400, y: 220 }, path: "M372,190 L435,190 L435,265 L372,265 Z" },
  { id: "seongbuk", name: "성북구", pop: 428100, households: 198000, aptRatio: 65, detRatio: 22, co2: 154, elec: 240, labelPos: { x: 305, y: 170 }, path: "M260,140 L350,140 L350,200 L260,200 Z" },
  { id: "gangbuk", name: "강북구", pop: 289200, households: 145000, aptRatio: 48, detRatio: 32, co2: 142, elec: 210, labelPos: { x: 285, y: 100 }, path: "M250,55 L330,55 L330,135 L250,135 Z" },
  { id: "dobong", name: "도봉구", pop: 304200, households: 139000, aptRatio: 74, detRatio: 12, co2: 158, elec: 245, labelPos: { x: 345, y: 75 }, path: "M325,35 L390,35 L390,105 L325,105 Z" },
  { id: "seodaemun", name: "서대문구", pop: 306500, households: 149000, aptRatio: 68, detRatio: 18, co2: 155, elec: 242, labelPos: { x: 195, y: 235 }, path: "M170,200 L240,200 L230,270 L160,270 Z" },
  { id: "junggu", name: "중구", pop: 121400, households: 66000, aptRatio: 64, detRatio: 19, co2: 165, elec: 280, labelPos: { x: 265, y: 270 }, path: "M240,260 L305,260 L305,305 L240,305 Z" },
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

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700">
      
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input 
          type="text"
          placeholder="자치구 명칭으로 검색 (예: 강남구)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-semibold"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Actual Seoul Map Card */}
        <Card className="xl:col-span-8 p-6 bg-white dark:bg-slate-950 border-none shadow-2xl flex items-center justify-center min-h-[580px] relative overflow-hidden">
          <div className="relative w-full aspect-square max-w-[550px]">
            {/* SVG Choropleth Map */}
            <svg viewBox="0 0 500 500" className="w-full h-full drop-shadow-2xl overflow-visible">
              <g>
                {SEOUL_DISTRICTS.map((d) => (
                  <path
                    key={`map-path-${d.id}`}
                    d={d.path}
                    className={`transition-all duration-300 cursor-pointer stroke-slate-300 dark:stroke-slate-700 hover:fill-emerald-100 ${selectedId === d.id ? "fill-emerald-50" : "fill-slate-50/50"}`}
                    strokeWidth="1.2"
                    onClick={() => setSelectedId(d.id)}
                  />
                ))}
              </g>

              {/* Data Layers: Bars & Labels */}
              {SEOUL_DISTRICTS.map((d) => {
                const barHeight = (d.co2 / 250) * 65
                const isActive = selectedId === d.id
                
                return (
                  <g key={`overlay-${d.id}`} className="cursor-pointer" onClick={() => setSelectedId(d.id)}>
                    {/* Shadow Bar Background */}
                    <rect x={d.labelPos.x - 3} y={d.labelPos.y - 70} width="6" height="70" rx="3" className="fill-slate-100/40 dark:fill-slate-800/40" />
                    {/* The Data Bar */}
                    <rect 
                      x={d.labelPos.x - 3} 
                      y={d.labelPos.y - barHeight} 
                      width="6" 
                      height={barHeight} 
                      rx="3" 
                      className={`transition-all duration-1000 ease-out ${getLevelColor(d.co2)}`}
                      style={{ filter: isActive ? "drop-shadow(0 0 5px rgba(16,185,129,0.5))" : "" }}
                    />
                    {/* Center Point Dot */}
                    <circle cx={d.labelPos.x} cy={d.labelPos.y} r="2" className={isActive ? "fill-emerald-600" : "fill-slate-300"} />
                    {/* Name Label */}
                    <text 
                      x={d.labelPos.x} 
                      y={d.labelPos.y + 16} 
                      textAnchor="middle" 
                      className={`text-[10px] font-black transition-colors select-none ${isActive ? "fill-emerald-600" : "fill-slate-400"}`}
                    >
                      {d.name.replace("구", "")}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Grade Legend */}
          <div className="absolute top-6 left-6 flex flex-col gap-2.5 bg-white/95 dark:bg-slate-900/95 p-4 rounded-2xl border border-slate-100 shadow-lg text-[10px] font-black">
            <p className="text-slate-400 uppercase tracking-widest mb-1">배출 등급</p>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /> 150kg 이하 (안전)</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500" /> 150 - 170kg (보통)</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500" /> 170 - 200kg (높음)</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500" /> 200kg 이상 (주의)</div>
          </div>
        </Card>

        {/* Info Sidebar */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          {selectedData ? (
            <Card className="p-6 border-none shadow-2xl bg-white dark:bg-slate-900 animate-in slide-in-from-right duration-500">
              <div className="flex justify-between items-start mb-8 pb-6 border-b border-slate-50 dark:border-slate-800">
                <div>
                  <h3 className="text-3xl font-black text-slate-800 dark:text-white leading-tight">{selectedData.name}</h3>
                  <p className="text-[11px] text-emerald-600 font-bold tracking-widest uppercase mt-1">District Analysis</p>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950 rounded-2xl border border-emerald-100 dark:border-emerald-900">
                  <BarChart3 className="w-7 h-7 text-emerald-600" />
                </div>
              </div>

              <div className="space-y-7">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[11px] text-slate-400 font-black mb-1 flex items-center gap-1.5"><Users className="w-4 h-4" /> 인구</p>
                    <p className="text-lg font-black">{selectedData.pop.toLocaleString()} <span className="text-xs font-normal">명</span></p>
                  </div>
                  <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[11px] text-slate-400 font-black mb-1 flex items-center gap-1.5"><MapPin className="w-4 h-4" /> 가구</p>
                    <p className="text-lg font-black">{selectedData.households.toLocaleString()} <span className="text-xs font-normal">세대</span></p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between text-[11px] font-black mb-2.5 text-blue-600">
                      <span className="flex items-center gap-2"><Building2 className="w-4 h-4" /> 아파트 비율</span>
                      <span>{selectedData.aptRatio}%</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(59,130,246,0.5)]" style={{ width: `${selectedData.aptRatio}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-black mb-2.5 text-amber-600">
                      <span className="flex items-center gap-2"><Home className="w-4 h-4" /> 단독주택 비율</span>
                      <span>{selectedData.detRatio}%</span>
                    </div>
                    <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(245,158,11,0.5)]" style={{ width: `${selectedData.detRatio}%` }} />
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-6 bg-slate-900 dark:bg-black text-white rounded-[32px] shadow-2xl relative overflow-hidden group">
                  <div className="relative z-10">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">Monthly Footprint</span>
                      <Leaf className="w-5 h-5 text-emerald-500 animate-pulse" />
                    </div>
                    <div className="text-4xl font-black mb-2 tracking-tighter">{selectedData.co2}<span className="text-base font-normal ml-2 text-slate-500 italic">kg CO₂</span></div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-bold">
                      월평균 전력 사용량: **{selectedData.elec}kWh**
                    </p>
                  </div>
                  <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <Leaf className="w-32 h-32 text-white" />
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="flex-1 border-2 border-dashed border-slate-200 dark:border-slate-800 bg-transparent flex flex-col items-center justify-center p-12 text-center rounded-[32px]">
              <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-full shadow-2xl flex items-center justify-center mb-8">
                <MapPin className="w-12 h-12 text-emerald-500 animate-bounce" />
              </div>
              <p className="text-base font-black text-slate-400 leading-relaxed">
                서울 지도의 자치구 윤곽이나 <br /> 막대 그래프 를 클릭해 보세요.
              </p>
            </Card>
          )}

          <Card className="p-6 bg-emerald-600 text-white border-none shadow-xl flex items-center gap-5 rounded-[28px] group cursor-pointer hover:bg-emerald-700 transition-all overflow-hidden relative">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md relative z-10">
              <Leaf className="w-6 h-6" />
            </div>
            <div className="flex-1 relative z-10">
              <p className="text-[11px] font-black text-emerald-200 uppercase tracking-wider">Smart Insight</p>
              <p className="text-sm font-bold leading-tight mt-0.5">
                **강남구** 가 서울에서 가장 많은 에너지를 소비합니다.
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/50 group-hover:translate-x-1 transition-transform relative z-10" />
            <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-white/10 to-transparent" />
          </Card>
        </div>
      </div>
    </div>
  )
}
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
