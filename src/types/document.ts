export const DOCUMENT_STATUSES = ["draft", "pending", "success", "failed"] as const
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number]

export const SIGN_METHODS = ["v1", "v2", "v2-custom"] as const
export type SignMethod = (typeof SIGN_METHODS)[number]

/**
 * A demo document kept in localStorage.
 * The PDF itself is never persisted: only its name, size and SHA-256 hash, so the
 * user re-attaches the same file when signing and we can verify it matches.
 */
export type DocumentItem = {
  id: string

  title: string
  regNumber: string
  keyDoc: string

  reason?: string
  location?: string

  fileName: string
  fileSize: number
  fileHash: string

  status: DocumentStatus
  signMethod?: SignMethod

  trxId?: string
  signerUuid?: string
  signerName?: string

  verificationLink?: string
  serialNumber?: string

  errorMessage?: string
  submittedAt?: string
  lastCheckedAt?: string

  createdAt: string
  updatedAt: string
}

export type DocumentInput = Pick<
  DocumentItem,
  "title" | "regNumber" | "keyDoc" | "reason" | "location" | "fileName" | "fileSize" | "fileHash"
>

/** Fields written after a successful sign request (trx_id + signer). */
export type SignResultPatch = Pick<DocumentItem, "trxId" | "signerUuid" | "signerName"> & {
  signMethod: SignMethod
}

/** Fields written after a status check. */
export type StatusResultPatch = Pick<
  DocumentItem,
  | "status"
  | "trxId"
  | "signerUuid"
  | "signerName"
  | "verificationLink"
  | "serialNumber"
  | "errorMessage"
>
