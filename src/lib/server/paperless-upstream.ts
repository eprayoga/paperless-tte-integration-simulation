import "server-only";

import { getServerEnv } from "@/lib/server/env";

const UPSTREAM_TIMEOUT_MS = 90_000;

export type UpstreamResult = {
  /** HTTP status to return to the browser. */
  status: number;
  /** Parsed JSON body, or null when Paperless did not answer with JSON. */
  body: unknown;
  unauthorized: boolean;
};

function readBodyStatus(body: unknown): number | undefined {
  if (body && typeof body === "object" && "status" in body) {
    const status = (body as { status: unknown }).status;
    if (typeof status === "number" && status >= 100 && status <= 599)
      return status;
  }
  return undefined;
}

/**
 * Calls Paperless with every required header. customer-key and secret-key come
 * from server env, Authorization from the httpOnly session cookie.
 */
export async function callPaperless(params: {
  method: "GET" | "POST";
  path: string;
  token: string;
  body?: string;
}): Promise<UpstreamResult> {
  const env = getServerEnv();

  const response = await fetch(`${env.PAPERLESS_HOST}/${params.path}`, {
    method: params.method,
    headers: {
      Accept: "application/json",
      ...(params.body !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
      Authorization: params.token,
      "customer-key": env.PAPERLESS_CUSTOMER_KEY,
      "secret-key": env.PAPERLESS_SECRET_KEY,
    },
    body: params.body,
    cache: "no-store",
    redirect: "manual",
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });

  const text = await response.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }

  // Paperless reports errors both via HTTP status and via `status` in the JSON body.
  const bodyStatus = readBodyStatus(body);
  const status =
    response.ok && bodyStatus && bodyStatus >= 400
      ? bodyStatus
      : response.status;

  return { status, body, unauthorized: status === 401 };
}
