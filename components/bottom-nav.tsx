"use client"

import { BarChart3, MessageCircle, Camera, Trophy, Trees, Droplets, Newspaper } from "lucide-react"

interface BottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const tabs = [
  { id: "analysis", label: "분석", icon: BarChart3 },
  { id: "water", label: "물", icon: Droplets },
  { id: "coaching", label: "코칭", icon: MessageCircle },
  { id: "certification", label: "인증", icon: Camera },
  { id: "ecoCity", label: "도시", icon: Trees },
  { id: "feed", label: "피드", icon: Newspaper },
  { id: "leaderboard", label: "랭킹", icon: Trophy },
]

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border pb-safe">
      <div className="flex items-center gap-2 h-20 max-w-md mx-auto px-4 overflow-x-auto">
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
