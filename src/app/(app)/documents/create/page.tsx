import type { Metadata } from "next"

import { CreateDocumentView } from "@/components/documents/document-form-views"

export const metadata: Metadata = { title: "Create Document" }

export default function CreateDocumentPage() {
  return <CreateDocumentView />
}
