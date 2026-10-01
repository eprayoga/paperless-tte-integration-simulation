import { NextResponse, type NextRequest } from "next/server"

import { AUTH_COOKIE_NAME, ROUTES } from "@/constants/app"

/**
 * Route guard (Next 16 "proxy", formerly middleware). It only checks that the
 * session cookie exists; Paperless validates the token itself and any 401
 * clears the cookie through /api/paperless.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasSession = Boolean(request.cookies.get(AUTH_COOKIE_NAME)?.value)

  if (pathname === "/") {
    return NextResponse.redirect(new URL(hasSession ? ROUTES.documents : ROUTES.login, request.url))
  }

  if (pathname === ROUTES.login) {
    return hasSession
      ? NextResponse.redirect(new URL(ROUTES.documents, request.url))
      : NextResponse.next()
  }

  if (!hasSession) {
    return NextResponse.redirect(new URL(ROUTES.login, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/", "/login", "/documents/:path*"],
}
