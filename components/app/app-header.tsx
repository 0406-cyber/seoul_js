"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"

type AppHeaderProps = {
  brand?: string
  title: string
  subtitle?: string
  theme: string | undefined
  onToggleTheme: () => void
  nickname: string | null
  points: number
  onOpenPoints: () => void
  onLogout: () => void
}

export function AppHeader({
  brand = "Enerview",
  title,
  subtitle,
  theme,
  onToggleTheme,
  nickname,
  points,
  onOpenPoints,
  onLogout,
}: AppHeaderProps) {
  return (
    <header className="sticky top-4 z-40 mx-4">
      <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto glass-card rounded-[2.5rem] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[1.25rem] bg-primary/20 flex items-center justify-center shadow-inner">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="28"
                height="28"
                viewBox="0 0 48 48"
                fill="none"
                className="text-primary"
              >
                <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="1.8" fill="none" opacity="0.3" />
                <path d="M6 32 C10 26 14 22 18 28 C20 24 24 18 28 24 C30 20 34 16 38 22 L42 32" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                <path d="M28 14 L20 24 L26 24 L22 36 L32 24 L26 24 Z" fill="currentColor" opacity="0.9" />
                <path d="M16 16 C18 12 22 10 24 14 C22 16 18 18 16 16Z" fill="currentColor" opacity="0.7" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-foreground tracking-tight">
                  {title}
                </h1>
                <span className="hidden sm:inline-flex text-[10px] font-black text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded-full">
                  {brand}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  {subtitle ?? "Eco system active"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={onToggleTheme}
              className="w-10 h-10 flex items-center justify-center bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl text-muted-foreground hover:text-foreground transition-all"
              title="테마 변경"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={onOpenPoints}
              className="flex items-center gap-2 md:gap-3 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl pl-2 pr-4 py-2 transition-all group"
              title="포인트 내역 보기"
            >
              <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center transition-transform group-hover:scale-110">
                <span className="text-sm font-black text-primary">
                  {(nickname?.charAt(0) ?? "나").toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-black text-foreground tracking-tight">
                {points.toLocaleString()}P
              </span>
            </button>

            <button
              onClick={onLogout}
              className="w-10 h-10 flex items-center justify-center bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
              title="로그아웃"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

