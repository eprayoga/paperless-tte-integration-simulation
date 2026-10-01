import type { Metadata } from "next"

import { EditDocumentView } from "@/components/documents/document-form-views"

export const metadata: Metadata = { title: "Edit Document" }

export default async function EditDocumentPage({ params }: PageProps<"/documents/[id]/edit">) {
  const { id } = await params
  return <EditDocumentView id={id} />
}
