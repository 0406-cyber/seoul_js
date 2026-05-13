export type ShopItem = {
  id: string
  name: string
  description: string
  cost: number
  imageEmoji?: string
}

// MVP: 굿즈/상품 카탈로그 (실물 발송/수령은 운영 프로세스로 연결)
export const SHOP_ITEMS: ShopItem[] = [
  {
    id: "tumbler",
    name: "리유저블 텀블러",
    description: "일상에서 가장 많이 쓰는 굿즈. (색상 랜덤)",
    cost: 800,
    imageEmoji: "🥤",
  },
  {
    id: "sticker",
    name: "에코 스티커 팩",
    description: "노트북/텀블러에 붙이기 좋은 스티커 1세트",
    cost: 250,
    imageEmoji: "🏷️",
  },
  {
    id: "bag",
    name: "에코백",
    description: "장바구니 대신 쓰는 기본 에코백 1개",
    cost: 600,
    imageEmoji: "👜",
  },
  {
    id: "coffee",
    name: "커피 쿠폰(모바일)",
    description: "모바일 쿠폰 1매 (발송은 운영자 확인 후)",
    cost: 900,
    imageEmoji: "☕",
  },
]

