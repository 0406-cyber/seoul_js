"use client"

import { useState, useMemo } from "react"
import {
  MapPin,
  Building2,
  Home,
  Leaf,
  Search,
  ChevronDown,
  Info,
  BarChart3,
  Users,
  LayoutGrid
} from "lucide-react"
import { Card } from "@/components/ui/card"

interface DistrictData {
  id: string
  name: string
  population: number // 인구 (명)
  households: number // 가구 (세대)
  apartmentRatio: number // 아파트 비율 (%)
  detachedRatio: number // 단독주택 비율 (%)
  co2PerHousehold: number // 가구당 월 CO₂ 배출량 (kg)
  avgElecKwh: number // 월평균 전력 (kWh)
  avgGasM3: number // 월평균 가스 (m³)
  gridPos: { x: number; y: number } // 지도상의 상대적 위치 (그리드)
}

// 2024-2025 최신 통계 기반 근사 데이터
const SEOUL_DATA: DistrictData[] = [
  { id: "dobong", name: "도봉구", population: 304000, households: 139000, apartmentRatio: 74, detachedRatio: 12, co2PerHousehold: 158, avgElecKwh: 245, avgGasM3: 42, gridPos: { x: 3, y: 0 } },
  { id: "nowon", name: "노원구", population: 498000, households: 219000, apartmentRatio: 88, detachedRatio: 4, co2PerHousehold: 162, avgElecKwh: 260, avgGasM3: 44, gridPos: { x: 4, y: 0 } },
  { id: "gangbuk", name: "강북구", population: 289000, households: 145000, apartmentRatio: 48, detachedRatio: 32, co2PerHousehold: 142, avgElecKwh: 210, avgGasM3: 38, gridPos: { x: 2, y: 1 } },
  { id: "seongbuk", name: "성북구", population: 428000, households: 198000, apartmentRatio: 65, detachedRatio: 22, co2PerHousehold: 154, avgElecKwh: 240, avgGasM3: 41, gridPos: { x: 3, y: 1 } },
  { id: "jungnang", name: "중랑구", population: 382000, households: 188000, apartmentRatio: 52, detachedRatio: 28, co2PerHousehold: 148, avgElecKwh: 225, avgGasM3: 40, gridPos: { x: 4, y: 1 } },
  { id: "eunpyeong", name: "은평구", population: 463000, households: 216000, apartmentRatio: 62, detachedRatio: 24, co2PerHousehold: 150, avgElecKwh: 235, avgGasM3: 42, gridPos: { x: 1, y: 1 } },
  { id: "jongno", name: "종로구", population: 140000, households: 78000, apartmentRatio: 42, detachedRatio: 36, co2PerHousehold: 168, avgElecKwh: 275, avgGasM3: 45, gridPos: { x: 2, y: 2 } },
  { id: "dongdaemun", name: "동대문구", population: 341000, households: 175000, apartmentRatio: 60, detachedRatio: 21, co2PerHousehold: 152, avgElecKwh: 238, avgGasM3: 41, gridPos: { x: 3, y: 2 } },
  { id: "seodaemun", name: "서대문구", population: 306000, households: 149000, apartmentRatio: 68, detachedRatio: 18, co2PerHousehold: 155, avgElecKwh: 242, avgGasM3: 42, gridPos: { x: 1, y: 2 } },
  { id: "mapo", name: "마포구", population: 365000, households: 182000, apartmentRatio: 72, detachedRatio: 14, co2PerHousehold: 172, avgElecKwh: 285, avgGasM3: 44, gridPos: { x: 1, y: 3 } },
  { id: "jung", name: "중구", population: 121000, households: 66000, apartmentRatio: 64, detachedRatio: 19, co2PerHousehold: 165, avgElecKwh: 280, avgGasM3: 43, gridPos: { x: 2, y: 3 } },
  { id: "seongdong", name: "성동구", population: 278000, households: 134000, apartmentRatio: 82, detachedRatio: 10, co2PerHousehold: 178, avgElecKwh: 310, avgGasM3: 42, gridPos: { x: 3, y: 3 } },
  { id: "gwangjin", name: "광진구", population: 334000, households: 171000, apartmentRatio: 51, detachedRatio: 29, co2PerHousehold: 146, avgElecKwh: 230, avgGasM3: 39, gridPos: { x: 4, y: 3 } },
  { id: "gangseo", name: "강서구", population: 563000, households: 275000, apartmentRatio: 68, detachedRatio: 15, co2PerHousehold: 158, avgElecKwh: 250, avgGasM3: 42, gridPos: { x: 0, y: 3 } },
  { id: "yangcheon", name: "양천구", population: 435000, households: 183000, apartmentRatio: 84, detachedRatio: 8, co2PerHousehold: 185, avgElecKwh: 320, avgGasM3: 46, gridPos: { x: 0, y: 4 } },
  { id: "guro", name: "구로구", population: 392000, households: 185000, apartmentRatio: 75, detachedRatio: 16, co2PerHousehold: 156, avgElecKwh: 245, avgGasM3: 41, gridPos: { x: 0, y: 5 } },
  { id: "yeongdeungpo", name: "영등포구", population: 376000, households: 192000, apartmentRatio: 70, detachedRatio: 14, co2PerHousehold: 170, avgElecKwh: 295, avgGasM3: 43, gridPos: { x: 1, y: 4 } },
  { id: "yongsan", name: "용산구", population: 215000, households: 109000, apartmentRatio: 61, detachedRatio: 26, co2PerHousehold: 195, avgElecKwh: 345, avgGasM3: 48, gridPos: { x: 2, y: 4 } },
  { id: "dongjak", name: "동작구", population: 381000, households: 188000, apartmentRatio: 72, detachedRatio: 18, co2PerHousehold: 160, avgElecKwh: 255, avgGasM3: 42, gridPos: { x: 2, y: 5 } },
  { id: "gwanak", name: "관악구", population: 483000, households: 291000, apartmentRatio: 48, detachedRatio: 38, co2PerHousehold: 140, avgElecKwh: 215, avgGasM3: 38, gridPos: { x: 2, y: 6 } },
  { id: "geumcheon", name: "금천구", population: 228000, households: 121000, apartmentRatio: 58, detachedRatio: 27, co2PerHousehold: 135, avgElecKwh: 205, avgGasM3: 37, gridPos: { x: 1, y: 6 } },
  { id: "seocho", name: "서초구", population: 404000, households: 172000, apartmentRatio: 86, detachedRatio: 6, co2PerHousehold: 215, avgElecKwh: 420, avgGasM3: 49, gridPos: { x: 3, y: 5 } },
  { id: "gangnam", name: "강남구", population: 546000, households: 242000, apartmentRatio: 85, detachedRatio: 5, co2PerHousehold: 232, avgElecKwh: 450, avgGasM3: 52, gridPos: { x: 4, y: 5 } },
  { id: "songpa", name: "송파구", population: 658000, households: 289000, apartmentRatio: 82, detachedRatio: 7, co2PerHousehold: 202, avgElecKwh: 385, avgGasM3: 47, gridPos: { x: 5, y: 4 } },
  { id: "gangdong", name: "강동구", population: 459000, households: 206000, apartmentRatio: 80, detachedRatio: 10, co2PerHousehold: 175, avgElecKwh: 305, avgGasM3: 44, gridPos: { x: 5, y: 3 } },
]

type SortKey = "name" | "co2PerHousehold" | "population" | "apartmentRatio"

export function CarbonMapTab() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictData | null>(null)
  const [viewMode, setViewMode] = useState<"map" | "list">("map")
  const [sortBy, setSortBy] = useState<SortKey>("name")
  const [sortAsc, setSortAsc] = useState(true)

  const filteredDistricts = useMemo(() => {
    let list = [...SEOUL_DATA]
    if (searchTerm) list = list.filter(d => d.name.includes(searchTerm))
    
    list.sort((a, b) => {
      let cmp = 0
      if (sortBy === "name") cmp = a.name.localeCompare(b.name)
      else cmp = (a[sortBy] as number) - (b[sortBy] as number)
      return sortAsc ? cmp : -cmp
    })
    return list
  }, [searchTerm, sortBy, sortAsc])

  const getStatusColor = (co2: number) => {
    if (co2 >= 200) return "bg-red-500"
    if (co2 >= 170) return "bg-orange-500"
    if (co2 >= 150) return "bg-yellow-500"
    return "bg-emerald-500"
  }

  const getStatusText = (co2: number) => {
    if (co2 >= 200) return "매우 높음"
    if (co2 >= 170) return "높음"
    if (co2 >= 150) return "보통"
    return "안전"
  }

  return (
    <div className="flex flex-col gap-6 pb-20 animate-in fade-in duration-700">
      {/* Top Info Header */}
      <Card className="p-5 bg-gradient-to-br from-emerald-600 to-green-700 text-white border-none shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black flex items-center gap-2 mb-1">
              <Leaf className="w-6 h-6" /> 서울 자치구별 탄소 지표
            </h2>
            <p className="text-emerald-100 text-sm">
              2024 통계청 데이터 기반으로 했는데 최신 데이터 찾으면 변경하면 될 것 같습니다!.
            </p>
          </div>
          <div className="flex gap-2 bg-white/10 p-1 rounded-lg backdrop-blur-md">
            <button 
              onClick={() => setViewMode("map")}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === "map" ? "bg-white text-emerald-700 shadow-sm" : "hover:bg-white/10"}`}
            >
              지도 뷰
            </button>
            <button 
              onClick={() => setViewMode("list")}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === "list" ? "bg-white text-emerald-700 shadow-sm" : "hover:bg-white/10"}`}
            >
              리스트
            </button>
          </div>
        </div>
      </Card>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="자치구 검색 (예: 강남구)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          />
        </div>
      </div>

      {viewMode === "map" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Visualization Area */}
          <Card className="lg:col-span-2 p-4 md:p-8 bg-slate-50 dark:bg-slate-950 overflow-hidden min-h-[500px]">
            <div className="relative w-full max-w-[600px] mx-auto aspect-square">
              {/* Layout Grid (Simplified Seoul Map) */}
              <div className="grid grid-cols-6 grid-rows-7 gap-2 w-full h-full">
                {SEOUL_DATA.map((district) => {
                  const barHeight = (district.co2PerHousehold / 250) * 100
                  const isSelected = selectedDistrict?.id === district.id
                  
                  return (
                    <div
                      key={district.id}
                      style={{
                        gridColumnStart: district.gridPos.x + 1,
                        gridRowStart: district.gridPos.y + 1,
                      }}
                      className={`relative group cursor-pointer transition-all duration-300 hover:z-20`}
                      onClick={() => setSelectedDistrict(district)}
                    >
                      {/* Bar Graph on Map */}
                      <div className="absolute inset-0 flex flex-col items-center justify-end pb-1 px-1">
                        <div 
                          className={`w-full rounded-t-sm transition-all duration-1000 ease-out flex items-start justify-center ${getStatusColor(district.co2PerHousehold)}`}
                          style={{ height: `${barHeight}%` }}
                        >
                          <span className="text-[8px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            {district.co2PerHousehold}
                          </span>
                        </div>
                        <div className={`w-full h-1 rounded-b-sm bg-slate-300 dark:bg-slate-700`} />
                      </div>
                      
                      {/* District Label */}
                      <div className={`
                        absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 rounded text-[9px] font-black tracking-tighter
                        ${isSelected ? "bg-emerald-600 text-white" : "bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300"}
                        shadow-sm border border-slate-200 dark:border-slate-700
                      `}>
                        {district.name.replace("구", "")}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            
            {/* Legend */}
            <div className="mt-8 flex flex-wrap gap-4 justify-center bg-white dark:bg-slate-900 p-3 rounded-xl border border-border">
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="text-slate-400">배출 등급:</span>
                <div className="flex gap-3">
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500"/> 안전</div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-yellow-500"/> 보통</div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-orange-500"/> 높음</div>
                  <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500"/> 매우 높음</div>
                </div>
              </div>
            </div>
          </Card>

          {/* District Detail Panel */}
          <div className="space-y-4">
            {selectedDistrict ? (
              <Card className="p-6 border-emerald-500/30 shadow-lg animate-in slide-in-from-right duration-500">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white">{selectedDistrict.name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> 서울특별시 자치구
                    </p>
                  </div>
                  <div className={`px-4 py-1 rounded-full text-white text-xs font-black ${getStatusColor(selectedDistrict.co2PerHousehold)}`}>
                    {getStatusText(selectedDistrict.co2PerHousehold)}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                      <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                        <Users className="w-3 h-3" /> 총 인구
                      </p>
                      <p className="text-lg font-bold">{(selectedDistrict.population / 10000).toFixed(1)}<span className="text-sm font-normal ml-0.5">만 명</span></p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                      <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                        <LayoutGrid className="w-3 h-3" /> 총 가구
                      </p>
                      <p className="text-lg font-bold">{(selectedDistrict.households / 10000).toFixed(1)}<span className="text-sm font-normal ml-0.5">만 세대</span></p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-bold flex items-center gap-1.5"><Building2 className="w-4 h-4 text-blue-500"/> 아파트 비율</span>
                      <span className="text-sm font-black text-blue-600">{selectedDistrict.apartmentRatio}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${selectedDistrict.apartmentRatio}%` }} />
                    </div>
                    
                    <div className="flex justify-between items-end mt-2">
                      <span className="text-sm font-bold flex items-center gap-1.5"><Home className="w-4 h-4 text-amber-500"/> 단독주택 비율</span>
                      <span className="text-sm font-black text-amber-600">{selectedDistrict.detachedRatio}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full transition-all duration-700" style={{ width: `${selectedDistrict.detachedRatio}%` }} />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-bold">월평균 에너지 소비</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="py-2 px-1 rounded-lg border border-border">
                        <p className="text-[10px] text-muted-foreground">전력</p>
                        <p className="text-md font-black">{selectedDistrict.avgElecKwh}<span className="text-[10px] font-normal">kWh</span></p>
                      </div>
                      <div className="py-2 px-1 rounded-lg border border-border">
                        <p className="text-[10px] text-muted-foreground">가스</p>
                        <p className="text-md font-black">{selectedDistrict.avgGasM3}<span className="text-[10px] font-normal">m³</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="h-full flex flex-col items-center justify-center p-8 text-center border-dashed border-2">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
                  <MapPin className="w-8 h-8 text-slate-300" />
                </div>
                <h4 className="text-lg font-bold text-slate-400">지도를 클릭하여 상세 데이터를 확인하세요</h4>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <Card className="overflow-hidden border-border shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-900 border-b border-border">
                <tr>
                  <th className="px-4 py-4 font-bold">자치구</th>
                  <th className="px-4 py-4 font-bold text-center">인구(명)</th>
                  <th className="px-4 py-4 font-bold text-center">아파트(%)</th>
                  <th className="px-4 py-4 font-bold text-center">단독(%)</th>
                  <th className="px-4 py-4 font-bold text-right text-emerald-600">CO₂/가구(kg)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDistricts.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer" onClick={() => {setSelectedDistrict(d); setViewMode("map")}}>
                    <td className="px-4 py-4 font-bold">{d.name}</td>
                    <td className="px-4 py-4 text-center text-muted-foreground">{d.population.toLocaleString()}</td>
                    <td className="px-4 py-4 text-center">{d.apartmentRatio}%</td>
                    <td className="px-4 py-4 text-center">{d.detachedRatio}%</td>
                    <td className="px-4 py-4 text-right">
                      <span className={`inline-block px-2 py-1 rounded font-bold ${getStatusColor(d.co2PerHousehold)} text-white text-xs min-w-[45px] text-center`}>
                        {d.co2PerHousehold}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Analytics Insight */}
      <Card className="p-5 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-500 shrink-0" />
          <div className="text-xs leading-relaxed text-blue-800 dark:text-blue-200">
            <p className="font-bold mb-1">데이터 분석 요약:</p>
            **강남구**, **서초구**, **송파구** 등 동남권 지역은 가구당 에너지 사용량(전력)이 평균보다 약 **30%** 이상 높으며, 
            이에 따라 탄소 배출 등급이 **매우 높음** 단계로 나타납니다. 
            반면 단독주택 비율이 높은 **관악구**, **강북구** 등은 가구당 배출량이 상대적으로 낮지만, 
            노후 주택의 에너지 효율 개선(창호, 단열)이 탄소 중립의 핵심 과제로 분석됩니다.
          </div>
        </div>
      </Card>
    </div>
  )
}
