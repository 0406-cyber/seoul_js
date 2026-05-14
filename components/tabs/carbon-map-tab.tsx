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
  TrendingUp,
  BarChart3
} from "lucide-react"
import { Card } from "@/components/ui/card"

// 자치구별 상세 데이터 (2024-2025 최신 지표 반영)
interface DistrictStats {
  id: string
  name: string
  pop: number // 인구 (명)
  households: number // 가구 (세대)
  aptRatio: number // 아파트 비율 (%)
  detRatio: number // 단독주택 비율 (%)
  co2: number // 가구당 월 CO2 (kg)
  elec: number // 월 전력 (kWh)
  // 지도 위 막대 그래프 표시를 위한 상대적 좌표 (SVG 내 위치 %)
  pos: { x: string; y: string }
  // 실제 행정구역 모양을 위한 SVG Path (단순화된 형태)
  path: string
}

const SEOUL_DISTRICTS_DATA: DistrictStats[] = [
  { id: "gangnam", name: "강남구", pop: 546291, households: 242000, aptRatio: 85, detRatio: 5, co2: 232, elec: 450, pos: { x: "65%", y: "75%" }, path: "M 320,380 L 350,380 L 360,420 L 330,440 L 310,420 Z" },
  { id: "songpa", name: "송파구", pop: 658338, households: 289000, aptRatio: 82, detRatio: 7, co2: 202, elec: 385, pos: { x: "80%", y: "70%" }, path: "M 360,380 L 400,380 L 420,410 L 400,450 L 360,430 Z" },
  { id: "gangseo", name: "강서구", pop: 563500, households: 275000, aptRatio: 68, detRatio: 15, co2: 158, elec: 250, pos: { x: "15%", y: "45%" }, path: "M 50,250 L 100,220 L 120,280 L 80,320 L 40,300 Z" },
  { id: "nowon", name: "노원구", pop: 498300, households: 219000, aptRatio: 88, detRatio: 4, co2: 162, elec: 260, pos: { x: "75%", y: "15%" }, path: "M 350,80 L 400,80 L 410,140 L 360,160 Z" },
  { id: "seocho", name: "서초구", pop: 404300, households: 172000, aptRatio: 86, detRatio: 6, co2: 215, elec: 420, pos: { x: "53%", y: "80%" }, path: "M 270,380 L 310,380 L 320,450 L 260,460 Z" },
  { id: "gwanak", name: "관악구", pop: 483100, households: 291000, aptRatio: 48, detRatio: 38, co2: 140, elec: 215, pos: { x: "42%", y: "85%" }, path: "M 200,400 L 250,410 L 240,460 L 190,450 Z" },
  { id: "yongsan", name: "용산구", pop: 215200, households: 109000, aptRatio: 61, detRatio: 26, co2: 195, elec: 345, pos: { x: "48%", y: "55%" }, path: "M 230,290 L 280,290 L 280,340 L 230,340 Z" },
  { id: "jongno", name: "종로구", pop: 140500, households: 78000, aptRatio: 42, detRatio: 36, co2: 168, elec: 275, pos: { x: "46%", y: "30%" }, path: "M 230,180 L 280,180 L 280,240 L 230,240 Z" },
  { id: "junggu", name: "중구", pop: 121400, households: 66000, aptRatio: 64, detRatio: 19, co2: 165, elec: 280, pos: { x: "51%", y: "45%" }, path: "M 240,250 L 290,250 L 290,290 L 240,290 Z" },
  { id: "mapo", name: "마포구", pop: 365100, households: 182000, aptRatio: 72, detRatio: 14, co2: 172, elec: 285, pos: { x: "32%", y: "45%" }, path: "M 160,260 L 210,240 L 230,290 L 180,310 Z" },
  { id: "yeongdeungpo", name: "영등포구", pop: 376200, households: 192000, aptRatio: 70, detRatio: 14, co2: 170, elec: 295, pos: { x: "30%", y: "62%" }, path: "M 160,320 L 210,310 L 220,380 L 150,380 Z" },
  { id: "gangdong", name: "강동구", pop: 459100, households: 206000, aptRatio: 80, detRatio: 10, co2: 175, elec: 305, pos: { x: "88%", y: "45%" }, path: "M 410,240 L 460,240 L 470,320 L 420,340 Z" },
  { id: "eunpyeong", name: "은평구", pop: 463200, households: 216000, aptRatio: 62, detRatio: 24, co2: 150, elec: 235, pos: { x: "32%", y: "20%" }, path: "M 180,120 L 230,100 L 250,180 L 200,200 Z" },
  { id: "yangcheon", name: "양천구", pop: 435100, households: 183000, aptRatio: 84, detRatio: 8, co2: 185, elec: 320, pos: { x: "18%", y: "65%" }, path: "M 90,330 L 140,320 L 150,380 L 100,400 Z" },
  { id: "guro", name: "구로구", pop: 392500, households: 185000, aptRatio: 75, detRatio: 16, co2: 156, elec: 245, pos: { x: "18%", y: "78%" }, path: "M 80,380 L 140,380 L 140,440 L 80,440 Z" },
  { id: "geumcheon", name: "금천구", pop: 228200, households: 121000, aptRatio: 58, detRatio: 27, co2: 135, elec: 205, pos: { x: "28%", y: "88%" }, path: "M 150,420 L 190,420 L 190,480 L 150,480 Z" },
  { id: "dongjak", name: "동작구", pop: 381400, households: 188000, aptRatio: 72, detRatio: 18, co2: 160, elec: 255, pos: { x: "40%", y: "68%" }, path: "M 220,350 L 270,350 L 270,400 L 220,400 Z" },
  { id: "seongdong", name: "성동구", pop: 278500, households: 134000, aptRatio: 82, detRatio: 10, co2: 178, elec: 310, pos: { x: "60%", y: "45%" }, path: "M 300,260 L 350,260 L 350,320 L 300,320 Z" },
  { id: "gwangjin", name: "광진구", pop: 334100, households: 171000, aptRatio: 51, detRatio: 29, co2: 146, elec: 230, pos: { x: "72%", y: "45%" }, path: "M 360,260 L 410,260 L 410,340 L 360,340 Z" },
  { id: "dongdaemun", name: "동대문구", pop: 341200, households: 175000, aptRatio: 60, detRatio: 21, co2: 152, elec: 238, pos: { x: "63%", y: "32%" }, path: "M 310,180 L 360,180 L 360,250 L 310,250 Z" },
  { id: "jungnang", name: "중랑구", pop: 382400, households: 188000, aptRatio: 52, detRatio: 28, co2: 148, elec: 225, pos: { x: "75%", y: "30%" }, path: "M 370,180 L 420,180 L 420,250 L 370,250 Z" },
  { id: "seongbuk", name: "성북구", pop: 428100, households: 198000, aptRatio: 65, detRatio: 22, co2: 154, elec: 240, pos: { x: "55%", y: "25%" }, path: "M 270,140 L 340,140 L 340,190 L 270,190 Z" },
  { id: "gangbuk", name: "강북구", pop: 289200, households: 145000, aptRatio: 48, detRatio: 32, co2: 142, elec: 210, pos: { x: "52%", y: "12%" }, path: "M 260,60 L 320,60 L 320,130 L 260,130 Z" },
  { id: "dobong", name: "도봉구", pop: 304200, households: 139000, aptRatio: 74, detRatio: 12, co2: 158, elec: 245, pos: { x: "63%", y: "10%" }, path: "M 330,40 L 380,40 L 380,100 L 330,100 Z" },
  { id: "seodaemun", name: "서대문구", pop: 306500, households: 149000, aptRatio: 68, detRatio: 18, co2: 155, elec: 242, pos: { x: "38%", y: "35%" }, path: "M 180,200 L 230,200 L 220,260 L 170,260 Z" },
]

export function RealSeoulCarbonMap() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredData = useMemo(() => {
    return SEOUL_DISTRICTS_DATA.filter(d => d.name.includes(searchTerm))
  }, [searchTerm])

  const selectedData = useMemo(() => {
    return SEOUL_DISTRICTS_DATA.find(d => d.id === selectedId) || null
  }, [selectedId])

  const getColor = (co2: number) => {
    if (co2 >= 200) return "#ef4444" // red-500
    if (co2 >= 170) return "#f97316" // orange-500
    if (co2 >= 150) return "#eab308" // yellow-500
    return "#10b981" // emerald-500
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in duration-1000">
      
      {/* 상단 통계 헤더 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Leaf className="w-8 h-8 text-emerald-500" /> 서울 탄소맵
          </h1>
          <p className="text-slate-500 mt-2 font-medium">
            **2024년 통계청 데이터로 일단 해놨는데 나중에 데이터는 변경해야될 듯 합니다
          </p>
        </div>
        <div className="w-full md:w-64 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="자치구 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg border-none focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4">
        
        {/* 실제 지도 영역 (SVG) */}
        <Card className="lg:col-span-8 p-6 bg-white dark:bg-slate-950 border-none shadow-2xl overflow-hidden relative min-h-[600px] flex items-center justify-center">
          <div className="relative w-full aspect-square max-w-[600px]">
            {/* SVG Background Map */}
            <svg viewBox="0 0 500 500" className="w-full h-full drop-shadow-2xl">
              {SEOUL_DISTRICTS_DATA.map((d) => (
                <path
                  key={d.id}
                  d={d.path}
                  fill={getColor(d.co2)}
                  fillOpacity={selectedId === d.id ? 1 : 0.6}
                  stroke="white"
                  strokeWidth={selectedId === d.id ? 3 : 1}
                  className="transition-all duration-300 cursor-pointer hover:fill-opacity-90"
                  onClick={() => setSelectedId(d.id)}
                />
              ))}
            </svg>

            {/* 지도 위 막대 그래프 오버레이 */}
            {SEOUL_DISTRICTS_DATA.map((d) => {
              const barHeight = (d.co2 / 250) * 80 // 최대 80px 높이
              return (
                <div 
                  key={`bar-${d.id}`}
                  style={{ left: d.pos.x, top: d.pos.y }}
                  className="absolute -translate-x-1/2 -translate-y-full pointer-events-none flex flex-col items-center group z-10"
                >
                  <div className="flex items-end gap-1 h-[80px]">
                    {/* 탄소 배출 막대 */}
                    <div 
                      className="w-4 rounded-t-sm transition-all duration-1000 ease-out"
                      style={{ 
                        height: `${barHeight}px`, 
                        backgroundColor: getColor(d.co2),
                        boxShadow: "0 0 10px rgba(0,0,0,0.1)"
                      }}
                    />
                  </div>
                  <div className={`mt-1 px-1.5 py-0.5 rounded text-[10px] font-black shadow-sm transition-colors ${selectedId === d.id ? "bg-slate-900 text-white" : "bg-white/90 text-slate-700 border"}`}>
                    {d.name.replace("구", "")}
                  </div>
                </div>
              )
            })}
          </div>

          {/* 범례 (Legend) */}
          <div className="absolute bottom-6 left-6 flex flex-col gap-2 bg-white/80 dark:bg-slate-900/80 p-3 rounded-lg backdrop-blur-md border text-[11px] font-bold">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /> 150kg 이하 (안전)</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500" /> 150 - 170kg (보통)</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500" /> 170 - 200kg (높음)</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /> 200kg 이상 (매우 높음)</div>
          </div>
        </Card>

        {/* 우측 상세 정보 패널 */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {selectedData ? (
            <Card className="p-6 border-l-4 border-l-emerald-500 shadow-xl animate-in slide-in-from-right duration-500">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 dark:text-white">{selectedData.name}</h2>
                  <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">District Profile</p>
                </div>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold mb-1">
                      <Users className="w-3 h-3" /> 총 인구
                    </div>
                    <div className="text-xl font-black">{selectedData.pop.toLocaleString()}<span className="text-xs font-normal ml-1">명</span></div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold mb-1">
                      <TrendingUp className="w-3 h-3" /> 가구 수
                    </div>
                    <div className="text-xl font-black">{selectedData.households.toLocaleString()}<span className="text-xs font-normal ml-1">세대</span></div>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div>
                    <div className="flex justify-between items-center text-sm font-bold mb-2">
                      <span className="flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-500" /> 아파트 비율</span>
                      <span className="text-blue-600">{selectedData.aptRatio}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${selectedData.aptRatio}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-sm font-bold mb-2">
                      <span className="flex items-center gap-2"><Home className="w-4 h-4 text-amber-500" /> 단독주택 비율</span>
                      <span className="text-amber-600">{selectedData.detRatio}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full transition-all duration-1000" style={{ width: `${selectedData.detRatio}%` }} />
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-lg relative overflow-hidden group">
                  <div className="relative z-10">
                    <p className="text-emerald-400 text-[10px] font-black uppercase tracking-tighter mb-1">Monthly Carbon Footprint</p>
                    <div className="text-3xl font-black mb-1">{selectedData.co2}<span className="text-sm font-normal ml-1 text-slate-400">kg CO₂</span></div>
                    <p className="text-[10px] text-slate-400">가구당 월평균 전력 사용량: **{selectedData.elec}kWh**</p>
                  </div>
                  <BarChart3 className="absolute right-[-10px] bottom-[-10px] w-24 h-24 text-white/5 group-hover:text-white/10 transition-all duration-500" />
                </div>
              </div>
            </Card>
          ) : (
            <div className="h-full border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center p-12 text-center">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
                <MapPin className="w-10 h-10 text-slate-200" />
              </div>
              <h3 className="text-lg font-bold text-slate-400">지도의 구역을 클릭하여<br />상세 정보를 확인하세요</h3>
            </div>
          )}

          {/* 탄소 인사이트 섹션 */}
          <Card className="p-5 bg-emerald-50/50 dark:bg-emerald-950/20 border-none">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                <span className="font-black text-emerald-700 dark:text-emerald-500">엔지니어링 인사이트:</span><br />
                아파트 비율이 높은 지역(**노원**, **양천**)은 집단 에너지 효율이 좋으나 가구 밀집도가 높아 총 배출량이 큽니다. 반면 **강남**, **서초**는 대형 평수와 높은 전력 소비로 인해 가구당 배출량이 서울 평균을 상회합니다.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
