"use client"

import { FilePlusIcon, FilesIcon } from "@phosphor-icons/react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { ROUTES } from "@/constants/app"

export function DocumentsEmptyState() {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FilesIcon />
        </EmptyMedia>
        <EmptyTitle>No documents yet</EmptyTitle>
        <EmptyDescription>
          Buat dokumen pertama Anda untuk mencoba integrasi TTE Paperless.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link href={ROUTES.createDocument}>
            <FilePlusIcon />
            Create Document
          </Link>
        </Button>
      </EmptyContent>
    </Empty>
  )
}
