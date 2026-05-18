"use client"

import { useEffect, useState } from "react"
import { ShoppingBag, Package, Clock, CheckCircle, XCircle, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { SHOP_ITEMS } from "@/lib/shop"
import { addOrder, loadOrders, type RedeemOrder } from "@/lib/shop-storage"
import { saveOrder } from "@/lib/db"

export function ShopTab({
  nickname,
  points,
  onSpendPoints,
}: {
  nickname: string
  points: number
  onSpendPoints: (cost: number, reason: string) => Promise<void> | void
}) {
  const [orders, setOrders] = useState<RedeemOrder[]>([])

  useEffect(() => {
    setOrders(loadOrders(nickname))
  }, [nickname])

  const statusIcon = (status: RedeemOrder["status"]) => {
    switch (status) {
      case "requested": return <Clock className="w-3.5 h-3.5 text-yellow-500" />
      case "fulfilled": return <CheckCircle className="w-3.5 h-3.5 text-green-500" />
      case "cancelled": return <XCircle className="w-3.5 h-3.5 text-red-500" />
    }
  }

  const statusLabel = (status: RedeemOrder["status"]) => {
    switch (status) {
      case "requested": return "요청"
      case "fulfilled": return "완료"
      case "cancelled": return "취소"
    }
  }

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div className="glass-card rounded-[2.5rem] p-8 border border-border">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-bold text-primary tracking-widest uppercase">Point Shop</p>
            <h3 className="text-xl font-black text-foreground mt-1">굿즈/상품 교환</h3>
            <p className="text-sm text-muted-foreground mt-2">
              포인트로 교환 요청을 남기면 운영자가 확인 후 지급/발송합니다.
            </p>
          </div>
          <div className="w-12 h-12 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-primary" />
          </div>
        </div>

        {/* 포인트 요약 */}
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-5 py-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">보유 포인트</p>
            <p className="text-lg font-black text-foreground">{points.toLocaleString()}P</p>
          </div>
        </div>
      </div>

      {/* 상품 목록 */}
      <div className="glass-card rounded-[2.5rem] p-8 border border-border">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="min-w-0">
            <h4 className="text-lg font-black text-foreground">교환 가능 상품</h4>
            <p className="text-sm text-muted-foreground mt-1">
              원하는 상품의 교환 요청 버튼을 눌러주세요.
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-secondary border border-border flex items-center justify-center">
            <Package className="w-5 h-5 text-muted-foreground" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SHOP_ITEMS.map((it) => (
            <div
              key={it.id}
              className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-5 py-4 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-2xl">{it.imageEmoji ?? "🎁"}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-foreground">{it.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{it.description}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black text-primary">{it.cost}P</p>
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
                      .then(async () => {
                        const next = addOrder(nickname, order)
                        setOrders(next)
                        try {
                          await saveOrder(nickname, order)
                        } catch (e) {
                          console.error("주문 서버 저장 실패:", e)
                        }
                        toast.success("교환 요청이 접수되었습니다.")
                      })
                      .catch((e: any) => {
                        toast.error(e?.message ?? "교환 요청 처리 중 오류가 발생했습니다.")
                      })
                  }}
                  disabled={points < it.cost}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-black text-xs hover:bg-primary/90 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {points < it.cost ? "포인트 부족" : "교환 요청"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 교환 요청 내역 */}
      {orders.length > 0 && (
        <div className="glass-card rounded-[2.5rem] p-8 border border-border">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="min-w-0">
              <h4 className="text-lg font-black text-foreground">교환 요청 내역</h4>
              <p className="text-sm text-muted-foreground mt-1">
                최근 {Math.min(orders.length, 10)}건의 요청 내역입니다.
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-secondary border border-border flex items-center justify-center">
              <Clock className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            {orders.slice(0, 10).map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {statusIcon(o.status)}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{o.itemName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(o.requestedAt).toLocaleString("ko-KR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-black text-muted-foreground">{o.cost}P</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    o.status === "fulfilled" ? "bg-green-500/10 text-green-500" :
                    o.status === "cancelled" ? "bg-red-500/10 text-red-500" :
                    "bg-yellow-500/10 text-yellow-500"
                  }`}>
                    {statusLabel(o.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-[10px] text-muted-foreground">
            * MVP에서는 로컬에만 저장됩니다. 운영 연동(구글시트/DB) 붙이면 실물 지급 프로세스로 확장 가능해요.
          </p>
        </div>
      )}
    </div>
  )
}