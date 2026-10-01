"use client"

import { SealCheckIcon, WarningIcon } from "@phosphor-icons/react"
import Link from "next/link"

import { PdfAttachField } from "@/components/documents/pdf-attach-field"
import { TemplateSummary } from "@/components/documents/template-summary"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { ROUTES } from "@/constants/app"
import { SIGN_MESSAGES, SIGN_METHOD_LABELS } from "@/constants/document"
import { useSignDocument } from "@/hooks/use-sign-document"
import { useSessionFileStore } from "@/stores/session-file.store"
import { getUsableTemplate, useTemplateStore } from "@/stores/template.store"
import { useUiStore } from "@/stores/ui.store"
import type { DocumentItem, SignMethod } from "@/types/document"

type SignDialogProps = {
  document: DocumentItem | null
  method: SignMethod | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSigned?: (document: DocumentItem) => void
}

/** Confirmation step shown before every signing request. */
export function SignDialog({ document, method, open, onOpenChange, onSigned }: SignDialogProps) {
  const signDocument = useSignDocument()
  const file = useSessionFileStore((state) => (document ? state.files[document.id] : undefined))
  const isSigning = useUiStore((state) =>
    document ? state.busy[document.id] === "signing" : false,
  )
  const template = useTemplateStore((state) =>
    document && method === "v2-custom"
      ? getUsableTemplate(state.templates, document.id, document.fileHash)
      : undefined,
  )

  if (!document || !method) return null

  const missingV2Fields =
    method === "v2" && (!document.reason?.trim() || !document.location?.trim())
  const missingTemplate = method === "v2-custom" && !template
  const canConfirm = !!file && !missingV2Fields && !missingTemplate && !isSigning

  async function handleConfirm() {
    if (!document || !method || !file) return
    const ok = await signDocument({ document, method, file })
    if (ok) {
      onOpenChange(false)
      onSigned?.(document)
    }
  }

  const details = [
    { label: "Document", value: document.title },
    { label: "Registration Number", value: document.regNumber },
    { label: "Signing Method", value: SIGN_METHOD_LABELS[method] },
    ...(method === "v2"
      ? [
          { label: "Reason", value: document.reason || "-" },
          { label: "Location", value: document.location || "-" },
        ]
      : []),
  ]

  return (
    <Dialog open={open} onOpenChange={(next) => !isSigning && onOpenChange(next)}>
      <DialogContent
        className="max-h-[90svh] overflow-y-auto sm:max-w-lg"
        onInteractOutside={(event) => isSigning && event.preventDefault()}
        onEscapeKeyDown={(event) => isSigning && event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SealCheckIcon className="text-primary size-5" />
            Konfirmasi Tanda Tangan
          </DialogTitle>
          <DialogDescription>{SIGN_MESSAGES.confirmQuestion}</DialogDescription>
        </DialogHeader>

        <dl className="bg-muted/40 grid gap-x-4 gap-y-2 rounded-lg border p-4 text-sm sm:grid-cols-[150px_1fr]">
          {details.map((item) => (
            <div key={item.label} className="contents">
              <dt className="text-muted-foreground">{item.label}</dt>
              <dd className="font-medium break-words">{item.value}</dd>
            </div>
          ))}
        </dl>

        {method === "v2-custom" && template && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Template V2 Custom</p>
            <TemplateSummary template={template} />
          </div>
        )}

        {missingTemplate && (
          <Alert variant="destructive">
            <WarningIcon />
            <AlertTitle>Template belum tersedia</AlertTitle>
            <AlertDescription>
              {SIGN_MESSAGES.templateMissing}
              <Link className="underline" href={ROUTES.documentTemplate(document.id)}>
                Buat template
              </Link>
            </AlertDescription>
          </Alert>
        )}

        {missingV2Fields && (
          <Alert variant="destructive">
            <WarningIcon />
            <AlertTitle>Reason dan Location wajib untuk V2</AlertTitle>
            <AlertDescription>
              Lengkapi data dokumen terlebih dahulu.
              <Link className="underline" href={ROUTES.editDocument(document.id)}>
                Edit dokumen
              </Link>
            </AlertDescription>
          </Alert>
        )}

        <Separator />

        <div className="space-y-2">
          <p className="text-sm font-medium">File PDF</p>
          <PdfAttachField document={document} disabled={isSigning} />
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={isSigning} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!canConfirm} onClick={() => void handleConfirm()}>
            {isSigning ? <Spinner /> : <SealCheckIcon />}
            {isSigning ? "Signing..." : "Confirm Sign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
