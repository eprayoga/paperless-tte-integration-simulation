import "server-only"

import { z } from "zod"

const urlSchema = z
  .string()
  .trim()
  .url()
  .transform((value) => value.replace(/\/+$/, ""))

const serverEnvSchema = z.object({
  PAPERLESS_HOST_AUTH: urlSchema,
  PAPERLESS_HOST: urlSchema,
  PAPERLESS_ORIGIN: z.string().trim().min(1),
  PAPERLESS_REDIRECT_PAGE: z.string().trim().url(),
  PAPERLESS_LOGO: z.string().trim().optional().default(""),
  PAPERLESS_CUSTOMER_KEY: z.string().trim().min(1),
  PAPERLESS_SECRET_KEY: z.string().trim().min(1),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

let cached: ServerEnv | null = null

/**
 * Server-only configuration. None of these values are exposed to the browser
 * (no NEXT_PUBLIC_ prefix). Parsed lazily so `next build` works without a .env.
 */
export function getServerEnv(): ServerEnv {
  if (cached) return cached
  const parsed = serverEnvSchema.safeParse(process.env)
  if (!parsed.success) {
    const missing = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ")
    throw new Error(`Invalid or missing environment variables: ${missing}. See .env.example.`)
  }
  cached = parsed.data
  return cached
}
