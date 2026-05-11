"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type AppContainerProps = {
  children: React.ReactNode
  className?: string
}

export function AppContainer({ children, className }: AppContainerProps) {
  return (
    <div className={cn("max-w-md md:max-w-2xl lg:max-w-4xl mx-auto px-4", className)}>
      {children}
    </div>
  )
}

