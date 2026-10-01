export const APP_NAME = "Paperless TTE Demo"

export const STORAGE_KEYS = {
  documents: "paperless-demo-documents",
  templates: "paperless-demo-templates",
} as const

/** httpOnly cookie that carries the Paperless access token (ttetoken). */
export const AUTH_COOKIE_NAME = "paperless_demo_token"
export const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12

export const ROUTES = {
  login: "/login",
  documents: "/documents",
  createDocument: "/documents/create",
  documentDetail: (id: string) => `/documents/${id}`,
  editDocument: (id: string) => `/documents/${id}/edit`,
  documentTemplate: (id: string) => `/documents/${id}/template`,
  signPreview: (id: string) => `/documents/${id}/sign-preview`,
} as const

export const AUTH_API = {
  login: "/api/auth/login",
  callback: "/api/auth/callback",
  logout: "/api/auth/logout",
} as const

/** Same-origin proxy that injects customer-key and secret-key server-side. */
export const PAPERLESS_PROXY_BASE = "/api/paperless"

export const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024
