import type { Metadata } from "next"

import { SignPreviewView } from "@/components/pdf-editor/sign-preview-view"

export const metadata: Metadata = { title: "Preview V2 Custom" }

export default async function SignPreviewPage({
  params,
}: PageProps<"/documents/[id]/sign-preview">) {
  const { id } = await params
  return <SignPreviewView id={id} />
}
