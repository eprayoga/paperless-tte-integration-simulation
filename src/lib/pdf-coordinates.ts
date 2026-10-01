/**
 * Conversion between screen space (CSS px, origin top-left, y down) and
 * PDF user space (points, origin bottom-left, y up).
 *
 * The transform is pdf.js `PageViewport.transform` ([a, b, c, d, e, f]), which maps
 * PDF -> viewport and already accounts for scale, page rotation and the page's
 * view box offset. For an unrotated page of height H at scale s it is
 * [s, 0, 0, -s, 0, H * s], i.e. screenY = (H - pdfY) * s.
 */

export type Transform = readonly [number, number, number, number, number, number]

export type Point = { x: number; y: number }

/** Rectangle in screen space (CSS px). */
export type ScreenRect = { left: number; top: number; width: number; height: number }

/** Rectangle in PDF space, described by its lower-left and upper-right corners. */
export type PdfRect = { llx: number; lly: number; urx: number; ury: number }

export function createUnrotatedTransform(pageHeight: number, scale: number): Transform {
  return [scale, 0, 0, -scale, 0, pageHeight * scale]
}

export function pdfToScreenPoint(t: Transform, x: number, y: number): Point {
  return {
    x: t[0] * x + t[2] * y + t[4],
    y: t[1] * x + t[3] * y + t[5],
  }
}

export function screenToPdfPoint(t: Transform, x: number, y: number): Point {
  const det = t[0] * t[3] - t[1] * t[2]
  if (det === 0) throw new Error("Invalid page transform")
  const dx = x - t[4]
  const dy = y - t[5]
  return {
    x: (t[3] * dx - t[2] * dy) / det,
    y: (t[0] * dy - t[1] * dx) / det,
  }
}

export function screenRectToPdfRect(t: Transform, rect: ScreenRect): PdfRect {
  const a = screenToPdfPoint(t, rect.left, rect.top)
  const b = screenToPdfPoint(t, rect.left + rect.width, rect.top + rect.height)
  return {
    llx: Math.min(a.x, b.x),
    lly: Math.min(a.y, b.y),
    urx: Math.max(a.x, b.x),
    ury: Math.max(a.y, b.y),
  }
}

export function pdfRectToScreenRect(t: Transform, rect: PdfRect): ScreenRect {
  const a = pdfToScreenPoint(t, rect.llx, rect.lly)
  const b = pdfToScreenPoint(t, rect.urx, rect.ury)
  const left = Math.min(a.x, b.x)
  const top = Math.min(a.y, b.y)
  return { left, top, width: Math.abs(b.x - a.x), height: Math.abs(b.y - a.y) }
}

/** Rect of a fixed-size PDF box whose bottom-left corner is (x, y). */
export function boxToPdfRect(x: number, y: number, width: number, height: number): PdfRect {
  return { llx: x, lly: y, urx: x + width, ury: y + height }
}

/** The API expects whole points. */
export function roundPdfRect(rect: PdfRect): PdfRect {
  return {
    llx: Math.round(rect.llx),
    lly: Math.round(rect.lly),
    urx: Math.round(rect.urx),
    ury: Math.round(rect.ury),
  }
}
