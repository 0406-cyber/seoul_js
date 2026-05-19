export type ShopItem = {
  id: string
  name: string
  description: string
  cost: number
  imageEmoji?: string
}

// MVP: 굿즈/상품 카탈로그 수정필요
export const SHOP_ITEMS: ShopItem[] = [
  {
    id: "tumbler",
    name: "item1",
    description: "description1",
    cost: 800,
    imageEmoji: "🥤",
  },
  {
    id: "sticker",
    name: "item2",
    description: "description2",
    cost: 250,
    imageEmoji: "🏷️",
  },
  {
    id: "bag",
    name: "item3",
    description: "description3",
    cost: 600,
    imageEmoji: "👜",
  },
  {
    id: "coffee",
    name: "item4",
    description: "description4",
    cost: 900,
    imageEmoji: "☕",
  },
]

