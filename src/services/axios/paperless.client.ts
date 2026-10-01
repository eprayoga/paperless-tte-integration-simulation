import axios from "axios"

import { PAPERLESS_PROXY_BASE } from "@/constants/app"
import { toApiError } from "@/lib/api-error"
import { handleUnauthorized } from "@/services/auth/session"

/**
 * Axios instance for Paperless. Requests go to the same-origin proxy, which adds
 * Authorization (from the httpOnly cookie), customer-key and secret-key.
 */
export const paperlessClient = axios.create({
  baseURL: PAPERLESS_PROXY_BASE,
  timeout: 120_000,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
})

paperlessClient.interceptors.request.use((config) => {
  config.headers.set("X-Requested-With", "XMLHttpRequest")
  return config
})

paperlessClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = toApiError(error)
    if (apiError.isUnauthorized) handleUnauthorized()
    return Promise.reject(apiError)
  },
)
