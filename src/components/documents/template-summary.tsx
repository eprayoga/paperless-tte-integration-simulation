"use client"

import { formatDateTime } from "@/lib/format"
import type { V2CustomTemplate } from "@/types/template"

export function TemplateSummary({ template }: { template: V2CustomTemplate }) {
  const qr = template.qrRedirectCoordinate
  const text = template.textInfoCoordinate
  const signaturePages = [...new Set(template.signatureCoordinates.map((sig) => sig.page))].sort(
    (a, b) => a - b,
  )
  const qrPosition = `${qr.size}pt · (${Math.round(qr.x)}, ${Math.round(qr.y)})`

  const rows: { label: string; value: string }[] = [
    {
      label: "Signature",
      value: `${template.signatureCoordinates.length} posisi (halaman ${signaturePages.join(", ")})`,
    },
    {
      label: "QR Code",
      value: !qr.show
        ? "Tidak ditampilkan"
        : qr.pageMode === "all-page"
          ? `Semua halaman${qr.exceptPages.length ? `, kecuali ${qr.exceptPages.join(", ")}` : ""} · ${qrPosition}`
          : `Halaman ${qr.page} · ${qrPosition}`,
    },
    {
      label: "Text Info",
      value: text.show
        ? `Halaman ${text.page} · opacity ${text.bgOpacity}% · (${Math.round(text.x)}, ${Math.round(text.y)})`
        : "Tidak ditampilkan",
    },
    { label: "Diperbarui", value: formatDateTime(template.updatedAt) },
  ]

  return (
    <dl className="grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[120px_1fr]">
      {rows.map((row) => (
        <div key={row.label} className="contents">
          <dt className="text-muted-foreground">{row.label}</dt>
          <dd className="font-medium">{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}
