"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { SealCheckIcon, WarningIcon } from "@phosphor-icons/react"
import Link from "next/link"
import { useEffect } from "react"
import { useForm } from "react-hook-form"

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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { ROUTES } from "@/constants/app"
import { SIGN_MESSAGES, SIGN_METHOD_LABELS } from "@/constants/document"
import { useSignDocument } from "@/hooks/use-sign-document"
import { signV2Schema, type SignV2FormValues } from "@/schemas/document.schema"
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

  const v2Form = useForm<SignV2FormValues>({
    resolver: zodResolver(signV2Schema),
    mode: "onTouched",
    defaultValues: { reason: "", location: "" },
  })

  useEffect(() => {
    if (open && method === "v2") {
      v2Form.reset({ reason: document?.reason ?? "", location: document?.location ?? "" })
    }
  }, [open, method, document?.id, document?.reason, document?.location, v2Form])

  if (!document || !method) return null

  const isV2 = method === "v2"
  const missingTemplate = method === "v2-custom" && !template
  const canConfirm = !!file && !missingTemplate && !isSigning
  const v2Errors = v2Form.formState.errors

  async function submit(v2Details?: SignV2FormValues) {
    if (!document || !method || !file) return
    const ok = await signDocument({ document, method, file, v2Details })
    if (ok) {
      onOpenChange(false)
      onSigned?.(document)
    }
  }

  function handleConfirm() {
    if (isV2) {
      void v2Form.handleSubmit((values) => submit(values))()
      return
    }
    void submit()
  }

  const details = [
    { label: "Document", value: document.title },
    { label: "Registration Number", value: document.regNumber },
    { label: "Signing Method", value: SIGN_METHOD_LABELS[method] },
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

        {isV2 && (
          <FieldGroup className="gap-4">
            <Field data-invalid={!!v2Errors.reason}>
              <FieldLabel htmlFor="sign-v2-reason">Reason *</FieldLabel>
              <Input
                id="sign-v2-reason"
                placeholder="Persetujuan dokumen"
                disabled={isSigning}
                aria-invalid={!!v2Errors.reason}
                {...v2Form.register("reason")}
              />
              <FieldError errors={[v2Errors.reason]} />
            </Field>
            <Field data-invalid={!!v2Errors.location}>
              <FieldLabel htmlFor="sign-v2-location">Location *</FieldLabel>
              <Input
                id="sign-v2-location"
                placeholder="Bandung"
                disabled={isSigning}
                aria-invalid={!!v2Errors.location}
                {...v2Form.register("location")}
              />
              <FieldError errors={[v2Errors.location]} />
            </Field>
          </FieldGroup>
        )}

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

        <Separator />

        <div className="space-y-2">
          <p className="text-sm font-medium">File PDF</p>
          <PdfAttachField document={document} disabled={isSigning} />
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={isSigning} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!canConfirm} onClick={handleConfirm}>
            {isSigning ? <Spinner /> : <SealCheckIcon />}
            {isSigning ? "Signing..." : "Confirm Sign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
