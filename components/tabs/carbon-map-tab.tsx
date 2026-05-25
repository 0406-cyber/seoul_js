"use client"

import { useState, useMemo } from "react"
import { MapContainer, TileLayer, Marker } from "react-leaflet"
import L from "leaflet"
import { 
  Building2, 
  Home, 
  Leaf, 
  Search, 
  Users, 
  Zap, 
  Info,
  ChevronRight,
  MapPin
} from "lucide-react"
import { Card } from "@/components/ui/card"

interface DistrictData {
  id: string
  name: string
  lat: number
  lng: number
  pop: number 
  households: number 
  aptRatio: number 
  detRatio: number 
  co2: number 
  elec: number 
}

const SEOUL_REAL_DATA: DistrictData[] = [
  { id: "gangnam", name: "강남구", lat: 37.4959, lng: 127.0664, pop: 546000, households: 242000, aptRatio: 85, detRatio: 5, co2: 232, elec: 450 },
  { id: "seocho", name: "서초구", lat: 37.4837, lng: 127.0324, pop: 404000, households: 172000, aptRatio: 86, detRatio: 6, co2: 215, elec: 420 },
  { id: "songpa", name: "송파구", lat: 37.5145, lng: 127.1067, pop: 658000, households: 289000, aptRatio: 82, detRatio: 7, co2: 202, elec: 385 },
  { id: "gangseo", name: "강서구", lat: 37.5509, lng: 126.8495, pop: 563000, households: 275000, aptRatio: 68, detRatio: 15, co2: 158, elec: 250 },
  { id: "nowon", name: "노원구", lat: 37.6542, lng: 127.0568, pop: 498000, households: 219000, aptRatio: 88, detRatio: 4, co2: 162, elec: 260 },
  { id: "gwanak", name: "관악구", lat: 37.4784, lng: 126.9513, pop: 483000, households: 291000, aptRatio: 48, detRatio: 38, co2: 140, elec: 215 },
  { id: "yongsan", name: "용산구", lat: 37.5326, lng: 126.9904, pop: 215000, households: 109000, aptRatio: 61, detRatio: 26, co2: 195, elec: 345 },
  { id: "mapo", name: "마포구", lat: 37.5663, lng: 126.9016, pop: 365000, households: 182000, aptRatio: 72, detRatio: 14, co2: 172, elec: 285 },
  { id: "yeongdeungpo", name: "영등포구", lat: 37.5264, lng: 126.8962, pop: 376000, households: 192000, aptRatio: 70, detRatio: 14, co2: 170, elec: 295 },
  { id: "jongno", name: "종로구", lat: 37.5730, lng: 126.9794, pop: 141000, households: 78000, aptRatio: 42, detRatio: 36, co2: 168, elec: 275 },
  { id: "junggu", name: "중구", lat: 37.5636, lng: 126.9975, pop: 121000, households: 66000, aptRatio: 64, detRatio: 19, co2: 165, elec: 280 },
  { id: "seongdong", name: "성동구", lat: 37.5633, lng: 127.0371, pop: 278000, households: 134000, aptRatio: 82, detRatio: 10, co2: 178, elec: 310 },
  { id: "gwangjin", name: "광진구", lat: 37.5385, lng: 127.0824, pop: 334000, households: 171000, aptRatio: 51, detRatio: 29, co2: 146, elec: 230 },
  { id: "dongdaemun", name: "동대문구", lat: 37.5744, lng: 127.0400, pop: 341000, households: 175000, aptRatio: 60, detRatio: 21, co2: 152, elec: 238 },
  { id: "jungnang", name: "중랑구", lat: 37.6065, lng: 127.0927, pop: 382000, households: 188000, aptRatio: 52, detRatio: 28, co2: 148, elec: 225 },
  { id: "seongbuk", name: "성북구", lat: 37.5891, lng: 127.0182, pop: 428000, households: 198000, aptRatio: 65, detRatio: 22, co2: 154, elec: 240 },
  { id: "gangbuk", name: "강북구", lat: 37.6396, lng: 127.0257, pop: 289000, households: 145000, aptRatio: 48, detRatio: 32, co2: 142, elec: 210 },
  { id: "dobong", name: "도봉구", lat: 37.6688, lng: 127.0471, pop: 304000, households: 139000, aptRatio: 74, detRatio: 12, co2: 158, elec: 245 },
  { id: "eunpyeong", name: "은평구", lat: 37.6027, lng: 126.9291, pop: 463000, households: 216000, aptRatio: 62, detRatio: 24, co2: 150, elec: 235 },
  { id: "seodaemun", name: "서대문구", lat: 37.5791, lng: 126.9368, pop: 306000, households: 149000, aptRatio: 68, detRatio: 18, co2: 155, elec: 242 },
  { id: "yangcheon", name: "양천구", lat: 37.5169, lng: 126.8664, pop: 435000, households: 183000, aptRatio: 84, detRatio: 8, co2: 185, elec: 320 },
  { id: "guro", name: "구로구", lat: 37.4954, lng: 126.8875, pop: 392000, households: 185000, aptRatio: 75, detRatio: 16, co2: 156, elec: 245 },
  { id: "geumcheon", name: "금천구", lat: 37.4568, lng: 126.8954, pop: 228000, households: 121000, aptRatio: 58, detRatio: 27, co2: 135, elec: 205 },
  { id: "dongjak", name: "동작구", lat: 37.5022, lng: 126.9393, pop: 381000, households: 188000, aptRatio: 72, detRatio: 18, co2: 160, elec: 255 },
  { id: "gangdong", name: "강동구", lat: 37.5302, lng: 127.1238, pop: 459000, households: 206000, aptRatio: 80, detRatio: 10, co2: 175, elec: 305 },
]

// Turbopack 에러를 방지하기 위해 템플릿 리터럴 대신 일반 문자열 결합 사용
const createBarIcon = (co2: number, name: string, isSelected: boolean) => {
  const height = (co2 / 250) * 60
  const color = co2 >= 200 ? "#f43f5e" : co2 >= 170 ? "#f59e0b" : "#10b981"
  const barClass = isSelected ? "eco-pop" : ""
  
  return L.divIcon({
    className: "custom-bar-marker " + barClass,
    html: '<div style="display: flex; flex-direction: column; align-items: center; position: relative; bottom: ' + height + 'px;">' +
          '<div style="width: 10px; height: ' + height + 'px; background-color: ' + color + '; border-radius: 6px; box-shadow: ' + (isSelected ? '0 0 15px ' + color : '0 2px 5px rgba(0,0,0,0.2)') + '; border: ' + (isSelected ? '2.5px solid white' : 'none') + '; transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);"></div>' +
          '<div style="margin-top: 6px; padding: 3px 8px; background-color: ' + (isSelected ? '#0F172A' : 'rgba(255,255,255,0.95)') + '; color: ' + (isSelected ? 'white' : '#1e293b') + '; border-radius: 8px; font-size: 11px; font-weight: 900; white-space: nowrap; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid rgba(0,0,0,0.05);">' + 
          name.replace("구", "") + '</div>' +
          '</div>',
    iconSize: [0, 0],
    iconAnchor: [0, 0]
  })
}

export function CarbonMapTab() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredData = useMemo(() => 
    SEOUL_REAL_DATA.filter(d => d.name.includes(searchTerm)), [searchTerm]
  )

  const selectedData = useMemo(() => 
    SEOUL_REAL_DATA.find(d => d.id === selectedId) || null, [selectedId]
  )

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700 pb-20">
      {/* Search Header */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <input 
          type="text"
          placeholder="자치구 검색 (예: 강남구)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-primary font-bold transition-all"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Real Leaflet Map
        <Card className="xl:col-span-8 overflow-hidden rounded-[32px] border-none shadow-2xl h-[650px] relative z-0">
          <MapContainer 
            center={[37.5665, 126.9780]} 
            zoom={11} 
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {filteredData.map((district) => (
              <Marker 
                key={district.id} 
                position={[district.lat, district.lng]}
                icon={createBarIcon(district.co2, district.name, selectedId === district.id)}
                eventHandlers={{
                  click: () => setSelectedId(district.id)
                }}
              />
            ))}
          </MapContainer>

          <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-3 glass-card p-5 rounded-3xl text-[11px] font-black">
            <div className="text-muted-foreground text-[9px] uppercase tracking-widest mb-1">CO₂ Emission Scale</div>
            <div className="flex items-center gap-2.5"><div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" /> 150kg 이하 (안전)</div>
            <div className="flex items-center gap-2.5"><div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]" /> 150 - 170kg (보통)</div>
            <div className="flex items-center gap-2.5"><div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" /> 200kg 이상 (주의)</div>
          </div>
        </Card> */}

        {/* Info Sidebar */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          {selectedData ? (
            <Card className="p-7 bg-card shadow-2xl border-none animate-in slide-in-from-right duration-500 rounded-[32px]">
              <div className="flex justify-between items-start mb-8 pb-6 border-b border-border">
                <div>
                  <h3 className="text-3xl font-black leading-tight">{selectedData.name}</h3>
                  <p className="text-[11px] text-primary font-bold tracking-widest uppercase mt-1">Geographic Energy Stats</p>
                </div>
                <div className="p-3.5 bg-primary/10 rounded-2xl eco-hop">
                  <Leaf className="w-7 h-7 text-primary" />
                </div>
              </div>

              <div className="space-y-7">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-secondary/50 rounded-3xl">
                    <p className="text-[11px] text-muted-foreground font-black mb-1.5 flex items-center gap-1.5"><Users className="w-4 h-4" /> 인구</p>
                    <p className="text-xl font-black">{selectedData.pop.toLocaleString()} 명</p>
                  </div>
                  <div className="p-5 bg-secondary/50 rounded-3xl">
                    <p className="text-[11px] text-muted-foreground font-black mb-1.5 flex items-center gap-1.5"><Home className="w-4 h-4" /> 가구</p>
                    <p className="text-xl font-black">{selectedData.households.toLocaleString()} 세대</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="flex justify-between text-[12px] font-black text-chart-2 mb-1">
                    <span><Building2 className="inline w-4 h-4 mr-1.5" /> 아파트 비율</span>
                    <span>{selectedData.aptRatio}%</span>
                  </div>
                  <div className="h-3 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-chart-2 shadow-[0_0_10px_#22D3EE]" style={{ width: selectedData.aptRatio + "%" }} />
                  </div>
                </div>

                <div className="mt-8 p-7 bg-foreground text-background rounded-[40px] shadow-2xl relative overflow-hidden group">
                  <div className="relative z-10">
                    <p className="text-primary text-[11px] font-black mb-1 tracking-tighter">ESTIMATED CARBON FOOTPRINT</p>
                    <div className="text-4xl font-black mb-2 tracking-tighter">{selectedData.co2}<span className="text-lg font-normal ml-2 opacity-50">kg CO₂</span></div>
                    <p className="text-[11px] opacity-70 font-bold flex items-center gap-2">
                      <Zap className="w-4 h-4 text-chart-3" /> 월평균 전력 사용량: **{selectedData.elec}kWh**
                    </p>
                  </div>
                  <Leaf className="absolute -right-4 -bottom-4 w-32 h-32 opacity-5 group-hover:opacity-10 transition-opacity rotate-12" />
                </div>
              </div>
            </Card>
          ) : (
            <Card className="flex-1 border-2 border-dashed border-border flex flex-col items-center justify-center p-12 text-center rounded-[40px] bg-transparent">
              <MapPin className="w-14 h-14 text-muted-foreground/30 animate-bounce mb-6" />
              <p className="text-base font-black text-muted-foreground leading-relaxed">지도의 막대를 클릭하여<br/>자치구별 상세 데이터를 확인하세요.</p>
            </Card>
          )}

          <Card className="p-7 bg-primary text-primary-foreground border-none shadow-xl flex items-center gap-5 rounded-[32px] group cursor-pointer hover:brightness-105 transition-all">
            <div className="p-3 bg-primary-foreground/10 rounded-2xl backdrop-blur-md">
              <Zap className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-black opacity-70 uppercase tracking-wider">Analysis Insight</p>
              <p className="text-sm font-bold mt-1 leading-tight">
                지도 부, 다른 방식으로도 넣을 수 있음. 
              </p>
            </div>
            <ChevronRight className="w-5 h-5 opacity-40 group-hover:translate-x-1 transition-transform" />
          </Card>
        </div>
      </div>
    </div>
  )
}