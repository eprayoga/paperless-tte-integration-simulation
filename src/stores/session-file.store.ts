import { create } from "zustand"

/**
 * PDFs the user attached during this tab session, keyed by document id.
 * Deliberately NOT persisted: files are never written to browser storage.
 * After a reload the user re-attaches the file (verified by hash).
 */
type SessionFileState = {
  files: Record<string, File>
  setFile: (documentId: string, file: File) => void
  clearFile: (documentId: string) => void
}

export const useSessionFileStore = create<SessionFileState>()((set) => ({
  files: {},
  setFile: (documentId, file) =>
    set((state) => ({ files: { ...state.files, [documentId]: file } })),
  clearFile: (documentId) =>
    set((state) => {
      const rest = { ...state.files }
      delete rest[documentId]
      return { files: rest }
    }),
}))
