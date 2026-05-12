"use client"

import { useState, useEffect } from "react"
import { QrCode, CheckCircle2, MapPin, Gift, Trophy } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface CampaignTabProps {
  onGrantPoints: (points: number, reason: string) => void
}

interface StampZone {
  id: string
  name: string
  location: string
  points: number
  isCompleted: boolean
}

const INITIAL_ZONES: StampZone[] = [
  { id: "zone-1", name: "에너지 절약 홍보관", location: "서울시청 광장 A구역", points: 50, isCompleted: false },
  { id: "zone-2", name: "제로웨이스트 마켓", location: "을지로 입구 B구역", points: 50, isCompleted: false },
  { id: "zone-3", name: "에코 드라이빙 체험존", location: "광화문 광장 C구역", points: 100, isCompleted: false },
]

export function CampaignTab({ onGrantPoints }: CampaignTabProps) {
  const [zones, setZones] = useState<StampZone[]>(INITIAL_ZONES)
  const [isScanning, setIsScanning] = useState(false)
  const [showSuccess, setShowSuccess] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem("eco_campaign_stamps")
    if (saved) {
      try {
        const completedIds = JSON.parse(saved) as string[]
        setZones(prev => prev.map(z => ({
          ...z,
          isCompleted: completedIds.includes(z.id)
        })))
      } catch (e) {
        console.error("Failed to load stamps", e)
      }
    }
  }, [])

  const saveStamps = (completedIds: string[]) => {
    localStorage.setItem("eco_campaign_stamps", JSON.stringify(completedIds))
  }

  const handleScan = () => {
    setIsScanning(true)
    
    // Simulate QR scanning delay
    setTimeout(() => {
      const pendingZones = zones.filter(z => !z.isCompleted)
      
      if (pendingZones.length === 0) {
        toast.info("이미 모든 스탬프를 모으셨습니다!")
        setIsScanning(false)
        return
      }

      // In a real app, this would be determined by the QR code content
      const nextZone = pendingZones[0]
      
      const newZones = zones.map(z => 
        z.id === nextZone.id ? { ...z, isCompleted: true } : z
      )
      setZones(newZones)
      saveStamps(newZones.filter(z => z.isCompleted).map(z => z.id))
      
      onGrantPoints(nextZone.points, `현장 캠페인 참여: ${nextZone.name}`)
      setShowSuccess(nextZone.name)
      setIsScanning(false)
      
      toast.success(`${nextZone.name} 스탬프 획득! +${nextZone.points}P`)
    }, 1500)
  }

  const completedCount = zones.filter(z => z.isCompleted).length
  const isAllCompleted = completedCount === zones.length

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Card */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/20 rounded-lg">
              <QrCode className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-bold">현장 스탬프 투어</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            캠페인 현장의 QR 코드를 찾아 스캔하세요.<br />
            모든 스탬프를 모으면 특별 보너스가 지급됩니다!
          </p>
          
          <div className="flex items-end justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">나의 스탬프 현황</span>
              <div className="flex gap-1">
                {zones.map((z) => (
                  <div 
                    key={z.id}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                      z.isCompleted 
                        ? "bg-primary border-primary text-primary-foreground scale-110" 
                        : "bg-background border-dashed border-muted-foreground/30 text-muted-foreground/30"
                    }`}
                  >
                    {z.isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-xs font-bold">?</span>}
                  </div>
                ))}
              </div>
            </div>
            
            <Button 
              onClick={handleScan} 
              disabled={isScanning || isAllCompleted}
              className="rounded-full px-6 h-12 shadow-lg shadow-primary/20"
            >
              {isScanning ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  스캔 중...
                </div>
              ) : isAllCompleted ? (
                "모두 완료!"
              ) : (
                "QR 스캔하기"
              )}
            </Button>
          </div>
        </div>
        
        {/* Background Decorative Element */}
        <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
          <QrCode className="w-32 h-32" />
        </div>
      </Card>

      {/* Zones List */}
      <div className="grid gap-4">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          캠페인 구역 안내
        </h3>
        {zones.map((zone) => (
          <Card key={zone.id} className={`p-4 transition-all duration-300 ${zone.isCompleted ? "opacity-70 bg-secondary/30" : "hover:border-primary/50"}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${zone.isCompleted ? "bg-primary/20 text-primary" : "bg-secondary text-secondary-foreground"}`}>
                    {zone.isCompleted ? "방문 완료" : "미방문"}
                  </span>
                  <h4 className="font-bold">{zone.name}</h4>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {zone.location}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-sm font-black text-primary">+{zone.points}P</div>
                {zone.isCompleted && (
                  <div className="mt-1 animate-in zoom-in duration-300">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Bonus Reward Section */}
      <Card className={`p-6 border-2 border-dashed transition-all duration-500 ${isAllCompleted ? "border-primary bg-primary/5" : "border-muted-foreground/20 opacity-50"}`}>
        <div className="flex flex-col items-center text-center gap-3">
          <div className={`p-3 rounded-2xl ${isAllCompleted ? "bg-primary text-primary-foreground animate-bounce" : "bg-secondary text-muted-foreground"}`}>
            <Gift className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-lg">전체 완주 보너스</h3>
            <p className="text-sm text-muted-foreground">
              3개 구역의 스탬프를 모두 모으면<br />
              <span className="font-bold text-primary">500P</span>를 추가로 드립니다!
            </p>
          </div>
          {isAllCompleted ? (
            <Button 
              className="w-full bg-primary hover:bg-primary/90"
              onClick={() => {
                const bonusClaimed = localStorage.getItem("eco_campaign_bonus_claimed")
                if (bonusClaimed) {
                  toast.info("이미 보너스를 수령하셨습니다.")
                } else {
                  onGrantPoints(500, "현장 캠페인 전체 완주 보너스")
                  localStorage.setItem("eco_campaign_bonus_claimed", "true")
                  toast.success("완주 보너스 500P가 지급되었습니다! 🎉")
                }
              }}
            >
              보상 받기
            </Button>
          ) : (
            <div className="text-xs font-medium text-muted-foreground bg-secondary px-3 py-1 rounded-full">
              {completedCount} / {zones.length} 완료됨
            </div>
          )}
        </div>
      </Card>

      {/* Success Overlay */}
      {showSuccess && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setShowSuccess(null)}
        >
          <div 
            className="bg-card p-8 rounded-3xl border border-primary/30 shadow-2xl flex flex-col items-center text-center gap-4 max-w-xs animate-in zoom-in-95 duration-300"
          >
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-2">
              <Trophy className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h4 className="text-2xl font-black text-primary mb-1">STAMP!</h4>
              <p className="font-bold">{showSuccess}</p>
              <p className="text-sm text-muted-foreground mt-2">스탬프가 정상적으로 등록되었습니다.</p>
            </div>
            <Button className="w-full rounded-xl" onClick={() => setShowSuccess(null)}>확인</Button>
          </div>
        </div>
      )}
    </div>
  )
}
