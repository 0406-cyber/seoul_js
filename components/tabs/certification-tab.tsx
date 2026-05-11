"use client"

import { useMemo, useState, useRef } from "react"
import { Camera, ImagePlus, Sparkles, X, Check, Gift, CalendarDays, BarChart3 } from "lucide-react"
import Image from "next/image"

interface CertificationTabProps {
  selectedImage: string | null
  onImageSelect: (imageUrl: string | null) => void
  onCertify: () => Promise<{ ok: boolean; earnedPoints?: number; error?: string }>
  points: number
  certificationHistory: { id: string; date: string; type: string; points: number }[]
}

export function CertificationTab({
  selectedImage,
  onImageSelect,
  onCertify,
  points,
  certificationHistory,
}: CertificationTabProps) {
  const [isCertifying, setIsCertifying] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [earnedPoints, setEarnedPoints] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const stats = useMemo(() => {
    const count = certificationHistory.length
    const totalEarned = certificationHistory.reduce((acc, c) => acc + (c.points || 0), 0)
    const last = certificationHistory[0] ?? null
    return { count, totalEarned, last }
  }, [certificationHistory])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        onImageSelect(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCertify = async () => {
    if (!selectedImage) return

    setIsCertifying(true)
    try {
      const result = await onCertify()
      if (result.ok && result.earnedPoints != null) {
        setEarnedPoints(result.earnedPoints)
        setShowSuccess(true)
        setTimeout(() => {
          setShowSuccess(false)
          onImageSelect(null)
        }, 3000)
      }
    } finally {
      setIsCertifying(false)
    }
  }

  return (
    <div className="space-y-6 pb-28">
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-card rounded-3xl p-4 border border-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-primary/15 flex items-center justify-center">
              <Gift className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">누적 포인트</p>
              <p className="text-lg font-black text-foreground truncate">
                {points.toLocaleString()}P
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-3xl p-4 border border-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-blue-500/10 flex items-center justify-center">
              <Camera className="w-4 h-4 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">인증 횟수</p>
              <p className="text-lg font-black text-foreground truncate">
                {stats.count.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-3xl p-4 border border-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-orange-500/10 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-orange-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">누적 획득</p>
              <p className="text-lg font-black text-foreground truncate">
                +{stats.totalEarned.toLocaleString()}P
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-3xl p-4 border border-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-secondary flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">최근 인증</p>
              <p className="text-lg font-black text-foreground truncate">
                {stats.last ? stats.last.date : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Upload / action */}
        <div className="glass-morphism rounded-[2.5rem] p-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                Eco Certification
              </p>
              <h3 className="text-xl font-bold text-foreground">친환경 활동 인증</h3>
            </div>
            <div className="w-12 h-12 rounded-3xl bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
          </div>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          className="hidden"
        />

        {!selectedImage ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-square max-h-80 bg-black/5 dark:bg-white/5 rounded-3xl border-2 border-dashed border-black/10 dark:border-white/10 flex flex-col items-center justify-center gap-4 transition-all hover:border-primary/50 hover:bg-black/10 dark:hover:bg-white/10"
          >
            <div className="w-16 h-16 rounded-3xl bg-primary/20 flex items-center justify-center">
              <ImagePlus className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-foreground font-medium">사진을 선택하세요</p>
              <p className="text-sm text-muted-foreground mt-1">대중교통, 분리수거, 텀블러 사용 등</p>
            </div>
          </button>
        ) : (
          <div className="relative">
            <div className="aspect-square max-h-80 rounded-3xl overflow-hidden bg-secondary">
              <Image
                src={selectedImage}
                alt="Selected"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <button
              onClick={() => onImageSelect(null)}
              className="absolute top-3 right-3 w-10 h-10 rounded-2xl bg-background/80 backdrop-blur flex items-center justify-center transition-all hover:bg-background"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
          </div>
        )}

        {/* Certify Button */}
        <button
          onClick={handleCertify}
          disabled={!selectedImage || isCertifying}
          className="w-full bg-primary text-primary-foreground rounded-2xl py-5 text-lg font-black transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100 flex items-center justify-center gap-2 shadow-[0_20px_50px_rgba(74,222,128,0.25)]"
        >
          {isCertifying ? (
            <>
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              AI 인증 중...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              AI 인증하기
            </>
          )}
        </button>
        </div>

        {/* History */}
        <div className="glass-card rounded-[2.5rem] p-8 border border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-foreground">인증 내역</h3>
            <span className="text-xs font-bold text-muted-foreground bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 px-2 py-1 rounded-full">
              최근 {stats.count}회
            </span>
          </div>
          <div className="space-y-3">
          {certificationHistory.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              아직 인증 내역이 없습니다
            </p>
          ) : (
            certificationHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl px-5 py-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.type}</p>
                    <p className="text-xs text-muted-foreground">{item.date}</p>
                  </div>
                </div>
                <span className="text-primary font-semibold">+{item.points}P</span>
              </div>
            ))
          )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 px-6">
          <div className="bg-card rounded-3xl p-8 border border-border text-center max-w-sm w-full animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">인증 완료!</h3>
            <p className="text-muted-foreground mb-6">친환경 활동이 인증되었습니다</p>
            <div className="bg-secondary rounded-2xl p-4">
              <span className="text-sm text-muted-foreground">획득 포인트</span>
              <p className="text-3xl font-bold text-primary">+{earnedPoints}P</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
