import { NextResponse } from "next/server"

import { clearAuthCookie } from "@/lib/server/auth-cookie"

export function POST() {
  const response = NextResponse.json({ ok: true })
  clearAuthCookie(response)
  return response
}
