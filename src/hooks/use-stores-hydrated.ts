"use client"

import { useEffect, useSyncExternalStore } from "react"

import { useDocumentStore } from "@/stores/document.store"
import { useTemplateStore } from "@/stores/template.store"

const persistedStores = [useDocumentStore.persist, useTemplateStore.persist]

function subscribe(onChange: () => void) {
  const unsubscribers = persistedStores.map((store) => store.onFinishHydration(onChange))
  return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
}

const getSnapshot = () => persistedStores.every((store) => store.hasHydrated())
const getServerSnapshot = () => false

/** True once documents and templates have been loaded from localStorage. */
export function useStoresHydrated(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/**
 * Loads persisted stores after mount (they use `skipHydration`) and keeps
 * other tabs in sync when localStorage changes.
 */
export function useRehydrateStores() {
  useEffect(() => {
    persistedStores.forEach((store) => {
      if (!store.hasHydrated()) void store.rehydrate()
    })

    const onStorage = (event: StorageEvent) => {
      persistedStores.forEach((store) => {
        if (event.key === store.getOptions().name) void store.rehydrate()
      })
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])
}
