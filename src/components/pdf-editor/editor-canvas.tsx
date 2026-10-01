"use client"

import dynamic from "next/dynamic"

import { Skeleton } from "@/components/ui/skeleton"

export type {
  EditorCanvasProps,
  EditorElementKey,
} from "@/components/pdf-editor/editor-canvas-impl"

/** pdf.js + react-rnd need the DOM, so the canvas is client-only. */
export const EditorCanvas = dynamic(() => import("@/components/pdf-editor/editor-canvas-impl"), {
  ssr: false,
  loading: () => <Skeleton className="aspect-[1/1.414] w-full" />,
})
