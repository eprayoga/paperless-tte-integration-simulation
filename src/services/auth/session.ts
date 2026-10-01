import axios from "axios"

import { AUTH_API, ROUTES } from "@/constants/app"

let redirecting = false

/**
 * Called on any 401. The proxy has already cleared the cookie; we only need
 * to leave the protected area. Guarded so parallel 401s redirect once.
 */
export function handleUnauthorized() {
  if (typeof window === "undefined" || redirecting) return
  redirecting = true
  window.location.replace(`${ROUTES.login}?error=session_expired`)
}

export async function logout() {
  try {
    await axios.post(AUTH_API.logout)
  } finally {
    window.location.replace(ROUTES.login)
  }
}
