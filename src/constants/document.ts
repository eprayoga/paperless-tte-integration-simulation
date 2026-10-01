import type { DocumentStatus, SignMethod } from "@/types/document"

export const STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: "Draft",
  pending: "Pending",
  success: "Success",
  failed: "Failed",
}

export const SIGN_METHOD_LABELS: Record<SignMethod, string> = {
  v1: "Paperless V1",
  v2: "Paperless V2",
  "v2-custom": "Paperless V2 Custom",
}

export const SIGN_MESSAGES = {
  signing: "Signing document...",
  success: "Document berhasil dikirim untuk proses TTE.",
  failed: "Document gagal diproses.",
  checking: "Checking status...",
  templateMissing:
    "Template Paperless V2 Custom belum dibuat. Silakan buat template terlebih dahulu.",
  confirmQuestion: "Apakah Anda yakin ingin menandatangani dokumen ini?",
} as const

export const DEMO_MODE_MESSAGE =
  "Dokumen dan template disimpan secara lokal di browser Anda. Data ini tidak tersimpan di server."
