import { NextResponse } from "next/server"

import { buildAuthorizeUrl } from "@/services/auth/oauth"

/** Builds the Paperless OAuth URL server-side so no key is shipped in the JS bundle. */
export function GET(request: Request) {
  try {
    return NextResponse.redirect(buildAuthorizeUrl(), 302)
  } catch (error) {
    console.error("[auth/login]", error)
    return NextResponse.redirect(new URL("/login?error=config", request.url), 303)
  }
}
