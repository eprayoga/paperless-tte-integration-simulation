"use client"

import { ArrowClockwiseIcon, CoinsIcon, WarningCircleIcon } from "@phosphor-icons/react"
import { useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatBalance } from "@/lib/format"
import { useBalanceStore } from "@/stores/balance.store"

export function BalanceCard() {
  const balance = useBalanceStore((state) => state.balance)
  const status = useBalanceStore((state) => state.status)
  const error = useBalanceStore((state) => state.error)
  const fetchBalance = useBalanceStore((state) => state.fetchBalance)

  useEffect(() => {
    void fetchBalance()
  }, [fetchBalance])

  const isLoading = status === "loading" || status === "idle"

  return (
    <Card className="from-primary/10 to-card relative overflow-hidden bg-gradient-to-br">
      <CardHeader>
        <CardDescription className="flex items-center gap-2">
          <span className="bg-primary/15 text-primary flex size-8 items-center justify-center rounded-lg">
            <CoinsIcon className="size-5" />
          </span>
          Paperless Balance
        </CardDescription>

        {isLoading && balance === null ? (
          <div className="space-y-2 pt-1" aria-label="Loading balance...">
            <Skeleton className="h-9 w-32" />
            <p className="text-muted-foreground text-xs">Loading balance...</p>
          </div>
        ) : status === "error" && balance === null ? (
          <div className="text-destructive flex items-start gap-2 pt-1 text-sm">
            <WarningCircleIcon className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <CardTitle className="text-4xl font-semibold tabular-nums">
            {balance !== null ? formatBalance(balance) : "-"}
            <span className="text-muted-foreground ml-2 text-sm font-normal">kuota TTE</span>
          </CardTitle>
        )}

        <CardAction>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchBalance()}
            disabled={status === "loading"}
          >
            <ArrowClockwiseIcon className={status === "loading" ? "animate-spin" : undefined} />
            {status === "error" ? "Coba lagi" : "Refresh"}
          </Button>
        </CardAction>
      </CardHeader>
    </Card>
  )
}
