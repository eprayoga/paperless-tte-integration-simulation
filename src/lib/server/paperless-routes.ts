/**
 * Allowlist for the /api/paperless proxy. Only these upstream Paperless
 * endpoints can be reached through it; anything else is rejected with 404.
 */

export type AllowedMethod = "GET" | "POST"

type RouteRule = {
  method: AllowedMethod
  pattern: RegExp
}

const UUID = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"

const RULES: readonly RouteRule[] = [
  { method: "GET", pattern: /^integrated\/my\/balance$/ },
  { method: "POST", pattern: /^integrated\/sign\/mark\/self-signing\/async$/ },
  { method: "POST", pattern: /^integrated\/sign\/mark\/self-signing-v2$/ },
  { method: "POST", pattern: /^integrated\/sign\/mark\/self-signing-v2-custom$/ },
  {
    method: "GET",
    pattern: new RegExp(`^integrated/sign/mark/self-signing/async/status/${UUID}$`),
  },
]

export function isAllowedPaperlessRoute(method: string, segments: readonly string[]): boolean {
  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
    return false
  }
  const path = segments.join("/")
  return RULES.some((rule) => rule.method === method && rule.pattern.test(path))
}
