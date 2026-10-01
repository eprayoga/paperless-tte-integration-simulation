import { describe, expect, it } from "vitest"

import { isAllowedPaperlessRoute } from "@/lib/server/paperless-routes"

const split = (path: string) => path.split("/")
const TRX_ID = "b12acab7-9822-4f3b-bc7d-3648c75f8171"

describe("paperless proxy allowlist", () => {
  it("allows the documented endpoints with the right method", () => {
    expect(isAllowedPaperlessRoute("GET", split("integrated/my/balance"))).toBe(true)
    expect(
      isAllowedPaperlessRoute("POST", split("integrated/sign/mark/self-signing/async")),
    ).toBe(true)
    expect(
      isAllowedPaperlessRoute("POST", split("integrated/sign/mark/self-signing-v2")),
    ).toBe(true)
    expect(
      isAllowedPaperlessRoute("POST", split("integrated/sign/mark/self-signing-v2-custom")),
    ).toBe(true)
    expect(
      isAllowedPaperlessRoute(
        "GET",
        split(`integrated/sign/mark/self-signing/async/status/${TRX_ID}`),
      ),
    ).toBe(true)
  })

  it("rejects other methods, paths and traversal", () => {
    expect(isAllowedPaperlessRoute("POST", split("integrated/my/balance"))).toBe(false)
    expect(isAllowedPaperlessRoute("GET", split("integrated/admin/users"))).toBe(false)
    expect(
      isAllowedPaperlessRoute("GET", split("integrated/sign/mark/self-signing/async/status/..")),
    ).toBe(false)
    expect(
      isAllowedPaperlessRoute("GET", split("integrated/sign/mark/self-signing/async/status/abc")),
    ).toBe(false)
  })
})
