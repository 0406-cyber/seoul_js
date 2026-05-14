"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type AppShellProps = {
  children: React.ReactNode
  className?: string
}

export function AppShell({ children, className }: AppShellProps) {
  return (
    <main
      className={cn(
        "min-h-screen bg-background relative selection:bg-primary/30 transition-colors duration-300",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-24 left-6 h-[360px] w-[360px] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute top-24 right-6 h-[280px] w-[280px] rounded-full bg-fuchsia-400/10 blur-3xl" />
      </div>

      {children}
    </main>
  )
}

