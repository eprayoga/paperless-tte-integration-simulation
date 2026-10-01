import axios from "axios"

import type { PaperlessErrorBody } from "@/types/paperless-api"

const STATUS_MESSAGES: Record<number, string> = {
  400: "Permintaan tidak valid. Periksa kembali data dokumen.",
  401: "Sesi Anda telah berakhir. Silakan login kembali.",
  403: "Anda tidak memiliki akses untuk melakukan aksi ini.",
  404: "Data tidak ditemukan.",
  413: "Ukuran file terlalu besar.",
  422: "Data tidak lolos validasi Paperless.",
  429: "Terlalu banyak permintaan. Coba lagi beberapa saat lagi.",
  500: "Terjadi kesalahan pada server Paperless.",
  502: "Server Paperless tidak dapat dihubungi.",
  503: "Layanan Paperless sedang tidak tersedia.",
  504: "Server Paperless tidak merespons tepat waktu.",
}

const NETWORK_MESSAGE = "Tidak dapat terhubung ke server. Periksa koneksi internet Anda."
const UNKNOWN_MESSAGE = "Terjadi kesalahan yang tidak terduga."

export class ApiError extends Error {
  readonly status: number
  readonly code?: number
  readonly type?: string
  readonly isNetworkError: boolean

  constructor(params: {
    message: string
    status: number
    code?: number
    type?: string
    isNetworkError?: boolean
  }) {
    super(params.message)
    this.name = "ApiError"
    this.status = params.status
    this.code = params.code
    this.type = params.type
    this.isNetworkError = params.isNetworkError ?? false
  }

  get isUnauthorized() {
    return this.status === 401
  }
}

/** Uses the API `message` when it is a short human sentence, never raw JSON. */
function pickApiMessage(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined
  const message = (body as PaperlessErrorBody).message
  if (typeof message !== "string") return undefined
  const trimmed = message.trim()
  if (!trimmed || trimmed.length > 240 || /^[[{]/.test(trimmed)) return undefined
  return trimmed
}

export function friendlyStatusMessage(status: number): string {
  if (STATUS_MESSAGES[status]) return STATUS_MESSAGES[status]
  if (status >= 500) return STATUS_MESSAGES[500]
  return UNKNOWN_MESSAGE
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (axios.isAxiosError(error)) {
    if (!error.response) {
      const timedOut = error.code === "ECONNABORTED" || error.code === "ETIMEDOUT"
      return new ApiError({
        message: timedOut ? STATUS_MESSAGES[504] : NETWORK_MESSAGE,
        status: 0,
        isNetworkError: true,
      })
    }
    const status = error.response.status
    const body = error.response.data as PaperlessErrorBody | undefined
    return new ApiError({
      message: pickApiMessage(body) ?? friendlyStatusMessage(status),
      status,
      code: body?.err?.data?.code,
      type: body?.err?.type,
    })
  }

  return new ApiError({ message: UNKNOWN_MESSAGE, status: 0 })
}

export function getErrorMessage(error: unknown): string {
  return toApiError(error).message
}
