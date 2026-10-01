import { z } from "zod"

/** Runtime checks for the parts of Paperless responses the app depends on. */

const signerSchema = z.object({
  uuid: z.string(),
  name: z.string(),
})

const optionalString = z
  .string()
  .nullish()
  .transform((v) => v ?? undefined)

export const balanceResponseSchema = z.object({
  status: z.number().optional(),
  message: z.string().optional(),
  data: z.union([z.string(), z.number()]).transform(String),
})

export const signResponseSchema = z.object({
  status: z.number().optional(),
  message: z.string().optional(),
  data: z.object({
    trx_id: z.string().min(1),
    status: z.string(),
    signer: signerSchema.optional(),
  }),
})

export const signStatusResponseSchema = z.object({
  status: z.number().optional(),
  message: z.string().optional(),
  data: z.object({
    trx_id: z.string().min(1),
    status: z.string(),
    signer: signerSchema.optional(),
    link: optionalString,
    message: optionalString,
    file: z
      .object({
        serial_number: optionalString,
        download: optionalString,
        preview: optionalString,
      })
      .nullish()
      .transform((v) => v ?? undefined),
  }),
})
