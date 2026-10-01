/** All sizes are PDF points (1/72 inch). */

export const SIGNATURE_INFO_TEXT =
  "Dokumen ini telah ditandatangani secara elektronik menggunakan sertifikat elektronik yang diterbitkan oleh Peruri."

/** Text info block: 8pt text with a 10pt margin on every side. */
export const TEXT_INFO_FONT_SIZE = 8
export const TEXT_INFO_MARGIN = 10
/** Width of SIGNATURE_INFO_TEXT in Helvetica 8pt, measured with pdf-lib (404.5pt). */
export const TEXT_INFO_TEXT_WIDTH = 405
export const TEXT_INFO_SIZE = {
  width: TEXT_INFO_TEXT_WIDTH + TEXT_INFO_MARGIN * 2,
  height: Math.ceil(TEXT_INFO_FONT_SIZE * 1.2) + TEXT_INFO_MARGIN * 2,
} as const

/** Signer detail block rendered next to a visual signature. */
export const SIGNATURE_INFO_FONT_SIZE = 6
export const SIGNATURE_INFO_SIZE = { width: 130, height: 34 } as const

export function getSignatureInfoLines(params: {
  signerName?: string
  reason: string
  location: string
}): string[] {
  return [
    "Ditandatangani secara elektronik oleh:",
    params.signerName || "[Nama Penanda Tangan]",
    `Reason: ${params.reason || "-"}`,
    `Location: ${params.location || "-"}`,
  ]
}

/** Defaults taken from the Paperless V2 Custom example payload. */
export const DEFAULT_SIGNATURE_SIZE = { width: 104, height: 39 } as const
export const MIN_SIGNATURE_SIZE = { width: 40, height: 20 } as const
export const DEFAULT_QR_SIZE = 50
export const MIN_QR_SIZE = 20
export const MAX_QR_SIZE = 200
export const DEFAULT_TEXT_INFO_BG_OPACITY = 100
