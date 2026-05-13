"use client"

import { TAB_META } from "@/lib/tab-meta"

interface BottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 px-4 flex justify-center pointer-events-none">
      <nav className="glass-card rounded-[2.5rem] px-2 py-2 flex items-center gap-1 pointer-events-auto">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[90vw] sm:max-w-none">
          {TAB_META.map((tab) => {
            const Icon = tab.Icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  relative flex flex-col items-center justify-center min-w-[3.8rem] h-14 rounded-3xl transition-all duration-500 px-2
                  ${isActive 
                    ? "bg-primary text-primary-foreground shadow-[0_10px_20px_rgba(74,222,128,0.3)] scale-110 z-10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                  }
                `}
                aria-current={isActive ? "page" : undefined}
                title={tab.title}
              >
                <Icon className={`w-5 h-5 transition-transform duration-500 ${isActive ? "scale-110" : ""}`} />
                <span
                  className={`mt-1 text-[10px] font-black tracking-tight ${
                    isActive ? "text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {tab.navLabel}
                </span>
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
