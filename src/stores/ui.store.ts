import { create } from "zustand"

export type BusyAction = "signing" | "checking" | "opening"

/** Per-document in-flight action, used to block double submits across the UI. */
type UiState = {
  busy: Record<string, BusyAction>
  startAction: (documentId: string, action: BusyAction) => boolean
  endAction: (documentId: string) => void
}

export const useUiStore = create<UiState>()((set, get) => ({
  busy: {},

  /** Returns false when another action is already running for the document. */
  startAction: (documentId, action) => {
    if (get().busy[documentId]) return false
    set((state) => ({ busy: { ...state.busy, [documentId]: action } }))
    return true
  },

  endAction: (documentId) =>
    set((state) => {
      const rest = { ...state.busy }
      delete rest[documentId]
      return { busy: rest }
    }),
}))
