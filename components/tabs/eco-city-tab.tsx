"use client"

import React, { useEffect, useMemo, useState } from "react"
import {
  Building,
  Zap,
  Droplets,
  Lightbulb,
  BarChart3,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react"
import { toast } from "sonner"
import { SHOP_ITEMS } from "@/lib/shop"
import { addOrder, loadOrders, type RedeemOrder } from "@/lib/shop-storage"

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}

type Stage = {
  id: number
  minPoints: number
  label: string
  subtitle: string
  Icon: React.ElementType
}

const STAGES: Stage[] = [
  {
    id: 0,
    minPoints: 0,
    label: "에너지 낭비 도심",
    subtitle: "노후화된 인프라 - 에너지 손실률 높음",
    Icon: Lightbulb,
  },
  {
    id: 1,
    minPoints: 200,
    label: "스마트 빌딩 리모델링",
    subtitle: "스마트 조명 및 고효율 창호 도입",
    Icon: Building,
  },
  {
    id: 2,
    minPoints: 600,
    label: "수자원/조명 인프라 연계",
    subtitle: "자원 순환 활성화 및 인프라 최적화",
    Icon: Droplets,
  },
  {
    id: 3,
    minPoints: 1200,
    label: "AI 마이크로그리드 완성",
    subtitle: "신재생 에너지 자급자족 - 제로 에너지 시티",
    Icon: Zap,
  },
]

export function EcoCityTab({
  nickname,
  points,
  onSpendPoints,
}: {
  nickname: string
  points: number
  onSpendPoints: (cost: number, reason: string) => Promise<void> | void
}) {
  const stage = useMemo(() => {
    const sorted = [...STAGES].sort((a, b) => a.minPoints - b.minPoints)
    let cur = sorted[0]
    for (const s of sorted) if (points >= s.minPoints) cur = s
    const next = sorted.find((s) => s.minPoints > cur.minPoints) ?? null
    return { cur, next }
  }, [points])

  const progress = useMemo(() => {
    const curMin = stage.cur.minPoints
    const nextMin = stage.next?.minPoints ?? stage.cur.minPoints + 1
    return clamp01((points - curMin) / (nextMin - curMin))
  }, [points, stage.cur.minPoints, stage.next?.minPoints])

  const CurrentIcon = stage.cur.Icon
  const nextNeed = Math.max(0, (stage.next?.minPoints ?? points) - points)
  const progressPct = Math.round(progress * 100)
  const progressWidth = `${Math.round(progress * 100)}%`

  const tone =
    stage.cur.id === 0
      ? { label: "Baseline", accent: "bg-primary/15", ink: "text-primary" }
      : stage.cur.id === 1
        ? { label: "Smart", accent: "bg-cyan-500/10", ink: "text-cyan-400" }
        : stage.cur.id === 2
          ? { label: "Integrated", accent: "bg-blue-500/10", ink: "text-blue-400" }
          : { label: "Microgrid", accent: "bg-indigo-500/10", ink: "text-indigo-300" }

  const perks = useMemo(() => {
    const list: { title: string; desc: string; Icon: React.ElementType }[] = []
    if (stage.cur.id >= 1) list.push({ title: "스마트 조명/창호", desc: "낭비 구간을 줄이는 기본 효율 개선", Icon: Building })
    if (stage.cur.id >= 2) list.push({ title: "자원 연계 최적화", desc: "수자원·조명 인프라를 함께 튜닝", Icon: Droplets })
    if (stage.cur.id >= 3) list.push({ title: "AI 마이크로그리드", desc: "신재생 기반 자급자족에 가까워져요", Icon: Zap })
    if (list.length === 0) list.push({ title: "진단 단계", desc: "현재 사용 패턴을 파악하고 목표를 세워요", Icon: Lightbulb })
    return list.slice(0, 3)
  }, [stage.cur.id])

  const [orders, setOrders] = useState<RedeemOrder[]>([])
  useEffect(() => {
    setOrders(loadOrders(nickname))
  }, [nickname])

  return (
    <div className="space-y-6 pb-28">
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-card rounded-3xl p-4 border border-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-primary/15 flex items-center justify-center">
              <CurrentIcon className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">현재 단계</p>
              <p className="text-lg font-black text-foreground truncate">LV.{stage.cur.id}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-3xl p-4 border border-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">진행률</p>
              <p className="text-lg font-black text-foreground truncate">{progressPct}%</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-3xl p-4 border border-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-orange-500/10 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-orange-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">다음 단계까지</p>
              <p className="text-lg font-black text-foreground truncate">
                {stage.next ? `${nextNeed.toLocaleString()}P` : "MAX"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-3xl p-4 border border-border">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-secondary flex items-center justify-center">
              <Zap className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">내 포인트</p>
              <p className="text-lg font-black text-foreground truncate">
                {points.toLocaleString()}P
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 상태 헤더 카드 */}
      <div className="glass-card rounded-[2.5rem] p-8 border border-border shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-bold text-primary tracking-widest uppercase">Smart Infra Status</p>
            <h3 className="text-xl font-black text-foreground truncate mt-1">
              {stage.cur.label}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{stage.cur.subtitle}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {nickname}님의 실천 포인트로 도시 인프라가 성장합니다.
            </p>
          </div>
          <div className={`w-12 h-12 rounded-2xl ${tone.accent} flex items-center justify-center border border-border`}>
            <CurrentIcon className={`w-6 h-6 ${tone.ink}`} />
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium mb-2">
            <span className="uppercase tracking-wider">Energy Points</span>
            <span className="text-foreground font-bold text-sm">{points.toLocaleString()} <span className="text-primary">P</span></span>
          </div>
          <div className="h-2.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden border border-black/10 dark:border-white/10">
            <div className="h-full bg-primary transition-all duration-700" style={{ width: progressWidth }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <span>LV.{stage.cur.id} ({stage.cur.minPoints}P)</span>
            <span>
              {stage.next ? `NEXT: LV.${stage.next.id} (${stage.next.minPoints}P)` : "MAX LEVEL"}
            </span>
          </div>
        </div>
      </div>

      {/* City visualization (clean) */}
      <div className="glass-card rounded-[2.5rem] border border-border overflow-hidden shadow-sm">
        <div className="relative h-80 bg-[radial-gradient(circle_at_30%_20%,rgba(74,222,128,0.14),transparent_55%),radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.10),transparent_50%),linear-gradient(to_bottom,rgba(2,6,23,0.08),transparent_60%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(74,222,128,0.16),transparent_55%),radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.14),transparent_50%),linear-gradient(to_bottom,rgba(2,6,23,0.75),rgba(2,6,23,0.25))]">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_80%,rgba(255,255,255,0.10),transparent_55%)] dark:bg-[radial-gradient(circle_at_50%_80%,rgba(255,255,255,0.06),transparent_55%)]" />
          </div>

          <div className="absolute top-6 left-6 right-6 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                City progress · {tone.label}
              </p>
              <p className="text-lg font-black text-foreground mt-1 truncate">
                {stage.cur.label}
              </p>
              <p className="text-sm text-muted-foreground mt-1 truncate">
                {stage.next
                  ? `다음 단계까지 ${nextNeed.toLocaleString()}P`
                  : "최종 단계에 도달했어요"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
                {progressPct}%
              </span>
            </div>
          </div>

          {/* skyline */}
          <div className="absolute inset-x-0 bottom-0 h-44">
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 dark:from-black/60 via-transparent to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 px-6 pb-6">
              <div className="flex items-end justify-between gap-3">
                {[
                  52, 78, 60, 92, 66, 84, 58, 70,
                ].map((h, i) => {
                  const boost = stage.cur.id * 6 + Math.round(progress * 10)
                  const height = Math.min(108, h + boost)
                  const lit = stage.cur.id >= 1 && (i % 2 === 0 || stage.cur.id >= 2)
                  return (
                    <div
                      key={i}
                      className="relative flex-1 rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 overflow-hidden"
                      style={{ height }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 dark:from-black/40 to-transparent" />
                      {lit && (
                        <div className="absolute inset-x-3 top-4 bottom-4 bg-[linear-gradient(180deg,transparent_48%,rgba(74,222,128,0.18)_50%)] bg-[length:100%_10px] opacity-70" />
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="mt-4 h-2.5 w-full rounded-full overflow-hidden border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
                <div className="h-full bg-primary transition-all duration-700" style={{ width: progressWidth }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What changed / next unlock */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="glass-morphism rounded-[2.5rem] p-8 border border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Now active
              </p>
              <h4 className="text-xl font-black text-foreground mt-1">현재 적용되는 개선</h4>
              <p className="text-sm text-muted-foreground mt-2">
                단계가 올라갈수록 “도시 운영 효율”이 높아지는 컨셉이에요. 과한 그림 대신 핵심만 보여줍니다.
              </p>
            </div>
            <div className="w-12 h-12 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3">
            {perks.map((p) => (
              <div
                key={p.title}
                className="flex items-start gap-3 rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-5 py-4"
              >
                <div className={`w-10 h-10 rounded-2xl ${tone.accent} flex items-center justify-center`}>
                  <p.Icon className={`w-5 h-5 ${tone.ink}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-foreground">{p.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-[2.5rem] p-8 border border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Next
              </p>
              <h4 className="text-xl font-black text-foreground mt-1">다음 단계 안내</h4>
              <p className="text-sm text-muted-foreground mt-2">
                {stage.next
                  ? `다음 단계(${stage.next.label})까지 ${nextNeed.toLocaleString()}P 남았어요.`
                  : "최종 단계입니다. 꾸준히 기록하며 유지해보세요."}
              </p>
            </div>
            <div className="w-12 h-12 rounded-3xl bg-secondary border border-border flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-muted-foreground" />
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-5 py-4">
            <p className="text-sm font-black text-foreground">추천 액션</p>
            <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
              <li>- “탄소 분석”에서 데이터를 꾸준히 기록하기</li>
              <li>- “친환경 인증”으로 실천을 인증해 포인트 쌓기</li>
              <li>- “시민 기자단”에서 꿀팁 공유로 주간 보상 노리기</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Point shop (goods) */}
      <div className="glass-card rounded-[2.5rem] p-8 border border-border">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Point shop
            </p>
            <h4 className="text-xl font-black text-foreground mt-1">굿즈/상품 교환</h4>
            <p className="text-sm text-muted-foreground mt-2">
              포인트로 교환 요청을 남기면 운영자가 확인 후 지급/발송합니다. (MVP)
            </p>
          </div>
          <div className="w-12 h-12 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-primary" />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          {SHOP_ITEMS.map((it) => (
            <div
              key={it.id}
              className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-5 py-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-black text-foreground">
                    <span className="mr-2">{it.imageEmoji ?? "🎁"}</span>
                    {it.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{it.description}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black text-foreground">{it.cost}P</p>
                  <p className="text-[10px] text-muted-foreground">교환가</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  보유: <span className="font-black text-foreground">{points.toLocaleString()}P</span>
                </p>
                <button
                  onClick={() => {
                    if (points < it.cost) {
                      toast.error("포인트가 부족합니다.")
                      return
                    }

                    const order: RedeemOrder = {
                      id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
                      itemId: it.id,
                      itemName: it.name,
                      cost: it.cost,
                      requestedAt: Date.now(),
                      status: "requested",
                    }

                    Promise.resolve(
                      onSpendPoints(it.cost, `굿즈 교환 요청: ${it.name}`)
                    )
                      .then(() => {
                        const next = addOrder(nickname, order)
                        setOrders(next)
                        toast.success("교환 요청이 접수되었습니다.")
                      })
                      .catch((e: any) => {
                        toast.error(e?.message ?? "교환 요청 처리 중 오류가 발생했습니다.")
                      })
                  }}
                  className="px-4 py-2 rounded-2xl bg-secondary text-secondary-foreground font-black hover:bg-secondary/80 transition"
                >
                  교환 요청
                </button>
              </div>
            </div>
          ))}
        </div>

        <ShopHistory orders={orders} />
      </div>
    </div>
  )
}

function ShopHistory({ orders }: { orders: RedeemOrder[] }) {
  if (orders.length === 0) return null

  return (
    <div className="mt-6 rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-5 py-4">
      <p className="text-sm font-black text-foreground">교환 요청 내역</p>
      <div className="mt-3 space-y-2">
        {orders.slice(0, 5).map((o) => (
          <div key={o.id} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{o.itemName}</p>
              <p className="text-[10px] text-muted-foreground">
                {new Date(o.requestedAt).toLocaleString("ko-KR")} · {o.status}
              </p>
            </div>
            <span className="text-xs font-black text-muted-foreground">{o.cost}P</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[10px] text-muted-foreground">
        * MVP에서는 로컬에만 저장됩니다. 운영 연동(구글시트/DB) 붙이면 실물 지급 프로세스로 확장 가능해요.
      </p>
    </div>
  )
}
