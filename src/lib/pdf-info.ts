import type { PageSize } from "@/types/template"

export type PdfInfo = {
  pageCount: number
  /** Unrotated page sizes in points (from the page view box), index 0 = page 1. */
  pageSizes: PageSize[]
}

/** Reads page count and sizes with pdf.js. Browser only. */
export async function readPdfInfo(file: File): Promise<PdfInfo> {
  const { pdfjs } = await import("@/components/pdf/pdf-worker")
  const data = new Uint8Array(await file.arrayBuffer())
  const loadingTask = pdfjs.getDocument({ data })
  try {
    const pdf = await loadingTask.promise
    const pageSizes: PageSize[] = []
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber)
      const [x0, y0, x1, y1] = page.view
      pageSizes.push({ width: x1 - x0, height: y1 - y0 })
    }
    return { pageCount: pdf.numPages, pageSizes }
  } finally {
    await loadingTask.destroy()
  }
}
