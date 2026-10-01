import type { Metadata } from "next"

import { DocumentDetailView } from "@/components/documents/document-detail-view"

export const metadata: Metadata = { title: "Document Detail" }

export default async function DocumentDetailPage({ params }: PageProps<"/documents/[id]">) {
  const { id } = await params
  return <DocumentDetailView id={id} />
}
