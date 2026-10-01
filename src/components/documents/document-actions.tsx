"use client"

import { useRouter } from "next/navigation"
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import { toast } from "sonner"

import { DeleteDocumentDialog } from "@/components/documents/delete-document-dialog"
import { SignDialog } from "@/components/documents/sign-dialog"
import { ROUTES } from "@/constants/app"
import { SIGN_MESSAGES } from "@/constants/document"
import { useCheckStatus } from "@/hooks/use-check-status"
import { useSignedFileActions, type SignedFileKind } from "@/hooks/use-signed-file-actions"
import { useDocumentStore } from "@/stores/document.store"
import { useSessionFileStore } from "@/stores/session-file.store"
import { getUsableTemplate, useTemplateStore } from "@/stores/template.store"
import type { DocumentItem, SignMethod } from "@/types/document"

type DocumentActions = {
  requestSign: (document: DocumentItem, method: SignMethod) => void
  checkStatus: (document: DocumentItem) => Promise<void>
  openSignedFile: (document: DocumentItem, kind: SignedFileKind) => Promise<void>
  openVerification: (document: DocumentItem) => void
  retry: (document: DocumentItem) => void
  requestDelete: (document: DocumentItem) => void
}

const DocumentActionsContext = createContext<DocumentActions | null>(null)

export function useDocumentActions(): DocumentActions {
  const context = useContext(DocumentActionsContext)
  if (!context) throw new Error("useDocumentActions must be used inside DocumentActionsProvider")
  return context
}

type DialogState =
  | { type: "sign"; document: DocumentItem; method: SignMethod }
  | { type: "delete"; document: DocumentItem }
  | null

/**
 * Owns the confirmation dialogs and wires every document action, so the table
 * and the detail page behave the same way.
 */
export function DocumentActionsProvider({
  children,
  onDeleted,
  onSigned,
}: {
  children: ReactNode
  onDeleted?: (document: DocumentItem) => void
  onSigned?: (document: DocumentItem) => void
}) {
  const router = useRouter()
  const [dialog, setDialog] = useState<DialogState>(null)
  const checkStatus = useCheckStatus()
  const { openSignedFile, openVerification } = useSignedFileActions()
  const resetForRetry = useDocumentStore((state) => state.resetForRetry)
  const removeDocument = useDocumentStore((state) => state.removeDocument)
  const removeTemplate = useTemplateStore((state) => state.removeTemplate)
  const clearFile = useSessionFileStore((state) => state.clearFile)

  const requestSign = useCallback(
    (document: DocumentItem, method: SignMethod) => {
      if (document.status !== "draft") return
      if (method === "v2-custom") {
        const template = getUsableTemplate(
          useTemplateStore.getState().templates,
          document.id,
          document.fileHash,
        )
        if (!template) {
          toast.warning(SIGN_MESSAGES.templateMissing)
          router.push(ROUTES.documentTemplate(document.id))
          return
        }
        // Preview is mandatory before a V2 Custom request.
        router.push(ROUTES.signPreview(document.id))
        return
      }
      setDialog({ type: "sign", document, method })
    },
    [router],
  )

  const retry = useCallback(
    (document: DocumentItem) => {
      resetForRetry(document.id)
      toast.info("Dokumen dikembalikan ke Draft.", {
        description: "Pilih metode TTE untuk mencoba kembali.",
      })
    },
    [resetForRetry],
  )

  const confirmDelete = useCallback(
    (document: DocumentItem) => {
      removeDocument(document.id)
      removeTemplate(document.id)
      clearFile(document.id)
      setDialog(null)
      toast.success("Dokumen dihapus.")
      onDeleted?.(document)
    },
    [removeDocument, removeTemplate, clearFile, onDeleted],
  )

  const value = useMemo<DocumentActions>(
    () => ({
      requestSign,
      checkStatus,
      openSignedFile,
      openVerification,
      retry,
      requestDelete: (document) => setDialog({ type: "delete", document }),
    }),
    [requestSign, checkStatus, openSignedFile, openVerification, retry],
  )

  return (
    <DocumentActionsContext.Provider value={value}>
      {children}
      <SignDialog
        open={dialog?.type === "sign"}
        document={dialog?.type === "sign" ? dialog.document : null}
        method={dialog?.type === "sign" ? dialog.method : null}
        onOpenChange={(open) => !open && setDialog(null)}
        onSigned={onSigned}
      />
      <DeleteDocumentDialog
        open={dialog?.type === "delete"}
        document={dialog?.type === "delete" ? dialog.document : null}
        onOpenChange={(open) => !open && setDialog(null)}
        onConfirm={confirmDelete}
      />
    </DocumentActionsContext.Provider>
  )
}
