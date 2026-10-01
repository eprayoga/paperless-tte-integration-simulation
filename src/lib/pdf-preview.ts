import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib"

import {
  SIGNATURE_INFO_FONT_SIZE,
  SIGNATURE_INFO_SIZE,
  SIGNATURE_INFO_TEXT,
  TEXT_INFO_FONT_SIZE,
  TEXT_INFO_MARGIN,
  TEXT_INFO_SIZE,
  getSignatureInfoLines,
} from "@/constants/template"
import { DUMMY_QR_MATRIX, DUMMY_QR_MODULES } from "@/lib/dummy-qr"
import type { TemplateFormValues } from "@/types/template"

const PRIMARY = rgb(0.18, 0.35, 0.85)
const DARK = rgb(0.1, 0.1, 0.12)
const MUTED = rgb(0.35, 0.37, 0.42)
const WHITE = rgb(1, 1, 1)

function truncateToWidth(text: string, font: PDFFont, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text
  let result = text
  while (result.length > 1 && font.widthOfTextAtSize(`${result}...`, size) > maxWidth) {
    result = result.slice(0, -1)
  }
  return `${result}...`
}

function drawQr(page: PDFPage, x: number, y: number, size: number) {
  const moduleSize = size / DUMMY_QR_MODULES
  page.drawRectangle({ x, y, width: size, height: size, color: WHITE })
  DUMMY_QR_MATRIX.forEach((row, rowIndex) => {
    row.forEach((filled, colIndex) => {
      if (!filled) return
      page.drawRectangle({
        x: x + colIndex * moduleSize,
        // Matrix row 0 is the top of the square; PDF y grows upwards.
        y: y + size - (rowIndex + 1) * moduleSize,
        width: moduleSize,
        height: moduleSize,
        color: DARK,
      })
    })
  })
}

/**
 * Draws the template's dummy signature, signature info, QR and text info on a
 * copy of the PDF, exactly at the PDF coordinates that will be sent to the API.
 */
export async function renderTemplatePreview(
  pdfBytes: ArrayBuffer,
  template: TemplateFormValues,
  options: { signerName?: string } = {},
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBytes, { ignoreEncryption: true })
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold)
  const pages = pdf.getPages()

  for (const sig of template.signatureCoordinates) {
    const page = pages[sig.page - 1]
    if (!page) continue
    const width = sig.upperRightX - sig.lowerLeftX
    const height = sig.upperRightY - sig.lowerLeftY

    page.drawRectangle({
      x: sig.lowerLeftX,
      y: sig.lowerLeftY,
      width,
      height,
      color: PRIMARY,
      opacity: sig.isVisualSign ? 0.12 : 0.04,
      borderColor: PRIMARY,
      borderWidth: 1,
      borderDashArray: [4, 2],
      borderOpacity: sig.isVisualSign ? 1 : 0.4,
    })
    const label = sig.isVisualSign ? "[ SIGNATURE ]" : "[ INVISIBLE ]"
    const labelSize = Math.max(6, Math.min(12, height / 3))
    const labelWidth = bold.widthOfTextAtSize(label, labelSize)
    page.drawText(label, {
      x: sig.lowerLeftX + (width - labelWidth) / 2,
      y: sig.lowerLeftY + (height - labelSize) / 2 + 1,
      size: labelSize,
      font: bold,
      color: PRIMARY,
      opacity: sig.isVisualSign ? 1 : 0.5,
    })

    if (sig.showSignatureInfo) {
      const lines = getSignatureInfoLines({
        signerName: options.signerName,
        reason: sig.reason,
        location: sig.location,
      })
      const lineHeight = SIGNATURE_INFO_FONT_SIZE + 1.5
      lines.forEach((line, index) => {
        page.drawText(
          truncateToWidth(line, font, SIGNATURE_INFO_FONT_SIZE, SIGNATURE_INFO_SIZE.width - 4),
          {
            x: sig.signatureInfoX + 2,
            y: sig.signatureInfoY + SIGNATURE_INFO_SIZE.height - (index + 1) * lineHeight,
            size: SIGNATURE_INFO_FONT_SIZE,
            font: index === 1 ? bold : font,
            color: index === 1 ? DARK : MUTED,
          },
        )
      })
    }
  }

  const qr = template.qrRedirectCoordinate
  if (qr.show) {
    pages.forEach((page, index) => {
      const pageNumber = index + 1
      const visible =
        qr.pageMode === "all-page" ? !qr.exceptPages.includes(pageNumber) : qr.page === pageNumber
      if (visible) drawQr(page, qr.x, qr.y, qr.size)
    })
  }

  const text = template.textInfoCoordinate
  const textPage = pages[text.page - 1]
  if (text.show && textPage) {
    textPage.drawRectangle({
      x: text.x,
      y: text.y,
      width: TEXT_INFO_SIZE.width,
      height: TEXT_INFO_SIZE.height,
      color: WHITE,
      opacity: text.bgOpacity / 100,
    })
    textPage.drawText(SIGNATURE_INFO_TEXT, {
      x: text.x + TEXT_INFO_MARGIN,
      y: text.y + TEXT_INFO_MARGIN + 1,
      size: TEXT_INFO_FONT_SIZE,
      font,
      color: DARK,
    })
  }

  return pdf.save()
}
