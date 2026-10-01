"use client"

import { IconContext } from "@phosphor-icons/react"
import type { ReactNode } from "react"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

const iconDefaults = { weight: "duotone" } as const

export function Providers({ children }: { children: ReactNode }) {
  return (
    <IconContext.Provider value={iconDefaults}>
      <TooltipProvider delayDuration={200}>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </TooltipProvider>
    </IconContext.Provider>
  )
}
