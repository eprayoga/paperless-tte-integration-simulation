"use client"

import { useStoresHydrated } from "@/hooks/use-stores-hydrated"
import { selectDocumentById, useDocumentStore } from "@/stores/document.store"
import { getUsableTemplate, useTemplateStore } from "@/stores/template.store"

/** Document + its usable V2 Custom template, once localStorage has been loaded. */
export function useDocument(id: string) {
  const hydrated = useStoresHydrated()
  const document = useDocumentStore(selectDocumentById(id))
  const template = useTemplateStore((state) =>
    document ? getUsableTemplate(state.templates, document.id, document.fileHash) : undefined,
  )
  return { hydrated, document, template }
}
