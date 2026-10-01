import { pdfjs } from "react-pdf"

// Served by the bundler from the pdfjs-dist version react-pdf depends on.
if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString()
}

export { pdfjs }
