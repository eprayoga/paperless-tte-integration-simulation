"use client"

import { WarningIcon } from "@phosphor-icons/react"

import { DocumentNotFound, PageSkeleton } from "@/components/common/states"
import { DocumentForm } from "@/components/documents/document-form"
import { PageContainer, PageHeader, PageTitle } from "@/components/layout/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ROUTES } from "@/constants/app"
import { useDocument } from "@/hooks/use-document"
import { useStoresHydrated } from "@/hooks/use-stores-hydrated"

export function CreateDocumentView() {
  const hydrated = useStoresHydrated()

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Documents", href: ROUTES.documents },
          { label: "Create Document" },
        ]}
      />
      <PageContainer>
        <div className="mx-auto max-w-3xl space-y-6">
          <PageTitle
            title="Create Document"
            description="Dokumen baru disimpan lokal di browser dengan status Draft."
          />
          {hydrated ? <DocumentForm /> : <PageSkeleton />}
        </div>
      </PageContainer>
    </>
  )
}

export function EditDocumentView({ id }: { id: string }) {
  const { hydrated, document } = useDocument(id)

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Documents", href: ROUTES.documents },
          ...(document ? [{ label: document.title, href: ROUTES.documentDetail(id) }] : []),
          { label: "Edit" },
        ]}
      />
      <PageContainer>
        <div className="mx-auto max-w-3xl space-y-6">
          <PageTitle
            title="Edit Document"
            description="Hanya dokumen berstatus Draft yang dapat diedit."
          />
          {!hydrated ? (
            <PageSkeleton />
          ) : !document ? (
            <DocumentNotFound />
          ) : document.status !== "draft" ? (
            <Alert variant="destructive">
              <WarningIcon />
              <AlertTitle>Dokumen tidak dapat diedit</AlertTitle>
              <AlertDescription>
                Dokumen sudah dikirim untuk proses TTE. Gunakan Retry pada dokumen yang gagal untuk
                mengembalikannya ke Draft.
              </AlertDescription>
            </Alert>
          ) : (
            <DocumentForm key={document.id} document={document} />
          )}
        </div>
      </PageContainer>
    </>
  )
}
