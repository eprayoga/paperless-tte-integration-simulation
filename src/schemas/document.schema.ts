import { z } from "zod"

import { MAX_PDF_SIZE_BYTES } from "@/constants/app"
import { formatFileSize } from "@/lib/file"
import { isRegNumberTaken } from "@/stores/document.store"
import { DOCUMENT_STATUSES, SIGN_METHODS, type DocumentItem } from "@/types/document"

export const documentStatusSchema = z.enum(DOCUMENT_STATUSES)
export const signMethodSchema = z.enum(SIGN_METHODS)

export const DUPLICATE_REG_NUMBER_MESSAGE = "Registration number sudah digunakan."

const pdfFileSchema = z
  .custom<File>((value) => typeof File !== "undefined" && value instanceof File, {
    message: "File PDF wajib diunggah.",
  })
  .refine((file) => file.type === "application/pdf", {
    message: "File harus berformat PDF (application/pdf).",
  })
  .refine((file) => file.size > 0, { message: "File kosong." })
  .refine((file) => file.size <= MAX_PDF_SIZE_BYTES, {
    message: `Ukuran file maksimal ${formatFileSize(MAX_PDF_SIZE_BYTES)}.`,
  })

const baseDocumentSchema = z.object({
  title: z.string().trim().min(1, "Title wajib diisi.").max(200, "Maksimal 200 karakter."),
  regNumber: z
    .string()
    .trim()
    .min(1, "Registration number wajib diisi.")
    .max(100, "Maksimal 100 karakter."),
  keyDoc: z.string().trim().min(1, "Key document wajib diisi.").max(200, "Maksimal 200 karakter."),
  file: pdfFileSchema.optional(),
})

export const signV2Schema = z.object({
  reason: z.string().trim().min(1, "Reason wajib diisi.").max(200, "Maksimal 200 karakter."),
  location: z.string().trim().min(1, "Location wajib diisi.").max(200, "Maksimal 200 karakter."),
})

export type SignV2FormValues = z.infer<typeof signV2Schema>

export type DocumentFormValues = z.input<typeof baseDocumentSchema>
export type DocumentFormOutput = z.output<typeof baseDocumentSchema>

/**
 * @param documents existing documents, for the unique regNumber rule
 * @param editingId document being edited (excluded from the uniqueness check)
 * @param requireFile true on create; on edit the existing file is kept when empty
 */
export function createDocumentSchema(options: {
  documents: readonly DocumentItem[]
  editingId?: string
  requireFile: boolean
}) {
  return baseDocumentSchema.superRefine((values, ctx) => {
    if (isRegNumberTaken(options.documents, values.regNumber, options.editingId)) {
      ctx.addIssue({ code: "custom", path: ["regNumber"], message: DUPLICATE_REG_NUMBER_MESSAGE })
    }
    if (options.requireFile && !values.file) {
      ctx.addIssue({ code: "custom", path: ["file"], message: "File PDF wajib diunggah." })
    }
  })
}
