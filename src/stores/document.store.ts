import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

import { STORAGE_KEYS } from "@/constants/app"
import { createId } from "@/lib/format"
import type {
  DocumentInput,
  DocumentItem,
  SignResultPatch,
  StatusResultPatch,
} from "@/types/document"

type DocumentState = {
  documents: DocumentItem[]

  addDocument: (input: DocumentInput) => DocumentItem
  updateDocument: (id: string, input: DocumentInput) => void
  removeDocument: (id: string) => void

  /** Sign request accepted by Paperless: draft -> pending. */
  markSubmitted: (id: string, patch: SignResultPatch) => void
  /** Result of a status check. */
  applyStatus: (id: string, patch: StatusResultPatch) => void
  /** Failed -> draft so the user can pick a signing method again. */
  resetForRetry: (id: string) => void
}

export const normalizeRegNumber = (value: string) => value.trim().toLowerCase()

const now = () => new Date().toISOString()

function patchDocument(
  documents: DocumentItem[],
  id: string,
  patch: (doc: DocumentItem) => Partial<DocumentItem>,
): DocumentItem[] {
  return documents.map((doc) => (doc.id === id ? { ...doc, ...patch(doc), updatedAt: now() } : doc))
}

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set) => ({
      documents: [],

      addDocument: (input) => {
        const timestamp = now()
        const document: DocumentItem = {
          ...input,
          id: createId(),
          status: "draft",
          createdAt: timestamp,
          updatedAt: timestamp,
        }
        set((state) => ({ documents: [document, ...state.documents] }))
        return document
      },

      updateDocument: (id, input) =>
        set((state) => ({ documents: patchDocument(state.documents, id, () => input) })),

      removeDocument: (id) =>
        set((state) => ({ documents: state.documents.filter((doc) => doc.id !== id) })),

      markSubmitted: (id, patch) =>
        set((state) => ({
          documents: patchDocument(state.documents, id, () => ({
            ...patch,
            status: "pending",
            errorMessage: undefined,
            verificationLink: undefined,
            serialNumber: undefined,
            submittedAt: now(),
            lastCheckedAt: undefined,
          })),
        })),

      applyStatus: (id, patch) =>
        set((state) => ({
          documents: patchDocument(state.documents, id, (doc) => ({
            status: patch.status,
            trxId: patch.trxId ?? doc.trxId,
            signerUuid: patch.signerUuid ?? doc.signerUuid,
            signerName: patch.signerName ?? doc.signerName,
            verificationLink: patch.verificationLink ?? doc.verificationLink,
            serialNumber: patch.serialNumber ?? doc.serialNumber,
            errorMessage: patch.errorMessage,
            lastCheckedAt: now(),
          })),
        })),

      resetForRetry: (id) =>
        set((state) => ({
          documents: patchDocument(state.documents, id, () => ({
            status: "draft",
            signMethod: undefined,
            trxId: undefined,
            signerUuid: undefined,
            signerName: undefined,
            verificationLink: undefined,
            serialNumber: undefined,
            errorMessage: undefined,
            submittedAt: undefined,
            lastCheckedAt: undefined,
          })),
        })),
    }),
    {
      name: STORAGE_KEYS.documents,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ documents: state.documents }),
      // Rehydrated manually by <StoreHydrator /> to avoid SSR hydration mismatches.
      skipHydration: true,
    },
  ),
)

export function selectDocumentById(id: string) {
  return (state: DocumentState) => state.documents.find((doc) => doc.id === id)
}

export function isRegNumberTaken(
  documents: readonly DocumentItem[],
  regNumber: string,
  excludeId?: string,
): boolean {
  const target = normalizeRegNumber(regNumber)
  return documents.some(
    (doc) => doc.id !== excludeId && normalizeRegNumber(doc.regNumber) === target,
  )
}
