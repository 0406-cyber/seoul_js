"use client"

import { TAB_META, MAIN_TAB_IDS } from "@/lib/tab-meta"
import { MoreTabsSheet, getSubTabs } from "@/components/more-tabs-sheet"
import { Ellipsis } from "lucide-react"

interface BottomNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const mainTabs = TAB_META.filter((tab) => MAIN_TAB_IDS.includes(tab.id))

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 px-4 flex justify-center pointer-events-none">
      <nav className="glass-card rounded-[2.5rem] px-2 py-2 flex items-center gap-1 pointer-events-auto shadow-xl">
        <div className="flex items-center gap-1">
          {mainTabs.map((tab) => {
            const Icon = tab.Icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  relative flex flex-col items-center justify-center min-w-[4rem] h-14 rounded-3xl transition-all duration-500 px-2
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
              </button>
            )
          })}

          {/* 더보기 버튼 */}
          <MoreTabsSheet activeTab={activeTab} onTabChange={onTabChange}>
            <button
              className={`
                relative flex flex-col items-center justify-center min-w-[4rem] h-14 rounded-3xl transition-all duration-500 px-2
                ${getSubTabs().some((t) => t.id === activeTab)
                  ? "bg-primary text-primary-foreground shadow-[0_10px_20px_rgba(74,222,128,0.3)] scale-110 z-10"
                  : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                }
              `}
              title="더보기"
            >
              <Ellipsis className="w-5 h-5" />
              <span className="mt-1 text-[10px] font-black tracking-tight text-muted-foreground">더보기</span>
            </button>
          </MoreTabsSheet>
        </div>
      </nav>
    </div>
  )
}