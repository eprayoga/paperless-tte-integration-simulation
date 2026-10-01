import { describe, expect, it } from "vitest"

import {
  createUnrotatedTransform,
  pdfRectToScreenRect,
  pdfToScreenPoint,
  roundPdfRect,
  screenRectToPdfRect,
  screenToPdfPoint,
  type Transform,
} from "@/lib/pdf-coordinates"

const A4 = { width: 595, height: 842 }

describe("pdf coordinates (origin bottom-left)", () => {
  it("maps the PDF origin to the bottom-left corner of the screen page", () => {
    const t = createUnrotatedTransform(A4.height, 1)
    expect(pdfToScreenPoint(t, 0, 0)).toEqual({ x: 0, y: A4.height })
    expect(pdfToScreenPoint(t, 0, A4.height)).toEqual({ x: 0, y: 0 })
  })

  it("converts a screen rect to the sample V2 Custom signature rect", () => {
    const scale = 1.5
    const t = createUnrotatedTransform(A4.height, scale)
    // Signature from the API sample: lower-left (431,163), upper (535,202).
    const screen = {
      left: 431 * scale,
      top: (A4.height - 202) * scale,
      width: (535 - 431) * scale,
      height: (202 - 163) * scale,
    }
    expect(roundPdfRect(screenRectToPdfRect(t, screen))).toEqual({
      llx: 431,
      lly: 163,
      urx: 535,
      ury: 202,
    })
  })

  it("round-trips PDF -> screen -> PDF at any zoom", () => {
    for (const scale of [0.5, 1, 1.37, 2]) {
      const t = createUnrotatedTransform(A4.height, scale)
      const rect = { llx: 10, lly: 60, urx: 435, ury: 90 }
      const back = screenRectToPdfRect(t, pdfRectToScreenRect(t, rect))
      expect(back.llx).toBeCloseTo(rect.llx)
      expect(back.lly).toBeCloseTo(rect.lly)
      expect(back.urx).toBeCloseTo(rect.urx)
      expect(back.ury).toBeCloseTo(rect.ury)
    }
  })

  it("inverts a rotated viewport transform (pdf.js 90° rotation)", () => {
    // pdf.js viewport transform for rotation=90, scale=1, viewBox [0,0,595,842].
    const t: Transform = [0, 1, 1, 0, 0, 0]
    const screen = pdfToScreenPoint(t, 100, 200)
    const back = screenToPdfPoint(t, screen.x, screen.y)
    expect(back.x).toBeCloseTo(100)
    expect(back.y).toBeCloseTo(200)
  })
})
