import { NextResponse } from "next/server"

import { PAPERLESS_ENDPOINTS } from "@/constants/paperless"
import { ROUTES } from "@/constants/app"
import { setAuthCookie } from "@/lib/server/auth-cookie"
import { callPaperless } from "@/lib/server/paperless-upstream"
import { isPlausibleToken } from "@/services/auth/oauth"

function redirectTo(request: Request, path: string) {
  // 303 + a fresh URL drops `?ttetoken=` from the address bar and history.
  const response = NextResponse.redirect(new URL(path, request.url), 303)
  response.headers.set("Cache-Control", "no-store")
  response.headers.set("Referrer-Policy", "no-referrer")
  return response
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("ttetoken")

  if (!isPlausibleToken(token)) {
    return redirectTo(request, `${ROUTES.login}?error=missing_token`)
  }

  try {
    const result = await callPaperless({
      method: "GET",
      path: PAPERLESS_ENDPOINTS.balance.slice(1),
      token,
    })

    if (result.unauthorized) {
      return redirectTo(request, `${ROUTES.login}?error=invalid_token`)
    }
    if (result.status >= 400) {
      return redirectTo(request, `${ROUTES.login}?error=validation_failed`)
    }
  } catch (error) {
    console.error("[auth/callback]", error)
    return redirectTo(request, `${ROUTES.login}?error=validation_failed`)
  }

  const response = redirectTo(request, ROUTES.documents)
  setAuthCookie(response, token)
  return response
}
