import type { Metadata } from "next"

import { TemplateEditorView } from "@/components/pdf-editor/template-editor"

export const metadata: Metadata = { title: "Template V2 Custom" }

export default async function DocumentTemplatePage({
  params,
}: PageProps<"/documents/[id]/template">) {
  const { id } = await params
  return <TemplateEditorView id={id} />
}
