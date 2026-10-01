"use client"

import {
  CheckCircleIcon,
  ClockIcon,
  FilePlusIcon,
  NotePencilIcon,
  XCircleIcon,
  type Icon,
} from "@phosphor-icons/react"
import Link from "next/link"

import { BalanceCard } from "@/components/balance/balance-card"
import { TableSkeleton } from "@/components/common/states"
import { DemoModeAlert } from "@/components/documents/demo-mode-alert"
import { DocumentActionsProvider } from "@/components/documents/document-actions"
import { DocumentsEmptyState } from "@/components/documents/documents-empty-state"
import { DocumentsTable } from "@/components/documents/documents-table"
import { PageContainer, PageHeader, PageTitle } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ROUTES } from "@/constants/app"
import { STATUS_LABELS } from "@/constants/document"
import { useStoresHydrated } from "@/hooks/use-stores-hydrated"
import { useDocumentStore } from "@/stores/document.store"
import type { DocumentStatus } from "@/types/document"

const STATUS_STATS: { status: DocumentStatus; icon: Icon; className: string }[] = [
  { status: "draft", icon: NotePencilIcon, className: "text-muted-foreground" },
  { status: "pending", icon: ClockIcon, className: "text-amber-600" },
  { status: "success", icon: CheckCircleIcon, className: "text-emerald-600" },
  { status: "failed", icon: XCircleIcon, className: "text-red-600" },
]

export function DocumentsView() {
  const hydrated = useStoresHydrated()
  const documents = useDocumentStore((state) => state.documents)

  return (
    <DocumentActionsProvider>
      <PageHeader breadcrumbs={[{ label: "Documents" }]} />
      <PageContainer>
        <PageTitle
          title="Documents"
          description="Kelola dokumen demo dan lakukan Tanda Tangan Elektronik melalui Paperless."
          actions={
            <Button asChild>
              <Link href={ROUTES.createDocument}>
                <FilePlusIcon />
                Create Document
              </Link>
            </Button>
          }
        />

        <div className="grid gap-4 lg:grid-cols-3">
          <BalanceCard />
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardDescription>Ringkasan status dokumen</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {STATUS_STATS.map(({ status, icon: StatIcon, className }) => (
                <div key={status} className="bg-muted/40 rounded-lg border p-3">
                  <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <StatIcon className={`size-4 ${className}`} />
                    {STATUS_LABELS[status]}
                  </div>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {hydrated ? documents.filter((doc) => doc.status === status).length : "-"}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <DemoModeAlert />

        <Card>
          <CardHeader>
            <CardTitle>Daftar Dokumen</CardTitle>
            <CardDescription>
              Aksi yang tersedia menyesuaikan status dokumen: Draft, Pending, Success, atau Failed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!hydrated ? (
              <TableSkeleton />
            ) : documents.length === 0 ? (
              <DocumentsEmptyState />
            ) : (
              <DocumentsTable documents={documents} />
            )}
          </CardContent>
        </Card>
      </PageContainer>
    </DocumentActionsProvider>
  )
}
