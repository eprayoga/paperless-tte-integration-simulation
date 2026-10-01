/**
 * Paperless endpoints, relative to {{host}}. Do not change these paths:
 * they are mirrored by the server-side allowlist in `lib/server/paperless-routes.ts`.
 */
export const PAPERLESS_ENDPOINTS = {
  balance: "/integrated/my/balance",
  signV1: "/integrated/sign/mark/self-signing/async",
  signV2: "/integrated/sign/mark/self-signing-v2",
  signV2Custom: "/integrated/sign/mark/self-signing-v2-custom",
  signStatus: (trxId: string) =>
    `/integrated/sign/mark/self-signing/async/status/${encodeURIComponent(trxId)}`,
} as const

export const TYPE_TTD = "signature" as const
