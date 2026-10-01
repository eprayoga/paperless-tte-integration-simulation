"use client"

import {
  ArrowLeftIcon,
  CodeIcon,
  PencilSimpleIcon,
  SealCheckIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import { DocumentNotFound, PageSkeleton } from "@/components/common/states"
import { PdfAttachField } from "@/components/documents/pdf-attach-field"
import { SignDialog } from "@/components/documents/sign-dialog"
import { TemplateSummary } from "@/components/documents/template-summary"
import { PageContainer, PageHeader, PageTitle } from "@/components/layout/page-header"
import { PdfViewer } from "@/components/pdf/pdf-viewer"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { ROUTES } from "@/constants/app"
import { SIGN_MESSAGES, SIGN_METHOD_LABELS } from "@/constants/document"
import { useDocument } from "@/hooks/use-document"
import { renderTemplatePreview } from "@/lib/pdf-preview"
import { toSignV2CustomPayload } from "@/services/paperless/paperless.mapper"
import { useSessionFileStore } from "@/stores/session-file.store"
import { useUiStore } from "@/stores/ui.store"
import type { DocumentItem } from "@/types/document"
import type { V2CustomTemplate } from "@/types/template"

type PreviewState =
  | { status: "loading" }
  | { status: "ready"; bytes: Uint8Array }
  | { status: "error" }

function usePreviewBytes(file: File, template: V2CustomTemplate) {
  const [state, setState] = useState<PreviewState>({ status: "loading" })

  useEffect(() => {
    let cancelled = false
    file
      .arrayBuffer()
      .then((buffer) => renderTemplatePreview(buffer, template))
      .then((bytes) => {
        if (!cancelled) setState({ status: "ready", bytes })
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" })
      })
    return () => {
      cancelled = true
    }
  }, [file, template])

  return state
}

function PreviewContent({
  document,
  template,
  file,
  onConfirm,
}: {
  document: DocumentItem
  template: V2CustomTemplate
  file: File
  onConfirm: () => void
}) {
  const preview = usePreviewBytes(file, template)
  const isSigning = useUiStore((state) => state.busy[document.id] === "signing")
  const payloadPreview = useMemo(
    () => JSON.stringify(toSignV2CustomPayload(document, template, "<base64_pdf>"), null, 2),
    [document, template],
  )

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Preview Dokumen</CardTitle>
          <CardDescription>
            Elemen dummy digambar pada koordinat PDF yang akan dikirim ke Paperless. QR dan
            signature asli dibuat oleh Paperless saat proses TTE.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {preview.status === "loading" && (
            <div className="space-y-2">
              <p className="text-muted-foreground flex items-center gap-2 text-sm">
                <Spinner />
                Generating preview...
              </p>
              <Skeleton className="aspect-[1/1.414] w-full" />
            </div>
          )}
          {preview.status === "error" && (
            <Alert variant="destructive">
              <WarningCircleIcon />
              <AlertTitle>Preview gagal dibuat</AlertTitle>
              <AlertDescription>
                PDF tidak dapat diproses. Pastikan file tidak terproteksi password.
              </AlertDescription>
            </Alert>
          )}
          {preview.status === "ready" && (
            <div className="bg-muted/40 max-h-[80svh] overflow-y-auto rounded-lg p-3">
              <PdfViewer source={preview.bytes} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="h-fit gap-4">
        <CardHeader>
          <CardTitle className="text-base">Ringkasan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[120px_1fr]">
            <dt className="text-muted-foreground">Document</dt>
            <dd className="font-medium break-words">{document.title}</dd>
            <dt className="text-muted-foreground">Reg Number</dt>
            <dd className="font-mono text-xs break-all">{document.regNumber}</dd>
            <dt className="text-muted-foreground">Method</dt>
            <dd className="font-medium">{SIGN_METHOD_LABELS["v2-custom"]}</dd>
          </dl>
          <Separator />
          <TemplateSummary template={template} />
          <details className="rounded-lg border">
            <summary className="hover:bg-muted/50 flex cursor-pointer items-center gap-2 px-3 py-2 text-sm font-medium">
              <CodeIcon className="size-4" />
              Payload request (tanpa file)
            </summary>
            <pre className="bg-muted/40 max-h-80 overflow-auto border-t p-3 text-[11px] leading-relaxed">
              {payloadPreview}
            </pre>
          </details>
        </CardContent>
        <CardFooter className="flex-col gap-2 border-t">
          <Button
            className="w-full"
            disabled={preview.status !== "ready" || isSigning}
            onClick={onConfirm}
          >
            {isSigning ? <Spinner /> : <SealCheckIcon />}
            {isSigning ? "Signing..." : "Confirm & Sign"}
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <Link href={ROUTES.documentTemplate(document.id)}>
              <PencilSimpleIcon />
              Back to Template
            </Link>
          </Button>
          <Button variant="ghost" className="w-full" asChild>
            <Link href={ROUTES.documents}>
              <XIcon />
              Cancel
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

export function SignPreviewView({ id }: { id: string }) {
  const router = useRouter()
  const { hydrated, document, template } = useDocument(id)
  const file = useSessionFileStore((state) => state.files[id])
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Documents", href: ROUTES.documents },
          ...(document ? [{ label: document.title, href: ROUTES.documentDetail(id) }] : []),
          { label: "Preview V2 Custom" },
        ]}
      />
      <PageContainer>
        {!hydrated ? (
          <PageSkeleton />
        ) : !document ? (
          <DocumentNotFound />
        ) : (
          <>
            <PageTitle
              title="Preview TTE V2 Custom"
              description="Periksa posisi signature, QR, dan text info sebelum dokumen dikirim."
              actions={
                <Button variant="outline" asChild>
                  <Link href={ROUTES.documentDetail(id)}>
                    <ArrowLeftIcon />
                    Detail dokumen
                  </Link>
                </Button>
              }
            />

            {document.status !== "draft" ? (
              <Alert>
                <WarningCircleIcon />
                <AlertTitle>Dokumen sudah diproses</AlertTitle>
                <AlertDescription>
                  Hanya dokumen berstatus Draft yang dapat ditandatangani.
                </AlertDescription>
              </Alert>
            ) : !template ? (
              <Alert variant="destructive">
                <WarningCircleIcon />
                <AlertTitle>Template belum tersedia</AlertTitle>
                <AlertDescription>
                  <p>{SIGN_MESSAGES.templateMissing}</p>
                  <Button size="sm" className="mt-2" asChild>
                    <Link href={ROUTES.documentTemplate(id)}>
                      <PencilSimpleIcon />
                      Buat Template
                    </Link>
                  </Button>
                </AlertDescription>
              </Alert>
            ) : !file ? (
              <Card className="mx-auto w-full max-w-xl">
                <CardHeader>
                  <CardTitle>Pilih file PDF dokumen</CardTitle>
                  <CardDescription>
                    Preview dibuat dari file asli. Pilih ulang file yang sama seperti saat dokumen
                    dibuat.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PdfAttachField document={document} />
                </CardContent>
              </Card>
            ) : (
              <PreviewContent
                document={document}
                template={template}
                file={file}
                onConfirm={() => setConfirmOpen(true)}
              />
            )}

            <SignDialog
              open={confirmOpen}
              onOpenChange={setConfirmOpen}
              document={document}
              method="v2-custom"
              onSigned={() => router.push(ROUTES.documentDetail(id))}
            />
          </>
        )}
      </PageContainer>
    </>
  )
}
