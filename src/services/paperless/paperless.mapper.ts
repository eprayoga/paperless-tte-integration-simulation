import { TYPE_TTD } from "@/constants/paperless"
import type {
  DocumentItem,
  DocumentStatus,
  SignMethod,
  SignResultPatch,
  StatusResultPatch,
} from "@/types/document"
import type {
  PaperlessTrxStatus,
  SignStatusData,
  SignTransactionData,
  SignV1Payload,
  SignV2CustomPayload,
  SignV2Payload,
} from "@/types/paperless-api"
import type { V2CustomTemplate } from "@/types/template"

/**
 * processing -> pending, completed -> success, failed -> failed.
 * Unknown values are treated as still in progress.
 */
export function mapTrxStatus(status: PaperlessTrxStatus): Exclude<DocumentStatus, "draft"> {
  switch (status.toLowerCase()) {
    case "completed":
      return "success"
    case "failed":
      return "failed"
    default:
      return "pending"
  }
}

type SignableDocument = Pick<DocumentItem, "title" | "regNumber" | "keyDoc" | "reason" | "location">

export function toSignV1Payload(doc: SignableDocument, fileBase64: string): SignV1Payload {
  return {
    title: doc.title,
    regNumber: doc.regNumber,
    key_doc: doc.keyDoc,
    type_ttd: TYPE_TTD,
    file: fileBase64,
  }
}

export function toSignV2Payload(doc: SignableDocument, fileBase64: string): SignV2Payload {
  return {
    title: doc.title,
    reason: doc.reason ?? "",
    location: doc.location ?? "",
    regNumber: doc.regNumber,
    key_doc: doc.keyDoc,
    type_ttd: TYPE_TTD,
    file: fileBase64,
  }
}

export function toSignV2CustomPayload(
  doc: SignableDocument,
  template: Pick<
    V2CustomTemplate,
    "signatureCoordinates" | "qrRedirectCoordinate" | "textInfoCoordinate"
  >,
  fileBase64: string,
): SignV2CustomPayload {
  const qr = template.qrRedirectCoordinate
  const text = template.textInfoCoordinate
  const isAllPage = qr.pageMode === "all-page"

  return {
    title: doc.title,
    type_ttd: TYPE_TTD,
    regNumber: doc.regNumber,
    key_doc: doc.keyDoc,
    signature_coordinates: template.signatureCoordinates.map((sig) => ({
      mode: "signature",
      var_reason: sig.reason,
      var_location: sig.location,
      is_visual_sign: sig.isVisualSign,
      page: sig.page,
      lower_left_x: Math.round(sig.lowerLeftX),
      lower_left_y: Math.round(sig.lowerLeftY),
      // The API calls the upper-right corner `upper_left_*` (see the sample payload).
      upper_left_x: Math.round(sig.upperRightX),
      upper_left_y: Math.round(sig.upperRightY),
      show_signature_info: sig.showSignatureInfo,
      signature_info_x: Math.round(sig.signatureInfoX),
      signature_info_y: Math.round(sig.signatureInfoY),
    })),
    qr_redirect_coordinate: {
      show: qr.show,
      page_mode: qr.pageMode,
      page: isAllPage ? null : qr.page,
      except_pages: isAllPage ? [...qr.exceptPages].sort((a, b) => a - b) : [],
      size: Math.round(qr.size),
      x: Math.round(qr.x),
      y: Math.round(qr.y),
    },
    text_info_coordinate: {
      show: text.show,
      page: text.page,
      bg_opacity: Math.round(text.bgOpacity),
      x: Math.round(text.x),
      y: Math.round(text.y),
    },
    file: fileBase64,
  }
}

export function toSignResultPatch(data: SignTransactionData, method: SignMethod): SignResultPatch {
  return {
    signMethod: method,
    trxId: data.trx_id,
    signerUuid: data.signer?.uuid,
    signerName: data.signer?.name,
  }
}

export function toStatusPatch(data: SignStatusData): StatusResultPatch {
  const status = mapTrxStatus(data.status)
  return {
    status,
    trxId: data.trx_id,
    signerUuid: data.signer?.uuid,
    signerName: data.signer?.name,
    verificationLink: data.link,
    serialNumber: data.file?.serial_number,
    errorMessage:
      status === "failed" ? (data.message ?? "Proses TTE gagal di Paperless.") : undefined,
  }
}
