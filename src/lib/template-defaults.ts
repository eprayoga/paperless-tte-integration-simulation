import {
  DEFAULT_QR_SIZE,
  DEFAULT_SIGNATURE_SIZE,
  DEFAULT_TEXT_INFO_BG_OPACITY,
  SIGNATURE_INFO_SIZE,
  TEXT_INFO_SIZE,
} from "@/constants/template"
import { createId } from "@/lib/format"
import type { DocumentItem } from "@/types/document"
import type {
  PageSize,
  SignatureCoordinate,
  TemplateFormValues,
  V2CustomTemplate,
} from "@/types/template"

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max))

/** A signature box near the bottom-right of the page, info block right below it. */
export function createSignatureCoordinate(params: {
  page: number
  pageSize: PageSize
  reason: string
  location: string
}): SignatureCoordinate {
  const { width, height } = DEFAULT_SIGNATURE_SIZE
  const { pageSize } = params
  const lowerLeftX = Math.round(clamp(pageSize.width - width - 50, 0, pageSize.width - width))
  const lowerLeftY = Math.round(
    clamp(120, SIGNATURE_INFO_SIZE.height + 4, pageSize.height - height),
  )

  return {
    id: createId(),
    page: params.page,
    reason: params.reason,
    location: params.location,
    isVisualSign: true,
    lowerLeftX,
    lowerLeftY,
    upperRightX: lowerLeftX + width,
    upperRightY: lowerLeftY + height,
    showSignatureInfo: true,
    signatureInfoX: Math.round(clamp(lowerLeftX, 0, pageSize.width - SIGNATURE_INFO_SIZE.width)),
    signatureInfoY: Math.round(Math.max(0, lowerLeftY - SIGNATURE_INFO_SIZE.height - 4)),
  }
}

/** Defaults mirror the sample payload: QR at (10,10) size 50, text info at (10,60). */
export function createDefaultTemplateValues(
  document: Pick<DocumentItem, "reason" | "location">,
  pageSizes: PageSize[],
): TemplateFormValues {
  const lastPage = pageSizes.length
  const firstPage = pageSizes[0]
  return {
    signatureCoordinates: [
      createSignatureCoordinate({
        page: lastPage,
        pageSize: pageSizes[lastPage - 1],
        reason: document.reason ?? "",
        location: document.location ?? "",
      }),
    ],
    qrRedirectCoordinate: {
      show: true,
      pageMode: "all-page",
      page: null,
      exceptPages: [],
      size: DEFAULT_QR_SIZE,
      x: 10,
      y: 10,
    },
    textInfoCoordinate: {
      show: true,
      page: 1,
      bgOpacity: DEFAULT_TEXT_INFO_BG_OPACITY,
      x: 10,
      y: Math.round(clamp(60, 0, firstPage.height - TEXT_INFO_SIZE.height)),
    },
  }
}

/** Existing template values when they still apply to this PDF, otherwise defaults. */
export function getInitialTemplateValues(
  document: Pick<DocumentItem, "reason" | "location" | "fileHash">,
  pageSizes: PageSize[],
  existing?: V2CustomTemplate,
): TemplateFormValues {
  if (
    existing &&
    existing.fileHash === document.fileHash &&
    existing.pageCount === pageSizes.length
  ) {
    return {
      signatureCoordinates: existing.signatureCoordinates.map((sig) => ({ ...sig })),
      qrRedirectCoordinate: {
        ...existing.qrRedirectCoordinate,
        exceptPages: [...existing.qrRedirectCoordinate.exceptPages],
      },
      textInfoCoordinate: { ...existing.textInfoCoordinate },
    }
  }
  return createDefaultTemplateValues(document, pageSizes)
}
