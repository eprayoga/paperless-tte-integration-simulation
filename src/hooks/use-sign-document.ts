"use client"

import { useCallback } from "react"
import { toast } from "sonner"

import { SIGN_MESSAGES } from "@/constants/document"
import { toApiError } from "@/lib/api-error"
import type { SignV2FormValues } from "@/schemas/document.schema"
import { fileToBase64 } from "@/lib/file"
import {
  toSignResultPatch,
  toSignV1Payload,
  toSignV2CustomPayload,
  toSignV2Payload,
} from "@/services/paperless/paperless.mapper"
import { paperlessService } from "@/services/paperless/paperless.service"
import { useBalanceStore } from "@/stores/balance.store"
import { useDocumentStore } from "@/stores/document.store"
import { getUsableTemplate, useTemplateStore } from "@/stores/template.store"
import { useUiStore } from "@/stores/ui.store"
import type { DocumentItem, SignMethod } from "@/types/document"
import type { SignTransactionData } from "@/types/paperless-api"

type SignParams = {
  document: DocumentItem
  method: SignMethod
  /** The re-attached PDF, already verified against document.fileHash. */
  file: File
  v2Details?: SignV2FormValues
}

/**
 * Sends the document to Paperless with the chosen method and moves it to
 * `pending`. Returns true on success. Feedback is shown through toasts.
 */
export function useSignDocument() {
  const markSubmitted = useDocumentStore((state) => state.markSubmitted)

  return useCallback(
    async ({ document, method, file, v2Details }: SignParams): Promise<boolean> => {
      const { startAction, endAction } = useUiStore.getState()
      if (!startAction(document.id, "signing")) return false

      const toastId = toast.loading(SIGN_MESSAGES.signing)
      try {
        const fileBase64 = await fileToBase64(file)
        let result: SignTransactionData

        if (method === "v1") {
          result = await paperlessService.signV1(toSignV1Payload(document, fileBase64))
        } else if (method === "v2") {
          if (!v2Details) {
            toast.error(SIGN_MESSAGES.failed, {
              id: toastId,
              description: "Reason dan location wajib diisi untuk TTE V2.",
            })
            return false
          }
          result = await paperlessService.signV2(
            toSignV2Payload({ ...document, ...v2Details }, fileBase64),
          )
        } else {
          const template = getUsableTemplate(
            useTemplateStore.getState().templates,
            document.id,
            document.fileHash,
          )
          if (!template) {
            toast.error(SIGN_MESSAGES.failed, {
              id: toastId,
              description: SIGN_MESSAGES.templateMissing,
            })
            return false
          }
          result = await paperlessService.signV2Custom(
            toSignV2CustomPayload(document, template, fileBase64),
          )
        }

        markSubmitted(document.id, { ...toSignResultPatch(result, method), ...v2Details })
        toast.success(SIGN_MESSAGES.success, {
          id: toastId,
          description: `Transaction ID: ${result.trx_id}`,
        })
        void useBalanceStore.getState().fetchBalance()
        return true
      } catch (error) {
        const apiError = toApiError(error)
        if (apiError.isUnauthorized) {
          toast.dismiss(toastId)
          return false
        }
        toast.error(SIGN_MESSAGES.failed, { id: toastId, description: apiError.message })
        return false
      } finally {
        endAction(document.id)
      }
    },
    [markSubmitted],
  )
}
