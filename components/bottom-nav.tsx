"use client"

import { BarChart3, MessageCircle, Camera, Trophy, Trees, Droplets, Newspaper } from "lucide-react"

interface BottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const tabs = [
  { id: "analysis", label: "분석", icon: BarChart3 },
  { id: "water", label: "물", icon: Droplets },
  { id: "coaching", label: "AI", icon: MessageCircle },
  { id: "certification", label: "인증", icon: Camera },
  { id: "ecoCity", label: "도시", icon: Trees },
  { id: "feed", label: "피드", icon: Newspaper },
  { id: "leaderboard", label: "랭킹", icon: Trophy },
]

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border pb-safe">
      {/* 👇 넓은 화면(md, lg)을 위한 반응형 넓이와 가운데 정렬(sm:justify-center, sm:gap-6)이 추가되었습니다. */}
      <div className="flex items-center sm:justify-center gap-2 sm:gap-6 h-20 max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-3xl transition-all duration-300 flex-shrink-0
                ${isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground"
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
