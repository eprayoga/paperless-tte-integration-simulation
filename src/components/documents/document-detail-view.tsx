"use client"

import {
  ArrowCounterClockwiseIcon,
  ArrowsClockwiseIcon,
  ClockIcon,
  DownloadSimpleIcon,
  EyeIcon,
  FilePdfIcon,
  PencilSimpleIcon,
  QrCodeIcon,
  SealCheckIcon,
  SignatureIcon,
  TrashIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, type ReactNode } from "react"

import { DocumentNotFound, PageSkeleton } from "@/components/common/states"
import {
  DocumentActionsProvider,
  useDocumentActions,
} from "@/components/documents/document-actions"
import { PdfAttachField } from "@/components/documents/pdf-attach-field"
import { SignMethodBadge, StatusBadge } from "@/components/documents/status-badge"
import { TemplateSummary } from "@/components/documents/template-summary"
import { PageContainer, PageHeader } from "@/components/layout/page-header"
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
import { Spinner } from "@/components/ui/spinner"
import { ROUTES } from "@/constants/app"
import { useDocument } from "@/hooks/use-document"
import { formatFileSize } from "@/lib/file"
import { formatDateTime, toSafeExternalUrl } from "@/lib/format"
import { useSessionFileStore } from "@/stores/session-file.store"
import { useUiStore } from "@/stores/ui.store"
import type { DocumentItem, SignMethod } from "@/types/document"
import type { V2CustomTemplate } from "@/types/template"

function DetailList({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[180px_1fr]">
      {items.map((item) => (
        <div key={item.label} className="contents">
          <dt className="text-muted-foreground">{item.label}</dt>
          <dd className="min-w-0 font-medium break-words">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function Mono({ value }: { value?: string }) {
  return value ? (
    <span className="font-mono text-xs break-all">{value}</span>
  ) : (
    <span className="text-muted-foreground">-</span>
  )
}

function DocumentHeaderActions({ document }: { document: DocumentItem }) {
  const actions = useDocumentActions()
  const busy = useUiStore((state) => state.busy[document.id])
  const sign = (method: SignMethod) => actions.requestSign(document, method)

  if (document.status === "draft") {
    return (
      <>
        <Button variant="outline" asChild>
          <Link href={ROUTES.editDocument(document.id)}>
            <PencilSimpleIcon />
            Edit
          </Link>
        </Button>
        <Button variant="outline" disabled={!!busy} onClick={() => sign("v1")}>
          <SignatureIcon />
          TTE V1
        </Button>
        <Button variant="outline" disabled={!!busy} onClick={() => sign("v2")}>
          <SealCheckIcon />
          TTE V2
        </Button>
        <Button disabled={!!busy} onClick={() => sign("v2-custom")}>
          <QrCodeIcon />
          TTE V2 Custom
        </Button>
      </>
    )
  }

  if (document.status === "pending") {
    return (
      <Button disabled={!!busy} onClick={() => void actions.checkStatus(document)}>
        {busy === "checking" ? <Spinner /> : <ArrowsClockwiseIcon />}
        {busy === "checking" ? "Checking status..." : "Check Status"}
      </Button>
    )
  }

  if (document.status === "success") {
    return (
      <>
        <Button
          variant="outline"
          disabled={!!busy}
          onClick={() => void actions.openSignedFile(document, "preview")}
        >
          {busy === "opening" ? <Spinner /> : <EyeIcon />}
          Preview
        </Button>
        <Button
          variant="outline"
          disabled={!!busy}
          onClick={() => void actions.openSignedFile(document, "download")}
        >
          <DownloadSimpleIcon />
          Download
        </Button>
        <Button
          disabled={!toSafeExternalUrl(document.verificationLink)}
          onClick={() => actions.openVerification(document)}
        >
          <SealCheckIcon />
          Verification
        </Button>
      </>
    )
  }

  return (
    <>
      <Button variant="outline" onClick={() => actions.requestDelete(document)}>
        <TrashIcon />
        Delete
      </Button>
      <Button onClick={() => actions.retry(document)}>
        <ArrowCounterClockwiseIcon />
        Retry
      </Button>
    </>
  )
}

function StatusAlert({ document }: { document: DocumentItem }) {
  const actions = useDocumentActions()

  if (document.status === "pending") {
    return (
      <Alert className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
        <ClockIcon />
        <AlertTitle>Pending</AlertTitle>
        <AlertDescription>
          Dokumen sedang diproses Paperless. Tekan &quot;Check Status&quot; untuk mengambil status
          terbaru.
        </AlertDescription>
      </Alert>
    )
  }
  if (document.status === "failed") {
    return (
      <Alert variant="destructive">
        <WarningCircleIcon />
        <AlertTitle>Proses TTE gagal</AlertTitle>
        <AlertDescription>
          <p>{document.errorMessage ?? "Document gagal diproses."}</p>
          <Button
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={() => actions.retry(document)}
          >
            <ArrowCounterClockwiseIcon />
            Retry signing
          </Button>
        </AlertDescription>
      </Alert>
    )
  }
  if (document.status === "success") {
    return (
      <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
        <SealCheckIcon />
        <AlertTitle>Dokumen berhasil ditandatangani</AlertTitle>
        <AlertDescription>
          URL preview dan download selalu diambil ulang dari status transaksi terbaru saat tombol
          ditekan.
        </AlertDescription>
      </Alert>
    )
  }
  return null
}

function TemplateCard({
  document,
  template,
}: {
  document: DocumentItem
  template?: V2CustomTemplate
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <QrCodeIcon className="text-primary size-5" />
          Template V2 Custom
        </CardTitle>
        <CardDescription>
          Koordinat signature, QR, dan text info (origin kiri bawah).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {template ? (
          <TemplateSummary template={template} />
        ) : (
          <p className="text-muted-foreground text-sm">Template belum dibuat untuk dokumen ini.</p>
        )}
      </CardContent>
      {document.status === "draft" && (
        <CardFooter className="flex-wrap gap-2 border-t">
          <Button variant={template ? "outline" : "default"} size="sm" asChild>
            <Link href={ROUTES.documentTemplate(document.id)}>
              <PencilSimpleIcon />
              {template ? "Edit Template" : "Buat Template"}
            </Link>
          </Button>
          {template && (
            <Button size="sm" asChild>
              <Link href={ROUTES.signPreview(document.id)}>
                <EyeIcon />
                Preview &amp; Sign
              </Link>
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  )
}

function OriginalPdfCard({ document }: { document: DocumentItem }) {
  const file = useSessionFileStore((state) => state.files[document.id])
  const [showPreview, setShowPreview] = useState(false)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FilePdfIcon className="size-5 text-red-500" />
          PDF Asli
        </CardTitle>
        <CardDescription className="break-all">
          {document.fileName} · {formatFileSize(document.fileSize)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <PdfAttachField document={document} />
        {file && (
          <Button variant="outline" size="sm" onClick={() => setShowPreview((value) => !value)}>
            <EyeIcon />
            {showPreview ? "Sembunyikan preview" : "Tampilkan preview"}
          </Button>
        )}
        {file && showPreview && (
          <div className="max-h-[70svh] overflow-y-auto rounded-lg border p-2">
            <PdfViewer source={file} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function DocumentDetailContent({
  document,
  template,
}: {
  document: DocumentItem
  template?: V2CustomTemplate
}) {
  const verificationUrl = toSafeExternalUrl(document.verificationLink)

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={document.status} />
            <SignMethodBadge method={document.signMethod} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight break-words">{document.title}</h1>
          <p className="text-muted-foreground font-mono text-sm">{document.regNumber}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <DocumentHeaderActions document={document} />
        </div>
      </div>

      <StatusAlert document={document} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Document Information</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList
                items={[
                  { label: "Title", value: document.title },
                  { label: "Registration Number", value: <Mono value={document.regNumber} /> },
                  { label: "Key Document", value: <Mono value={document.keyDoc} /> },
                  { label: "Reason", value: document.reason || "-" },
                  { label: "Location", value: document.location || "-" },
                  {
                    label: "File",
                    value: `${document.fileName} (${formatFileSize(document.fileSize)})`,
                  },
                  { label: "Created At", value: formatDateTime(document.createdAt) },
                  { label: "Updated At", value: formatDateTime(document.updatedAt) },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Transaction</CardTitle>
              <CardDescription>Informasi dari response Paperless.</CardDescription>
            </CardHeader>
            <CardContent>
              <DetailList
                items={[
                  {
                    label: "Sign Method",
                    value: <SignMethodBadge method={document.signMethod} />,
                  },
                  { label: "Status", value: <StatusBadge status={document.status} /> },
                  { label: "Transaction ID", value: <Mono value={document.trxId} /> },
                  { label: "Signer", value: document.signerName ?? "-" },
                  { label: "Signer UUID", value: <Mono value={document.signerUuid} /> },
                  { label: "Serial Number", value: <Mono value={document.serialNumber} /> },
                  {
                    label: "Verification Link",
                    value: verificationUrl ? (
                      <a
                        href={verificationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary break-all underline-offset-4 hover:underline"
                      >
                        {verificationUrl}
                      </a>
                    ) : (
                      "-"
                    ),
                  },
                  { label: "Submitted At", value: formatDateTime(document.submittedAt) },
                  { label: "Last Checked", value: formatDateTime(document.lastCheckedAt) },
                ]}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <TemplateCard document={document} template={template} />
          <OriginalPdfCard document={document} />
        </div>
      </div>
    </>
  )
}

export function DocumentDetailView({ id }: { id: string }) {
  const router = useRouter()
  const { hydrated, document, template } = useDocument(id)

  return (
    <DocumentActionsProvider onDeleted={() => router.push(ROUTES.documents)}>
      <PageHeader
        breadcrumbs={[
          { label: "Documents", href: ROUTES.documents },
          { label: document?.title ?? "Detail" },
        ]}
      />
      <PageContainer>
        {!hydrated ? (
          <PageSkeleton />
        ) : !document ? (
          <DocumentNotFound />
        ) : (
          <DocumentDetailContent document={document} template={template} />
        )}
      </PageContainer>
    </DocumentActionsProvider>
  )
}
