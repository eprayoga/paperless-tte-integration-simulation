"use client"

import { useCallback } from "react"
import { toast } from "sonner"

import { SIGN_MESSAGES } from "@/constants/document"
import { toApiError } from "@/lib/api-error"
import { toStatusPatch } from "@/services/paperless/paperless.mapper"
import { paperlessService } from "@/services/paperless/paperless.service"
import { useDocumentStore } from "@/stores/document.store"
import { useUiStore } from "@/stores/ui.store"
import type { DocumentItem } from "@/types/document"

/** Manual status check (no polling). Maps processing/completed/failed to app status. */
export function useCheckStatus() {
  const applyStatus = useDocumentStore((state) => state.applyStatus)

  return useCallback(
    async (document: DocumentItem): Promise<void> => {
      if (!document.trxId) {
        toast.error("Transaction ID tidak ditemukan untuk dokumen ini.")
        return
      }
      const { startAction, endAction } = useUiStore.getState()
      if (!startAction(document.id, "checking")) return

      const toastId = toast.loading(SIGN_MESSAGES.checking)
      try {
        const data = await paperlessService.getSignStatus(document.trxId)
        const patch = toStatusPatch(data)
        applyStatus(document.id, patch)

        if (patch.status === "success") {
          toast.success("Dokumen berhasil ditandatangani.", {
            id: toastId,
            description: "File hasil TTE siap di-preview dan di-download.",
          })
        } else if (patch.status === "failed") {
          toast.error(SIGN_MESSAGES.failed, { id: toastId, description: patch.errorMessage })
        } else {
          toast.info("Dokumen masih diproses.", {
            id: toastId,
            description: "Silakan cek status kembali beberapa saat lagi.",
          })
        }
      } catch (error) {
        const apiError = toApiError(error)
        if (apiError.isUnauthorized) {
          toast.dismiss(toastId)
          return
        }
        toast.error("Gagal mengecek status.", { id: toastId, description: apiError.message })
      } finally {
        endAction(document.id)
      }
    },
    [applyStatus],
  )
}
