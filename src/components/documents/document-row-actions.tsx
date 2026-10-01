"use client"

import {
  ArrowCounterClockwiseIcon,
  ArrowsClockwiseIcon,
  DotsThreeOutlineVerticalIcon,
  DownloadSimpleIcon,
  EyeIcon,
  FileMagnifyingGlassIcon,
  PencilSimpleIcon,
  QrCodeIcon,
  SealCheckIcon,
  SignatureIcon,
  TrashIcon,
} from "@phosphor-icons/react"
import Link from "next/link"

import { useDocumentActions } from "@/components/documents/document-actions"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { ROUTES } from "@/constants/app"
import { useUiStore } from "@/stores/ui.store"
import type { DocumentItem } from "@/types/document"

const BUSY_LABEL = {
  signing: "Signing...",
  checking: "Checking status...",
  opening: "Membuka file...",
} as const

export function DocumentRowActions({ document }: { document: DocumentItem }) {
  const actions = useDocumentActions()
  const busy = useUiStore((state) => state.busy[document.id])

  if (busy) {
    return (
      <Button variant="ghost" size="sm" disabled className="text-muted-foreground">
        <Spinner />
        <span className="hidden lg:inline">{BUSY_LABEL[busy]}</span>
      </Button>
    )
  }

  const viewDetail = (
    <DropdownMenuItem asChild>
      <Link href={ROUTES.documentDetail(document.id)}>
        <FileMagnifyingGlassIcon />
        View Detail
      </Link>
    </DropdownMenuItem>
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Aksi untuk ${document.title}`}>
          <DotsThreeOutlineVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {document.status === "draft" && (
          <>
            <DropdownMenuLabel>Tanda Tangan Elektronik</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={() => actions.requestSign(document, "v1")}>
                <SignatureIcon />
                TTE with Paperless V1
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => actions.requestSign(document, "v2")}>
                <SealCheckIcon />
                TTE with Paperless V2
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => actions.requestSign(document, "v2-custom")}>
                <QrCodeIcon />
                TTE with Paperless V2 Custom
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {viewDetail}
            <DropdownMenuItem asChild>
              <Link href={ROUTES.editDocument(document.id)}>
                <PencilSimpleIcon />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={() => actions.requestDelete(document)}>
              <TrashIcon />
              Delete
            </DropdownMenuItem>
          </>
        )}

        {document.status === "pending" && (
          <>
            <DropdownMenuItem onSelect={() => void actions.checkStatus(document)}>
              <ArrowsClockwiseIcon />
              Check Status
            </DropdownMenuItem>
            {viewDetail}
          </>
        )}

        {document.status === "success" && (
          <>
            <DropdownMenuItem onSelect={() => void actions.openSignedFile(document, "preview")}>
              <EyeIcon />
              Preview
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void actions.openSignedFile(document, "download")}>
              <DownloadSimpleIcon />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!document.verificationLink}
              onSelect={() => actions.openVerification(document)}
            >
              <SealCheckIcon />
              Verification
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {viewDetail}
          </>
        )}

        {document.status === "failed" && (
          <>
            <DropdownMenuItem onSelect={() => actions.retry(document)}>
              <ArrowCounterClockwiseIcon />
              Retry
            </DropdownMenuItem>
            {viewDetail}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => actions.requestDelete(document)}>
              <TrashIcon />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
