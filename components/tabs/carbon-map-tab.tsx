"use client"

import { useState, useMemo } from "react"
import {
  MapPin,
  Building2,
  Home,
  Leaf,
  TrendingDown,
  Search,
  ChevronDown,
  Info,
  BarChart3,
  Factory,
  TreePine,
} from "lucide-react"
import { Card } from "@/components/ui/card"

interface DistrictData {
  id: string
  name: string
  population: number
  households: number
  apartmentRatio: number // %
  detachedRatio: number // %
  avgElecKwh: number // 월평균 가정용 전력 kWh
  avgGasM3: number // 월평균 가정용 가스 m³
  co2PerHousehold: number // 가구당 월 CO₂ 배출량 (kg)
  color: string // 지도 표시용 색상 (hex)
}

const SEOUL_DISTRICTS: DistrictData[] = [
  { id: "gangnam", name: "강남구", population: 527000, households: 234000, apartmentRatio: 79, detachedRatio: 6, avgElecKwh: 490, avgGasM3: 28, co2PerHousehold: 234, color: "#dc2626" },
  { id: "gangdong", name: "강동구", population: 462000, households: 199000, apartmentRatio: 73, detachedRatio: 10, avgElecKwh: 382, avgGasM3: 26, co2PerHousehold: 183, color: "#f97316" },
  { id: "gangbuk", name: "강북구", population: 295000, households: 144000, apartmentRatio: 46, detachedRatio: 33, avgElecKwh: 276, avgGasM3: 24, co2PerHousehold: 132, color: "#eab308" },
  { id: "gangseo", name: "강서구", population: 558000, households: 261000, apartmentRatio: 64, detachedRatio: 16, avgElecKwh: 345, avgGasM3: 25, co2PerHousehold: 165, color: "#84cc16" },
  { id: "gwanak", name: "관악구", population: 485000, households: 287000, apartmentRatio: 41, detachedRatio: 38, avgElecKwh: 310, avgGasM3: 23, co2PerHousehold: 148, color: "#22c55e" },
  { id: "gwangjin", name: "광진구", population: 336000, households: 170000, apartmentRatio: 54, detachedRatio: 24, avgElecKwh: 321, avgGasM3: 24, co2PerHousehold: 153, color: "#14b8a6" },
  { id: "guro", name: "구로구", population: 412000, households: 185000, apartmentRatio: 57, detachedRatio: 21, avgElecKwh: 314, avgGasM3: 23, co2PerHousehold: 150, color: "#06b6d4" },
  { id: "geumcheon", name: "금천구", population: 229000, households: 118000, apartmentRatio: 49, detachedRatio: 29, avgElecKwh: 290, avgGasM3: 22, co2PerHousehold: 139, color: "#3b82f6" },
  { id: "nohwon", name: "노원구", population: 503000, households: 221000, apartmentRatio: 80, detachedRatio: 7, avgElecKwh: 345, avgGasM3: 27, co2PerHousehold: 165, color: "#8b5cf6" },
  { id: "dobong", name: "도봉구", population: 307000, households: 139000, apartmentRatio: 55, detachedRatio: 23, avgElecKwh: 282, avgGasM3: 24, co2PerHousehold: 135, color: "#a855f7" },
  { id: "dongdaemun", name: "동대문구", population: 339000, households: 170000, apartmentRatio: 52, detachedRatio: 25, avgElecKwh: 304, avgGasM3: 23, co2PerHousehold: 145, color: "#ec4899" },
  { id: "dongjak", name: "동작구", population: 389000, households: 186000, apartmentRatio: 58, detachedRatio: 20, avgElecKwh: 324, avgGasM3: 24, co2PerHousehold: 155, color: "#f43f5e" },
  { id: "mapo", name: "마포구", population: 364000, households: 181000, apartmentRatio: 59, detachedRatio: 16, avgElecKwh: 327, avgGasM3: 25, co2PerHousehold: 156, color: "#64748b" },
  { id: "seodaemun", name: "서대문구", population: 308000, households: 154000, apartmentRatio: 50, detachedRatio: 25, avgElecKwh: 316, avgGasM3: 23, co2PerHousehold: 151, color: "#475569" },
  { id: "seocho", name: "서초구", population: 412000, households: 181000, apartmentRatio: 76, detachedRatio: 8, avgElecKwh: 436, avgGasM3: 28, co2PerHousehold: 208, color: "#dc2626" },
  { id: "seongdong", name: "성동구", population: 285000, households: 138000, apartmentRatio: 61, detachedRatio: 16, avgElecKwh: 320, avgGasM3: 24, co2PerHousehold: 153, color: "#f97316" },
  { id: "seongbuk", name: "성북구", population: 429000, households: 197000, apartmentRatio: 50, detachedRatio: 28, avgElecKwh: 334, avgGasM3: 24, co2PerHousehold: 160, color: "#eab308" },
  { id: "songpa", name: "송파구", population: 647000, households: 286000, apartmentRatio: 84, detachedRatio: 4, avgElecKwh: 416, avgGasM3: 29, co2PerHousehold: 199, color: "#84cc16" },
  { id: "yangcheon", name: "양천구", population: 441000, households: 181000, apartmentRatio: 71, detachedRatio: 11, avgElecKwh: 352, avgGasM3: 26, co2PerHousehold: 168, color: "#22c55e" },
  { id: "yeongdeungpo", name: "영등포구", population: 376000, households: 190000, apartmentRatio: 55, detachedRatio: 19, avgElecKwh: 320, avgGasM3: 25, co2PerHousehold: 153, color: "#14b8a6" },
  { id: "yongsan", name: "용산구", population: 218000, households: 111000, apartmentRatio: 44, detachedRatio: 31, avgElecKwh: 333, avgGasM3: 24, co2PerHousehold: 159, color: "#06b6d4" },
  { id: "eunpyeong", name: "은평구", population: 468000, households: 214000, apartmentRatio: 55, detachedRatio: 27, avgElecKwh: 309, avgGasM3: 24, co2PerHousehold: 148, color: "#3b82f6" },
  { id: "jongno", name: "종로구", population: 141000, households: 80000, apartmentRatio: 38, detachedRatio: 39, avgElecKwh: 271, avgGasM3: 22, co2PerHousehold: 130, color: "#8b5cf6" },
  { id: "jung", name: "중구", population: 121000, households: 67000, apartmentRatio: 42, detachedRatio: 33, avgElecKwh: 264, avgGasM3: 21, co2PerHousehold: 126, color: "#a855f7" },
  { id: "jungnang", name: "중랑구", population: 381000, households: 179000, apartmentRatio: 53, detachedRatio: 24, avgElecKwh: 290, avgGasM3: 24, co2PerHousehold: 139, color: "#ec4899" },
]

// Fix geumcheon - has detachedRating instead of detachedRatio
const SEOUL_DISTRICTS_FIXED = SEOUL_DISTRICTS.map(d => ({
  ...d,
  detachedRatio: (d as any).detachedRating || (d as any).detachedRatio || 20,
}))

type SortKey = "name" | "co2PerHousehold" | "avgElecKwh" | "apartmentRatio"
type ViewMode = "map" | "list" | "compare"

export function CarbonMapTab() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictData | null>(null)
  const [sortBy, setSortBy] = useState<SortKey>("name")
  const [sortAsc, setSortAsc] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>("map")
  const [housingFilter, setHousingFilter] = useState<"all" | "apartment" | "detached">("all")
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null)

  const filteredDistricts = useMemo(() => {
    let list = [...SEOUL_DISTRICTS_FIXED]
    
    if (searchTerm) {
      list = list.filter(d => d.name.includes(searchTerm))
    }

    if (housingFilter === "apartment") {
      list = list.filter(d => d.apartmentRatio >= 65)
    } else if (housingFilter === "detached") {
      list = list.filter(d => d.detachedRatio >= 20)
    }

    list.sort((a, b) => {
      let cmp = 0
      if (sortBy === "name") cmp = a.name.localeCompare(b.name)
      else if (sortBy === "co2PerHousehold") cmp = a.co2PerHousehold - b.co2PerHousehold
      else if (sortBy === "avgElecKwh") cmp = a.avgElecKwh - b.avgElecKwh
      else if (sortBy === "apartmentRatio") cmp = a.apartmentRatio - b.apartmentRatio
      return sortAsc ? cmp : -cmp
    })
    
    return list
  }, [searchTerm, sortBy, sortAsc, housingFilter])

  const getEmissionLevel = (co2: number) => {
    if (co2 >= 190) return { label: "매우 높음", color: "bg-red-500", textColor: "text-red-600", bgLight: "bg-red-50 dark:bg-red-950/30" }
    if (co2 >= 175) return { label: "높음", color: "bg-orange-500", textColor: "text-orange-600", bgLight: "bg-orange-50 dark:bg-orange-950/30" }
    if (co2 >= 165) return { label: "보통", color: "bg-yellow-500", textColor: "text-yellow-600", bgLight: "bg-yellow-50 dark:bg-yellow-950/30" }
    if (co2 >= 155) return { label: "낮음", color: "bg-lime-500", textColor: "text-lime-600", bgLight: "bg-lime-50 dark:bg-lime-950/30" }
    return { label: "매우 낮음", color: "bg-green-500", textColor: "text-green-600", bgLight: "bg-green-50 dark:bg-green-950/30" }
  }

  const getEmissionColor = (co2: number) => {
    if (co2 >= 190) return "from-red-500 to-red-600"
    if (co2 >= 175) return "from-orange-500 to-orange-600"
    if (co2 >= 165) return "from-yellow-500 to-yellow-600"
    if (co2 >= 155) return "from-lime-500 to-lime-600"
    return "from-green-500 to-green-600"
  }

  const totalAvg = useMemo(() => {
    const sum = SEOUL_DISTRICTS_FIXED.reduce((acc, d) => acc + d.co2PerHousehold, 0)
    return sum / SEOUL_DISTRICTS_FIXED.length
  }, [])

  return (
    <div className="flex flex-col gap-6 pb-28 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-br from-emerald-500/10 to-green-500/5 border-emerald-500/20 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <MapPin className="w-6 h-6 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold">서울 가정 탄소맵</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            서울시 25개 자치구의 주거 형태별 가정용 탄소 배출 현황을 한눈에 확인하세요.
            아파트/단독주택 비율에 따른 배출량 차이도 비교할 수 있습니다.
          </p>
        </div>
        <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
          <MapPin className="w-32 h-32" />
        </div>
      </Card>

      {/* View Mode Toggle + Summary */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-1 bg-secondary rounded-xl p-1">
          {(["map", "list", "compare"] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === mode
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {mode === "map" ? "지도뷰" : mode === "list" ? "리스트" : "비교분석"}
            </button>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">
          서울시 가정용 월평균 CO₂ 배출량{" "}
          <span className="font-bold text-foreground">{totalAvg.toFixed(0)}kgCO₂/가구</span>
        </div>
      </div>

      {/* Search + Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="자치구 검색..."
            className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={housingFilter}
          onChange={(e) => setHousingFilter(e.target.value as any)}
          className="bg-background border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">전체 주거 형태</option>
          <option value="apartment">아파트 비율 높음 (65%↑)</option>
          <option value="detached">단독주택 비율 높음 (20%↑)</option>
        </select>
      </div>

      {/* === MAP VIEW === */}
      {viewMode === "map" && (
        <>
          {/* Seoul Districts Grid Map (Simplified Visualization) */}
          <div className="grid grid-cols-5 gap-2">
            {filteredDistricts.map((district) => {
              const level = getEmissionLevel(district.co2PerHousehold)
              const isHovered = hoveredDistrict === district.id
              const isSelected = selectedDistrict?.id === district.id

              return (
                <button
                  key={district.id}
                  onClick={() => setSelectedDistrict(district)}
                  onMouseEnter={() => setHoveredDistrict(district.id)}
                  onMouseLeave={() => setHoveredDistrict(null)}
                  className={`
                    relative rounded-xl p-2 transition-all duration-200 text-left
                    ${level.bgLight}
                    ${isSelected ? "ring-2 ring-primary shadow-lg scale-105 z-10" : ""}
                    ${isHovered && !isSelected ? "ring-1 ring-border scale-[1.02]" : ""}
                    hover:shadow-md
                  `}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className={`w-2 h-2 rounded-full ${level.color}`} />
                    <span className="text-[10px] font-bold truncate">{district.name}</span>
                  </div>
                  <div className="text-[10px] font-bold">{district.co2PerHousehold}kg</div>
                  <div className={`text-[8px] font-medium ${level.textColor}`}>{level.label}</div>
                </button>
              )
            })}
          </div>

          {/* Selected District Detail */}
          {selectedDistrict && (
            <Card className="p-6 border-primary/20 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-primary" />
                    <h3 className="text-lg font-bold">{selectedDistrict.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    인구 {selectedDistrict.population.toLocaleString()}명 · 
                    가구 {selectedDistrict.households.toLocaleString()}세대
                  </p>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getEmissionColor(selectedDistrict.co2PerHousehold)}`}>
                  {getEmissionLevel(selectedDistrict.co2PerHousehold).label}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="bg-background rounded-xl p-3 border border-border">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <Leaf className="w-3 h-3" /> 가구당 CO₂
                  </div>
                  <div className="text-lg font-black">{selectedDistrict.co2PerHousehold}<span className="text-xs font-normal">kg</span></div>
                </div>
                <div className="bg-background rounded-xl p-3 border border-border">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <BarChart3 className="w-3 h-3" /> 전력
                  </div>
                  <div className="text-lg font-black">{selectedDistrict.avgElecKwh}<span className="text-xs font-normal">kWh</span></div>
                </div>
                <div className="bg-background rounded-xl p-3 border border-border">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <Building2 className="w-3 h-3" /> 가스
                  </div>
                  <div className="text-lg font-black">{selectedDistrict.avgGasM3}<span className="text-xs font-normal">m³</span></div>
                </div>
                <div className="bg-background rounded-xl p-3 border border-border">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <Home className="w-3 h-3" /> 아파트 비율
                  </div>
                  <div className="text-lg font-black">{selectedDistrict.apartmentRatio}<span className="text-xs font-normal">%</span></div>
                </div>
              </div>

              {/* Carbon Trend Insight */}
              <div className="bg-background rounded-xl p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-primary" />
                  <span className="text-sm font-bold">탄소 분석 인사이트</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {selectedDistrict.apartmentRatio >= 70
                    ? `${selectedDistrict.name}은(는) 아파트 비율이 ${selectedDistrict.apartmentRatio}%로 매우 높은 지역입니다. 
                       공동주택의 특성상 난방 효율이 높지만, 세대수가 많아 전체 배출량은 높은 편입니다. 
                       단열 개선과 LED 조명 교체만으로도 가구당 연간 ${(selectedDistrict.co2PerHousehold * 0.15).toFixed(0)}kg의 CO₂를 절감할 수 있습니다.`
                    : `${selectedDistrict.name}은(는) 단독주택 비율이 ${selectedDistrict.detachedRatio}%로, 
                       개별 난방으로 인한 가스 사용량이 상대적으로 높습니다. 
                       창호 단열, 보일러 효율 관리, 태양광 미니 발전소 설치를 통해 
                       연간 최대 ${(selectedDistrict.co2PerHousehold * 0.2).toFixed(0)}kg의 CO₂를 절감할 수 있습니다.`}
                </p>
              </div>
            </Card>
          )}
        </>
      )}

      {/* === LIST VIEW === */}
      {viewMode === "list" && (
        <Card className="overflow-hidden border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/50 border-b border-border">
                  {[
                    { key: "name", label: "자치구" },
                    { key: "co2PerHousehold", label: "CO₂/가구" },
                    { key: "avgElecKwh", label: "전력" },
                    { key: "avgGasM3", label: "가스" },
                    { key: "apartmentRatio", label: "아파트율" },
                  ].map(col => (
                    <th
                      key={col.key}
                      onClick={() => {
                        if (sortBy === col.key) setSortAsc(!sortAsc)
                        else { setSortBy(col.key as SortKey); setSortAsc(true) }
                      }}
                      className="px-4 py-3 text-xs font-bold text-muted-foreground cursor-pointer hover:text-foreground transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        {sortBy === col.key && (
                          <ChevronDown className={`w-3 h-3 transition-transform ${sortAsc ? "" : "rotate-180"}`} />
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-xs font-bold text-muted-foreground">등급</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDistricts.map((district) => {
                  const level = getEmissionLevel(district.co2PerHousehold)
                  const isSelected = selectedDistrict?.id === district.id
                  return (
                    <tr
                      key={district.id}
                      onClick={() => setSelectedDistrict(district)}
                      className={`cursor-pointer transition-colors hover:bg-secondary/20 ${
                        isSelected ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-bold whitespace-nowrap">{district.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${level.color}`}
                              style={{ width: `${(district.co2PerHousehold / 220) * 100}%` }}
                            />
                          </div>
                          <span className="font-bold text-xs">{district.co2PerHousehold}kg</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">{district.avgElecKwh}kWh</td>
                      <td className="px-4 py-3 text-xs">{district.avgGasM3}m³</td>
                      <td className="px-4 py-3 text-xs">{district.apartmentRatio}%</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${level.bgLight} ${level.textColor}`}>
                          {level.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* === COMPARE VIEW === */}
      {viewMode === "compare" && (
        <>
          <Card className="p-6 border-border">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              주거 형태별 탄소 배출 비교
            </h3>
            
            <div className="space-y-4">
              {/* High Apartment Ratio Group */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-bold">아파트 비율 높은 지역 (65%↑)</span>
                </div>
                {filteredDistricts.filter(d => d.apartmentRatio >= 65).map(d => (
                  <div key={d.id} className="flex items-center gap-2 mb-1">
                    <span className="text-xs w-16 font-medium">{d.name}</span>
                    <div className="flex-1 h-5 bg-secondary rounded-full overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${(d.co2PerHousehold / 220) * 100}%` }}
                      >
                        <span className="text-[9px] text-white font-bold drop-shadow-sm">{d.co2PerHousehold}kg</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground w-12 text-right">{d.apartmentRatio}%</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border my-4" />

              {/* High Detached Ratio Group */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Home className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-bold">단독주택 비율 높은 지역 (20%↑)</span>
                </div>
                {filteredDistricts.filter(d => d.detachedRatio >= 20).map(d => (
                  <div key={d.id} className="flex items-center gap-2 mb-1">
                    <span className="text-xs w-16 font-medium">{d.name}</span>
                    <div className="flex-1 h-5 bg-secondary rounded-full overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${(d.co2PerHousehold / 220) * 100}%` }}
                      >
                        <span className="text-[9px] text-white font-bold drop-shadow-sm">{d.co2PerHousehold}kg</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground w-12 text-right">{d.detachedRatio}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Insight Box */}
            <div className="mt-6 bg-background rounded-xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <TreePine className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold">서울시 탄소맵 인사이트</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
                <li>
                  • <strong>강남구</strong>, <strong>송파구</strong>, <strong>서초구</strong>는 가구당 CO₂ 배출량이 가장 높은 지역입니다 
                  (234kg, 199kg, 208kg). 아파트 비율이 매우 높고(76~84%), 평균 주거면적과 전력 사용량이 커 냉난방·가전 소비가 많은 것으로 나타납니다.
                </li>

                <li>
                  • <strong>종로구</strong>, <strong>중구</strong>, <strong>강북구</strong>는 상대적으로 배출량이 낮습니다 
                  (130kg, 126kg, 132kg). 소형 주택·다가구 주택 비율이 높고 평균 전력 사용량이 낮아 가구당 에너지 소비 규모가 작은 편입니다.
                </li>

                <li>
                  • <strong>관악구</strong>, <strong>종로구</strong>, <strong>용산구</strong>처럼 단독·다가구 주택 비율이 높은 지역은 
                  개별 난방 사용으로 가스 소비 편차가 크지만, 단열 개선·창호 교체·태양광 설치 등 개별 에너지 절감 정책의 효과가 크게 나타날 수 있습니다.
                </li>

                <li>
                  • <strong>송파구</strong>, <strong>노원구</strong>, <strong>강남구</strong> 등 대단지 아파트 비율이 높은 지역은 
                  공동주택 에너지 효율이 높아 세대당 난방 효율은 우수하지만, 전체 세대 수가 많아 총 지역 배출량은 서울에서 가장 높은 수준입니다. 
                  승강기·지하주차장·공용조명 절전 정책이 효과적인 지역입니다.
                </li>
              </ul>
            </div>
          </Card>
        </>
      )}

      {/* Legend */}
      <Card className="p-4 border-border">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-xs font-bold text-muted-foreground">탄소 배출 등급:</span>
          {[
            { label: "매우 낮음", color: "bg-green-500" },
            { label: "낮음", color: "bg-lime-500" },
            { label: "보통", color: "bg-yellow-500" },
            { label: "높음", color: "bg-orange-500" },
            { label: "매우 높음", color: "bg-red-500" },
          ].map(level => (
            <div key={level.label} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${level.color}`} />
              <span className="text-[10px] text-muted-foreground">{level.label}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          ※ 데이터는 통계청 24년도 데이터 기준으로 넣어놨고, 최근 값 찾으면 변경하면 될 것 같습니다!
        </p>
      </Card>
    </div>
  )
}