"use client"

import * as React from "react"
import { X } from "lucide-react"

export type PointHistoryItem = {
  id: string
  date: string
  description: string
  amount: number
}

type PointHistoryModalProps = {
  open: boolean
  onClose: () => void
  items: PointHistoryItem[]
}

export function PointHistoryModal({
  open,
  onClose,
  items,
}: PointHistoryModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-card w-full max-w-sm rounded-3xl shadow-xl flex flex-col max-h-[80vh] border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-border bg-background">
          <h2 className="text-lg font-bold text-foreground">포인트 내역</h2>
          <button
            onClick={onClose}
            className="p-2 bg-secondary/50 hover:bg-secondary rounded-full transition-colors text-muted-foreground"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3 bg-background">
          {items.length === 0 ? (
            <div className="text-center text-muted-foreground py-10 flex flex-col items-center gap-2">
              <span className="text-3xl">🫙</span>
              <p>아직 적립된 포인트가 없습니다.</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-foreground">
                    {item.description}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.date}
                  </span>
                </div>
                <span
                  className={`font-bold text-lg ${
                    item.amount > 0 ? "text-primary" : "text-red-500"
                  }`}
                >
                  {item.amount > 0 ? "+" : ""}
                  {item.amount}P
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

