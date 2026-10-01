import { create } from "zustand"

import { logout } from "@/services/auth/session"

/**
 * The access token lives in an httpOnly cookie and is never readable from JS,
 * so this store only tracks UI state around the session. Reaching any page
 * under /documents already means the proxy saw a session cookie.
 */
type AuthState = {
  isAuthenticated: boolean
  isLoggingOut: boolean
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  isAuthenticated: true,
  isLoggingOut: false,

  logout: async () => {
    if (get().isLoggingOut) return
    set({ isLoggingOut: true })
    await logout()
    set({ isAuthenticated: false })
  },
}))
