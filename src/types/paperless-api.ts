/** Shapes exactly as the Paperless API sends and expects them (snake_case kept). */

export type PaperlessEnvelope<T> = {
  status: number
  message: string
  data: T
}

export type PaperlessErrorBody = {
  status?: number
  message?: string
  err?: {
    type?: string
    data?: { code?: number }
  }
}

export type PaperlessSigner = {
  uuid: string
  name: string
}

/** Known values: processing | completed | failed. */
export type PaperlessTrxStatus = string

export type SignTransactionData = {
  trx_id: string
  status: PaperlessTrxStatus
  signer?: PaperlessSigner
}

export type SignStatusData = SignTransactionData & {
  link?: string
  file?: {
    serial_number?: string
    download?: string
    preview?: string
  }
  message?: string
}

export type SignV1Payload = {
  title: string
  regNumber: string
  key_doc: string
  type_ttd: "signature"
  file: string
}

export type SignV2Payload = {
  title: string
  reason: string
  location: string
  regNumber: string
  key_doc: string
  type_ttd: "signature"
  file: string
}

export type SignatureCoordinatePayload = {
  mode: "signature"
  var_reason: string
  var_location: string
  is_visual_sign: boolean
  page: number
  lower_left_x: number
  lower_left_y: number
  upper_left_x: number
  upper_left_y: number
  show_signature_info: boolean
  signature_info_x: number
  signature_info_y: number
}

export type QrRedirectCoordinatePayload = {
  show: boolean
  page_mode: "all-page" | "specific-page"
  page: number | null
  except_pages: number[]
  size: number
  x: number
  y: number
}

export type TextInfoCoordinatePayload = {
  show: boolean
  page: number
  bg_opacity: number
  x: number
  y: number
}

export type SignV2CustomPayload = {
  title: string
  type_ttd: "signature"
  regNumber: string
  key_doc: string
  signature_coordinates: SignatureCoordinatePayload[]
  qr_redirect_coordinate: QrRedirectCoordinatePayload
  text_info_coordinate: TextInfoCoordinatePayload
  file: string
}
