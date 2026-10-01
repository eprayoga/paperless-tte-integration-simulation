import { describe, expect, it } from "vitest"

import {
  mapTrxStatus,
  toSignV1Payload,
  toSignV2CustomPayload,
  toSignV2Payload,
  toStatusPatch,
} from "@/services/paperless/paperless.mapper"
import type { TemplateFormValues } from "@/types/template"

const doc = {
  title: "Document Signature Async Test",
  regNumber: "Test-v2-cs-TTE-002",
  keyDoc: "sertifikat-l6RfL",
  reason: "aasdas",
  location: "West Bandung",
}

describe("mapTrxStatus", () => {
  it("maps Paperless statuses to app statuses", () => {
    expect(mapTrxStatus("processing")).toBe("pending")
    expect(mapTrxStatus("completed")).toBe("success")
    expect(mapTrxStatus("failed")).toBe("failed")
    expect(mapTrxStatus("unknown")).toBe("pending")
  })
})

describe("payload builders", () => {
  it("builds the V1 payload with API property names", () => {
    expect(toSignV1Payload(doc, "BASE64")).toEqual({
      title: doc.title,
      regNumber: doc.regNumber,
      key_doc: doc.keyDoc,
      type_ttd: "signature",
      file: "BASE64",
    })
  })

  it("builds the V2 payload with reason and location", () => {
    expect(toSignV2Payload(doc, "BASE64")).toMatchObject({
      reason: "aasdas",
      location: "West Bandung",
      key_doc: doc.keyDoc,
    })
  })

  it("builds the V2 Custom payload exactly like the API sample", () => {
    const template: TemplateFormValues = {
      signatureCoordinates: [
        {
          id: "sig-1",
          page: 1,
          reason: "aasdas",
          location: "West Bandung",
          isVisualSign: true,
          lowerLeftX: 431,
          lowerLeftY: 163,
          upperRightX: 535,
          upperRightY: 202,
          showSignatureInfo: true,
          signatureInfoX: 431,
          signatureInfoY: 163,
        },
      ],
      qrRedirectCoordinate: {
        show: true,
        pageMode: "all-page",
        page: 3,
        exceptPages: [],
        size: 50,
        x: 10,
        y: 10,
      },
      textInfoCoordinate: { show: true, page: 1, bgOpacity: 100, x: 10, y: 60 },
    }

    expect(toSignV2CustomPayload(doc, template, "<base64_pdf>")).toEqual({
      title: "Document Signature Async Test",
      type_ttd: "signature",
      regNumber: "Test-v2-cs-TTE-002",
      key_doc: "sertifikat-l6RfL",
      signature_coordinates: [
        {
          mode: "signature",
          var_reason: "aasdas",
          var_location: "West Bandung",
          is_visual_sign: true,
          page: 1,
          lower_left_x: 431,
          lower_left_y: 163,
          upper_left_x: 535,
          upper_left_y: 202,
          show_signature_info: true,
          signature_info_x: 431,
          signature_info_y: 163,
        },
      ],
      qr_redirect_coordinate: {
        show: true,
        page_mode: "all-page",
        page: null,
        except_pages: [],
        size: 50,
        x: 10,
        y: 10,
      },
      text_info_coordinate: { show: true, page: 1, bg_opacity: 100, x: 10, y: 60 },
      file: "<base64_pdf>",
    })
  })
})

describe("toStatusPatch", () => {
  it("stores verification link and serial number on completed", () => {
    const patch = toStatusPatch({
      trx_id: "b12acab7-9822-4f3b-bc7d-3648c75f8171",
      status: "completed",
      signer: { uuid: "56e7ccaf", name: "Ripendi" },
      link: "https://example.test/verify/abc",
      file: { serial_number: "SN-1", download: "https://d", preview: "https://p" },
    })
    expect(patch).toMatchObject({
      status: "success",
      signerName: "Ripendi",
      verificationLink: "https://example.test/verify/abc",
      serialNumber: "SN-1",
      errorMessage: undefined,
    })
  })

  it("keeps an error message on failed", () => {
    expect(toStatusPatch({ trx_id: "x", status: "failed" }).errorMessage).toBeTruthy()
  })
})
