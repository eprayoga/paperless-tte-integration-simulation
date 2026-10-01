import { create } from "zustand"

import { getErrorMessage, toApiError } from "@/lib/api-error"
import { paperlessService } from "@/services/paperless/paperless.service"

type BalanceStatus = "idle" | "loading" | "success" | "error"

type BalanceState = {
  balance: string | null
  status: BalanceStatus
  error: string | null
  fetchBalance: () => Promise<void>
}

export const useBalanceStore = create<BalanceState>()((set, get) => ({
  balance: null,
  status: "idle",
  error: null,

  fetchBalance: async () => {
    if (get().status === "loading") return
    set({ status: "loading", error: null })
    try {
      const balance = await paperlessService.getBalance()
      set({ balance, status: "success" })
    } catch (error) {
      // 401 is handled globally by the axios interceptor (redirect to /login).
      if (toApiError(error).isUnauthorized) return
      set({ status: "error", error: getErrorMessage(error) })
    }
  },
}))
