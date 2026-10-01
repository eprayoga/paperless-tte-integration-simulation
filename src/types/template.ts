/**
 * V2 Custom template. Every coordinate is in PDF user space:
 * points, origin (0,0) at the bottom-left of the page, y grows upwards.
 */

export type SignatureCoordinate = {
  id: string
  page: number
  /** Sent as `var_reason`. */
  reason: string
  /** Sent as `var_location`. */
  location: string
  isVisualSign: boolean
  lowerLeftX: number
  lowerLeftY: number
  /** Upper-right corner. The API names these `upper_left_x/upper_left_y`. */
  upperRightX: number
  upperRightY: number
  showSignatureInfo: boolean
  /** Bottom-left of the signature info block. */
  signatureInfoX: number
  signatureInfoY: number
}

export const QR_PAGE_MODES = ["all-page", "specific-page"] as const
export type QrPageMode = (typeof QR_PAGE_MODES)[number]

export type QrRedirectCoordinate = {
  show: boolean
  pageMode: QrPageMode
  page: number | null
  exceptPages: number[]
  size: number
  /** Bottom-left of the QR square. */
  x: number
  y: number
}

export type TextInfoCoordinate = {
  show: boolean
  page: number
  bgOpacity: number
  /** Bottom-left of the text info block. */
  x: number
  y: number
}

export type PageSize = { width: number; height: number }

export type V2CustomTemplate = {
  documentId: string
  /** Hash of the PDF the template was drawn on. A different file invalidates it. */
  fileHash: string
  pageCount: number
  /** Unrotated page sizes in points, index 0 = page 1. */
  pageSizes: PageSize[]

  signatureCoordinates: SignatureCoordinate[]
  qrRedirectCoordinate: QrRedirectCoordinate
  textInfoCoordinate: TextInfoCoordinate

  updatedAt: string
}

export type TemplateFormValues = Pick<
  V2CustomTemplate,
  "signatureCoordinates" | "qrRedirectCoordinate" | "textInfoCoordinate"
>
