import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import { STORAGE_KEYS } from "@/constants/app"
import type { V2CustomTemplate } from "@/types/template"

type TemplateState = {
  templates: Record<string, V2CustomTemplate>
  saveTemplate: (template: Omit<V2CustomTemplate, "updatedAt">) => V2CustomTemplate
  removeTemplate: (documentId: string) => void
}

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set) => ({
      templates: {},

      saveTemplate: (input) => {
        const template: V2CustomTemplate = { ...input, updatedAt: new Date().toISOString() }
        set((state) => ({ templates: { ...state.templates, [input.documentId]: template } }))
        return template
      },

      removeTemplate: (documentId) =>
        set((state) => {
          const rest = { ...state.templates }
          delete rest[documentId]
          return { templates: rest }
        }),
    }),
    {
      name: STORAGE_KEYS.templates,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ templates: state.templates }),
      skipHydration: true,
    },
  ),
)

/**
 * A template is only usable for the exact PDF it was drawn on. When the document's
 * file changes, the stored coordinates no longer apply.
 */
export function getUsableTemplate(
  templates: Record<string, V2CustomTemplate>,
  documentId: string,
  fileHash: string,
): V2CustomTemplate | undefined {
  const template = templates[documentId]
  if (!template || template.fileHash !== fileHash) return undefined
  if (template.signatureCoordinates.length === 0) return undefined
  return template
}
