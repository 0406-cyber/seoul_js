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
    <div className="fixed bottom-6 left-0 right-0 z-50 px-4 flex justify-center pointer-events-none">
      <nav className="glass-card rounded-[2.5rem] px-2 py-2 flex items-center gap-1 shadow-[0_20px_50px_rgba(0,0,0,0.3)] pointer-events-auto border-white/20">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[90vw] sm:max-w-none">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  relative flex flex-col items-center justify-center min-w-[3.5rem] h-12 rounded-3xl transition-all duration-500
                  ${isActive 
                    ? "bg-primary text-primary-foreground shadow-[0_10px_20px_rgba(74,222,128,0.3)] scale-110 z-10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }
                `}
              >
                <Icon className={`w-5 h-5 transition-transform duration-500 ${isActive ? "scale-110" : ""}`} />
                {isActive && (
                   <span className="absolute -bottom-1 w-1 h-1 bg-primary-foreground rounded-full" />
                )}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
