"use client"

import {
  CheckCircleIcon,
  ClockIcon,
  NotePencilIcon,
  XCircleIcon,
  type Icon,
} from "@phosphor-icons/react"

import { Badge } from "@/components/ui/badge"
import { SIGN_METHOD_LABELS, STATUS_LABELS } from "@/constants/document"
import { cn } from "@/lib/utils"
import type { DocumentStatus, SignMethod } from "@/types/document"

const STATUS_STYLES: Record<DocumentStatus, { className: string; icon: Icon }> = {
  draft: {
    className: "bg-muted text-muted-foreground border-border",
    icon: NotePencilIcon,
  },
  pending: {
    className:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
    icon: ClockIcon,
  },
  success: {
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
    icon: CheckCircleIcon,
  },
  failed: {
    className:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900",
    icon: XCircleIcon,
  },
}

export function StatusBadge({ status }: { status: DocumentStatus }) {
  const { className, icon: StatusIcon } = STATUS_STYLES[status]
  return (
    <Badge variant="outline" className={cn("gap-1", className)}>
      <StatusIcon />
      {STATUS_LABELS[status]}
    </Badge>
  )
}

export function SignMethodBadge({ method }: { method?: SignMethod }) {
  if (!method) return <span className="text-muted-foreground text-sm">-</span>
  return (
    <Badge variant="secondary" className="font-medium">
      {SIGN_METHOD_LABELS[method]}
    </Badge>
  )
}
