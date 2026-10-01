import "server-only"

import { getServerEnv } from "@/lib/server/env"

/**
 * {{host_auth}}/login/oauth/authorize?origin=..&redirect=..&logo=..&customer_key=..
 */
export function buildAuthorizeUrl(): string {
  const env = getServerEnv()
  const url = new URL(`${env.PAPERLESS_HOST_AUTH}/login/oauth/authorize`)
  url.searchParams.set("origin", env.PAPERLESS_ORIGIN)
  url.searchParams.set("redirect", env.PAPERLESS_REDIRECT_PAGE)
  url.searchParams.set("logo", env.PAPERLESS_LOGO)
  url.searchParams.set("customer_key", env.PAPERLESS_CUSTOMER_KEY)
  return url.toString()
}

/** Rough shape check before the token is used anywhere. */
export function isPlausibleToken(token: string | null): token is string {
  return !!token && token.length >= 8 && token.length <= 4096 && !/\s/.test(token)
}
