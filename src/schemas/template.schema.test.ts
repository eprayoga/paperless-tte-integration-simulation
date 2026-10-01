import { describe, expect, it } from "vitest"

import { createDefaultTemplateValues } from "@/lib/template-defaults"
import { createTemplateSchema } from "@/schemas/template.schema"

const pageSizes = [
  { width: 595, height: 842 },
  { width: 595, height: 842 },
]
const schema = createTemplateSchema({ pageCount: 2, pageSizes })
const issuePaths = (result: ReturnType<typeof schema.safeParse>) =>
  result.error?.issues.map((issue) => issue.path.join(".")) ?? []

describe("template schema", () => {
  it("accepts the default template", () => {
    const values = createDefaultTemplateValues(
      { reason: "Approve", location: "Bandung" },
      pageSizes,
    )
    expect(schema.safeParse(values).success).toBe(true)
  })

  it("rejects pages out of range, inverted boxes and out-of-page positions", () => {
    const values = createDefaultTemplateValues(
      { reason: "Approve", location: "Bandung" },
      pageSizes,
    )
    const sig = values.signatureCoordinates[0]
    const result = schema.safeParse({
      ...values,
      signatureCoordinates: [
        { ...sig, page: 3 },
        { ...sig, id: "b", upperRightX: sig.lowerLeftX - 1 },
        { ...sig, id: "c", lowerLeftX: 580, upperRightX: 700 },
      ],
    })
    expect(result.success).toBe(false)
    const paths = issuePaths(result)
    expect(paths).toContain("signatureCoordinates.0.page")
    expect(paths).toContain("signatureCoordinates.1.upperRightX")
    expect(paths).toContain("signatureCoordinates.2.lowerLeftX")
  })

  it("requires a page for specific-page QR and reason/location for signatures", () => {
    const values = createDefaultTemplateValues({}, pageSizes)
    const result = schema.safeParse({
      ...values,
      qrRedirectCoordinate: {
        ...values.qrRedirectCoordinate,
        pageMode: "specific-page",
        page: null,
      },
    })
    const paths = issuePaths(result)
    expect(paths).toContain("qrRedirectCoordinate.page")
    expect(paths).toContain("signatureCoordinates.0.reason")
  })
})
