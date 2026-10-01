import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { AUTH_COOKIE_NAME, MAX_PDF_SIZE_BYTES } from "@/constants/app"
import { clearAuthCookie } from "@/lib/server/auth-cookie"
import { isAllowedPaperlessRoute } from "@/lib/server/paperless-routes"
import { callPaperless } from "@/lib/server/paperless-upstream"

/** Base64 inflates by 4/3; leave room for the rest of the JSON payload. */
const MAX_BODY_CHARS = Math.ceil((MAX_PDF_SIZE_BYTES * 4) / 3) + 512 * 1024

type Context = { params: Promise<{ path: string[] }> }

function errorResponse(status: number, message: string) {
  return NextResponse.json({ status, message }, { status })
}

function unauthorizedResponse(message = "Token Expired") {
  const response = errorResponse(401, message)
  clearAuthCookie(response)
  return response
}

async function handle(request: Request, context: Context, method: "GET" | "POST") {
  const { path } = await context.params

  if (!isAllowedPaperlessRoute(method, path)) {
    return errorResponse(404, "Endpoint tidak tersedia.")
  }

  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value
  if (!token) return unauthorizedResponse("Unauthorized")

  let body: string | undefined
  if (method === "POST") {
    body = await request.text()
    if (body.length > MAX_BODY_CHARS) return errorResponse(413, "Ukuran file terlalu besar.")
    try {
      const parsed: unknown = JSON.parse(body)
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error()
    } catch {
      return errorResponse(400, "Body request tidak valid.")
    }
  }

  try {
    const result = await callPaperless({ method, path: path.join("/"), token, body })

    if (result.unauthorized) {
      const message =
        result.body && typeof result.body === "object" && "message" in result.body
          ? String((result.body as { message: unknown }).message)
          : undefined
      return unauthorizedResponse(message)
    }
    if (result.body === null) {
      return errorResponse(502, "Respons Paperless tidak valid.")
    }
    return NextResponse.json(result.body, {
      status: result.status,
      headers: { "Cache-Control": "no-store" },
    })
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError"
    console.error("[paperless-proxy]", method, path.join("/"), error)
    return timedOut
      ? errorResponse(504, "Server Paperless tidak merespons tepat waktu.")
      : errorResponse(502, "Server Paperless tidak dapat dihubungi.")
  }
}

export function GET(request: Request, context: Context) {
  return handle(request, context, "GET")
}

export function POST(request: Request, context: Context) {
  return handle(request, context, "POST")
}
