"use client"

import { useCallback, useEffect, useState } from "react"

/** Tracks an element's content width with ResizeObserver. */
export function useElementWidth<T extends HTMLElement>() {
  const [element, setElement] = useState<T | null>(null)
  const [width, setWidth] = useState(0)

  const ref = useCallback((node: T | null) => setElement(node), [])

  useEffect(() => {
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.floor(entry.contentRect.width))
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [element])

  return { ref, width }
}
