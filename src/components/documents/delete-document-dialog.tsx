"use client"

import { TrashIcon } from "@phosphor-icons/react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { DocumentItem } from "@/types/document"

type DeleteDocumentDialogProps = {
  document: DocumentItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (document: DocumentItem) => void
}

export function DeleteDocumentDialog({
  document,
  open,
  onOpenChange,
  onConfirm,
}: DeleteDocumentDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus dokumen?</AlertDialogTitle>
          <AlertDialogDescription>
            Dokumen <span className="text-foreground font-medium">{document?.title}</span> beserta
            template V2 Custom-nya akan dihapus dari browser ini. Aksi ini tidak dapat dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive/90 text-white"
            onClick={() => document && onConfirm(document)}
          >
            <TrashIcon />
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
