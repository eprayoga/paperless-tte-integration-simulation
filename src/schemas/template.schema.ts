import { z } from "zod"

import {
  MAX_QR_SIZE,
  MIN_QR_SIZE,
  MIN_SIGNATURE_SIZE,
  SIGNATURE_INFO_SIZE,
  TEXT_INFO_SIZE,
} from "@/constants/template"
import { QR_PAGE_MODES, type PageSize } from "@/types/template"

const coordinate = z
  .number({ error: "Harus berupa angka." })
  .finite("Koordinat tidak valid.")
  .min(0, "Koordinat tidak boleh negatif.")

const pageNumber = z
  .number({ error: "Harus berupa angka." })
  .int("Halaman harus bilangan bulat.")
  .min(1, "Halaman minimal 1.")

export const signatureCoordinateSchema = z
  .object({
    id: z.string().min(1),
    page: pageNumber,
    reason: z.string().trim().min(1, "Reason wajib diisi.").max(200, "Maksimal 200 karakter."),
    location: z.string().trim().min(1, "Location wajib diisi.").max(200, "Maksimal 200 karakter."),
    isVisualSign: z.boolean(),
    lowerLeftX: coordinate,
    lowerLeftY: coordinate,
    upperRightX: coordinate,
    upperRightY: coordinate,
    showSignatureInfo: z.boolean(),
    signatureInfoX: coordinate,
    signatureInfoY: coordinate,
  })
  .superRefine((sig, ctx) => {
    if (sig.upperRightX - sig.lowerLeftX < MIN_SIGNATURE_SIZE.width) {
      ctx.addIssue({
        code: "custom",
        path: ["upperRightX"],
        message: `Lebar signature minimal ${MIN_SIGNATURE_SIZE.width}pt (upper X > lower X).`,
      })
    }
    if (sig.upperRightY - sig.lowerLeftY < MIN_SIGNATURE_SIZE.height) {
      ctx.addIssue({
        code: "custom",
        path: ["upperRightY"],
        message: `Tinggi signature minimal ${MIN_SIGNATURE_SIZE.height}pt (upper Y > lower Y).`,
      })
    }
  })

export const qrRedirectCoordinateSchema = z
  .object({
    show: z.boolean(),
    pageMode: z.enum(QR_PAGE_MODES),
    page: pageNumber.nullable(),
    exceptPages: z.array(pageNumber),
    size: z
      .number({ error: "Harus berupa angka." })
      .min(MIN_QR_SIZE, `Ukuran QR minimal ${MIN_QR_SIZE}.`)
      .max(MAX_QR_SIZE, `Ukuran QR maksimal ${MAX_QR_SIZE}.`),
    x: coordinate,
    y: coordinate,
  })
  .superRefine((qr, ctx) => {
    if (qr.pageMode === "specific-page" && qr.page === null) {
      ctx.addIssue({ code: "custom", path: ["page"], message: "Pilih halaman untuk QR." })
    }
    if (new Set(qr.exceptPages).size !== qr.exceptPages.length) {
      ctx.addIssue({
        code: "custom",
        path: ["exceptPages"],
        message: "Halaman tidak boleh duplikat.",
      })
    }
  })

export const textInfoCoordinateSchema = z.object({
  show: z.boolean(),
  page: pageNumber,
  bgOpacity: z
    .number({ error: "Harus berupa angka." })
    .min(0, "Opacity minimal 0.")
    .max(100, "Opacity maksimal 100."),
  x: coordinate,
  y: coordinate,
})

const templateFormSchema = z.object({
  signatureCoordinates: z
    .array(signatureCoordinateSchema)
    .min(1, "Tambahkan minimal satu posisi signature."),
  qrRedirectCoordinate: qrRedirectCoordinateSchema,
  textInfoCoordinate: textInfoCoordinateSchema,
})

export type TemplateSchemaValues = z.infer<typeof templateFormSchema>

type Box = { x: number; y: number; width: number; height: number }

function fitsInPage(box: Box, page: PageSize | undefined): boolean {
  if (!page) return false
  return box.x + box.width <= page.width + 0.5 && box.y + box.height <= page.height + 0.5
}

/** Adds checks that depend on the attached PDF: page range and page bounds. */
export function createTemplateSchema(options: { pageCount: number; pageSizes: PageSize[] }) {
  const { pageCount, pageSizes } = options
  const pageOutOfRange = `Halaman harus antara 1 dan ${pageCount}.`
  const outOfBounds = "Posisi berada di luar area halaman."

  return templateFormSchema.superRefine((values, ctx) => {
    values.signatureCoordinates.forEach((sig, index) => {
      const base = ["signatureCoordinates", index] as const
      if (sig.page > pageCount) {
        ctx.addIssue({ code: "custom", path: [...base, "page"], message: pageOutOfRange })
        return
      }
      const page = pageSizes[sig.page - 1]
      const box = {
        x: sig.lowerLeftX,
        y: sig.lowerLeftY,
        width: sig.upperRightX - sig.lowerLeftX,
        height: sig.upperRightY - sig.lowerLeftY,
      }
      if (!fitsInPage(box, page)) {
        ctx.addIssue({ code: "custom", path: [...base, "lowerLeftX"], message: outOfBounds })
      }
      if (
        sig.showSignatureInfo &&
        !fitsInPage({ x: sig.signatureInfoX, y: sig.signatureInfoY, ...SIGNATURE_INFO_SIZE }, page)
      ) {
        ctx.addIssue({ code: "custom", path: [...base, "signatureInfoX"], message: outOfBounds })
      }
    })

    const qr = values.qrRedirectCoordinate
    if (qr.page !== null && qr.page > pageCount) {
      ctx.addIssue({
        code: "custom",
        path: ["qrRedirectCoordinate", "page"],
        message: pageOutOfRange,
      })
    }
    if (qr.exceptPages.some((page) => page > pageCount)) {
      ctx.addIssue({
        code: "custom",
        path: ["qrRedirectCoordinate", "exceptPages"],
        message: pageOutOfRange,
      })
    }
    if (qr.show) {
      const pages =
        qr.pageMode === "all-page"
          ? pageSizes.filter((_, i) => !qr.exceptPages.includes(i + 1))
          : [pageSizes[(qr.page ?? 1) - 1]]
      const qrBox = { x: qr.x, y: qr.y, width: qr.size, height: qr.size }
      if (pages.some((page) => !fitsInPage(qrBox, page))) {
        ctx.addIssue({ code: "custom", path: ["qrRedirectCoordinate", "x"], message: outOfBounds })
      }
    }

    const text = values.textInfoCoordinate
    if (text.page > pageCount) {
      ctx.addIssue({
        code: "custom",
        path: ["textInfoCoordinate", "page"],
        message: pageOutOfRange,
      })
    } else if (
      text.show &&
      !fitsInPage({ x: text.x, y: text.y, ...TEXT_INFO_SIZE }, pageSizes[text.page - 1])
    ) {
      ctx.addIssue({ code: "custom", path: ["textInfoCoordinate", "x"], message: outOfBounds })
    }
  })
}
