"use client"

import {
  SIGNATURE_INFO_FONT_SIZE,
  SIGNATURE_INFO_TEXT,
  TEXT_INFO_FONT_SIZE,
  TEXT_INFO_MARGIN,
  getSignatureInfoLines,
} from "@/constants/template"
import { DUMMY_QR_MATRIX, DUMMY_QR_MODULES } from "@/lib/dummy-qr"
import { cn } from "@/lib/utils"

/** Visual content of the editor's draggable boxes. Sizes scale with the page zoom. */

export function SignatureVisual({
  scale,
  isVisualSign,
  label,
}: {
  scale: number
  isVisualSign: boolean
  label: string
}) {
  return (
    <div
      className={cn(
        "border-primary bg-primary/10 text-primary flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-sm border-2 border-dashed font-semibold select-none",
        !isVisualSign && "opacity-50",
      )}
      style={{ fontSize: Math.max(8, 11 * scale) }}
    >
      <span className="leading-tight whitespace-nowrap">
        {isVisualSign ? "[ SIGNATURE ]" : "[ INVISIBLE ]"}
      </span>
      <span className="leading-tight opacity-70" style={{ fontSize: Math.max(7, 8 * scale) }}>
        {label}
      </span>
    </div>
  )
}

export function SignatureInfoVisual({
  scale,
  reason,
  location,
}: {
  scale: number
  reason: string
  location: string
}) {
  const lines = getSignatureInfoLines({ reason, location })
  return (
    <div
      className="h-full w-full overflow-hidden rounded-sm border border-dashed border-slate-400 bg-white/85 text-slate-600 select-none"
      style={{
        fontSize: SIGNATURE_INFO_FONT_SIZE * scale,
        lineHeight: 1.25,
        padding: 2 * scale,
      }}
    >
      {lines.map((line, index) => (
        <p key={index} className={cn("truncate", index === 1 && "font-semibold text-slate-900")}>
          {line}
        </p>
      ))}
    </div>
  )
}

export function QrVisual() {
  return (
    <svg
      viewBox={`0 0 ${DUMMY_QR_MODULES} ${DUMMY_QR_MODULES}`}
      className="h-full w-full bg-white shadow-sm select-none"
      shapeRendering="crispEdges"
      aria-hidden
    >
      {DUMMY_QR_MATRIX.flatMap((row, y) =>
        row.map((filled, x) =>
          filled ? (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#111827" />
          ) : null,
        ),
      )}
    </svg>
  )
}

export function TextInfoVisual({ scale, bgOpacity }: { scale: number; bgOpacity: number }) {
  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-sm border border-dashed border-slate-400 select-none"
      style={{ padding: TEXT_INFO_MARGIN * scale }}
    >
      <div className="absolute inset-0 bg-white" style={{ opacity: bgOpacity / 100 }} />
      <p
        className="relative leading-none whitespace-nowrap text-slate-900"
        style={{ fontSize: TEXT_INFO_FONT_SIZE * scale }}
      >
        {SIGNATURE_INFO_TEXT}
      </p>
    </div>
  )
}
