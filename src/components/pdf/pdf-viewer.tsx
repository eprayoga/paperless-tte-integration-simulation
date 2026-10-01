"use client"

import dynamic from "next/dynamic"

import { Skeleton } from "@/components/ui/skeleton"

/** pdf.js needs browser APIs, so the viewer is client-only. */
export const PdfViewer = dynamic(() => import("@/components/pdf/pdf-viewer-impl"), {
  ssr: false,
  loading: () => <Skeleton className="aspect-[1/1.414] w-full" />,
})
