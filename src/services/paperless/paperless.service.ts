import type { z } from "zod"

import { PAPERLESS_ENDPOINTS } from "@/constants/paperless"
import { ApiError } from "@/lib/api-error"
import { paperlessClient } from "@/services/axios/paperless.client"
import {
  balanceResponseSchema,
  signResponseSchema,
  signStatusResponseSchema,
} from "@/services/paperless/paperless.schemas"
import type {
  SignStatusData,
  SignTransactionData,
  SignV1Payload,
  SignV2CustomPayload,
  SignV2Payload,
} from "@/types/paperless-api"

function parseResponse<T extends z.ZodType>(schema: T, data: unknown): z.output<T> {
  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    throw new ApiError({
      message: "Respons Paperless tidak sesuai format yang diharapkan.",
      status: 502,
    })
  }
  return parsed.data
}

async function sign(endpoint: string, payload: object): Promise<SignTransactionData> {
  const { data } = await paperlessClient.post<unknown>(endpoint, payload)
  return parseResponse(signResponseSchema, data).data
}

export const paperlessService = {
  /** GET {{host}}/integrated/my/balance */
  async getBalance(): Promise<string> {
    const { data } = await paperlessClient.get<unknown>(PAPERLESS_ENDPOINTS.balance)
    return parseResponse(balanceResponseSchema, data).data
  },

  /** POST {{host}}/integrated/sign/mark/self-signing/async */
  signV1(payload: SignV1Payload) {
    return sign(PAPERLESS_ENDPOINTS.signV1, payload)
  },

  /** POST {{host}}/integrated/sign/mark/self-signing-v2 */
  signV2(payload: SignV2Payload) {
    return sign(PAPERLESS_ENDPOINTS.signV2, payload)
  },

  /** POST {{host}}/integrated/sign/mark/self-signing-v2-custom */
  signV2Custom(payload: SignV2CustomPayload) {
    return sign(PAPERLESS_ENDPOINTS.signV2Custom, payload)
  },

  /** GET {{host}}/integrated/sign/mark/self-signing/async/status/{{trxId}} */
  async getSignStatus(trxId: string): Promise<SignStatusData> {
    const { data } = await paperlessClient.get<unknown>(PAPERLESS_ENDPOINTS.signStatus(trxId))
    return parseResponse(signStatusResponseSchema, data).data
  },
}
