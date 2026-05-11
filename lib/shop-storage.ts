"use client"

export type RedeemStatus = "requested" | "fulfilled" | "cancelled"

export type RedeemOrder = {
  id: string
  itemId: string
  itemName: string
  cost: number
  requestedAt: number
  status: RedeemStatus
}

const key = (username: string) => `eco_shop_orders_${username}`

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function loadOrders(username: string): RedeemOrder[] {
  if (typeof window === "undefined") return []
  const parsed = safeParse<RedeemOrder[]>(localStorage.getItem(key(username)))
  return Array.isArray(parsed) ? parsed : []
}

export function saveOrders(username: string, orders: RedeemOrder[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(key(username), JSON.stringify(orders))
}

export function addOrder(username: string, order: RedeemOrder) {
  const prev = loadOrders(username)
  const next = [order, ...prev].sort((a, b) => b.requestedAt - a.requestedAt)
  saveOrders(username, next)
  return next
}

