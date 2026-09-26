/**
 * Serves every `/api/*` route from the Nitro function.
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Before the merge there were two deployments: the Vite/Nitro frontend on
 * Vercel and the Express API on Render. Merging them into one project put
 * the Express app in the same repo as the site -- but Nitro only ever scans
 * `server/routes`, `server/middleware`, `server/api` and `server/plugins`.
 * the Express app was never part of the build, so on Vercel every request to
 * /api/products, /api/categories, /api/auth/*, /api/admin/* and /api/enquiry
 * returned 404: no products, no categories, no testimonials, no admin login.
 *
 * This catch-all closes that gap. `handleApiRequest` and
 * `handleEnquiryRequest` are already framework-agnostic -- they only use
 * `req.method`, `req.url`, `req.headers`, `req.body` and the usual
 * `res.status().json()` surface -- so the adapter below feeds them a
 * request/response pair built from the h3 event and turns the result back into
 * a web `Response`. No route logic is duplicated or rewritten: the exact same
 * functions serve local `npm run dev:api` (Express) and production (Nitro).
 *
 * `server/routes/api/health.get.ts` is more specific, so it still answers
 * GET /api/health by itself.
 */
import { handleApiRequest, handleEnquiryRequest } from "../../../backend/api-core";
import { prisma } from "../../../backend/db";

type CapturedBody = string | Uint8Array | null;

/** Minimal Express-compatible response that records instead of writing. */
class ResponseRecorder {
  statusCode = 200;
  headers = new Headers();
  body: CapturedBody = null;
  headersSent = false;

  status(code: number) {
    this.statusCode = code;
    return this;
  }

  setHeader(name: string, value: string | number | readonly string[]) {
    if (Array.isArray(value)) {
      // Set-Cookie is the only header that legitimately repeats.
      this.headers.delete(name);
      for (const entry of value) this.headers.append(name, String(entry));
    } else {
      this.headers.set(name, String(value));
    }
    return this;
  }

  getHeader(name: string) {
    return this.headers.get(name) ?? undefined;
  }

  json(payload: unknown) {
    this.headers.set("content-type", "application/json; charset=utf-8");
    this.body = JSON.stringify(payload);
    this.headersSent = true;
    return this;
  }

  send(payload: unknown) {
    if (payload instanceof Uint8Array) {
      this.body = payload;
    } else if (typeof payload === "string") {
      this.body = payload;
    } else if (payload != null) {
      this.headers.set("content-type", "application/json; charset=utf-8");
      this.body = JSON.stringify(payload);
    }
    this.headersSent = true;
    return this;
  }

  redirect(status: number | string, location?: string) {
    const [code, target] =
      typeof status === "number" ? [status, location ?? "/"] : [302, status];
    this.statusCode = code;
    this.headers.set("location", target);
    this.headersSent = true;
    return this;
  }

  end(payload?: unknown) {
    if (payload !== undefined) this.send(payload);
    this.headersSent = true;
    return this;
  }

  toResponse(): Response {
    // sendStoredImage sets Content-Length by hand for the Express path. The
    // Response constructor derives it from the body, and a stale or mismatched
    // value is rejected by some runtimes, so drop it here.
    this.headers.delete("content-length");
    // 204/304 must not carry a body.
    const bodyless = this.statusCode === 204 || this.statusCode === 304;
    return new Response(bodyless ? null : this.body, {
      status: this.statusCode,
      headers: this.headers,
    });
  }
}

/** Lowercased plain-object headers, the shape server/auth.ts expects. */
function toPlainHeaders(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key.toLowerCase()] = value;
  });
  return out;
}

async function readJsonBody(request: Request, method: string): Promise<unknown> {
  if (method === "GET" || method === "HEAD") return {};
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return {};
  try {
    const text = await request.text();
    return text ? JSON.parse(text) : {};
  } catch {
    // Malformed JSON: let the route's own schema validation produce the 400.
    return {};
  }
}

/** Same transient-connection set the Express wrapper retries on. */
const transientDbErrorCodes = new Set(["P1001", "P1002", "P1017"]);

function isTransientDbError(error: unknown) {
  if (!error) return false;
  if (
    typeof error === "object" &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string" &&
    transientDbErrorCodes.has((error as { code: string }).code)
  ) {
    return true;
  }
  const message = error instanceof Error ? error.message : String(error);
  return (
    /connection terminated/i.test(message) ||
    /connection.*timed out/i.test(message) ||
    /connection lost/i.test(message)
  );
}

function errorResponse(error: unknown): Response {
  console.error("API error:", error);

  const status =
    typeof error === "object" && error && "statusCode" in error &&
    typeof (error as { statusCode?: unknown }).statusCode === "number"
      ? (error as { statusCode: number }).statusCode
      : // A Zod validation failure is a bad request, not a server fault. The
        // Express wrapper reported these as 500, which made admin form
        // mistakes look like outages.
        typeof error === "object" && error && "issues" in error
        ? 400
        : 500;

  const message =
    status === 400 && typeof error === "object" && error && "issues" in error
      ? "Please check the submitted values and try again."
      : error instanceof Error
        ? error.message
        : "Something went wrong.";

  return new Response(JSON.stringify({ success: false, message }), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export default async function apiCatchAllRoute(event: unknown) {
  // h3 v2 exposes the web Request as `event.req` and a parsed `event.url`
  // (see server/middleware/grok-pwa.ts, which relies on the same shape).
  // Casting here rather than annotating the parameter keeps this assignable to
  // whatever handler signature h3 declares.
  const { req: request, url } = event as unknown as { req: Request; url: URL };
  const method = (request.method ?? "GET").toUpperCase();
  const pathname = url.pathname;
  const body = await readJsonBody(request, method);

  const req = {
    method,
    url: pathname + url.search,
    originalUrl: pathname + url.search,
    path: pathname,
    headers: toPlainHeaders(request.headers),
    body,
    query: Object.fromEntries(url.searchParams.entries()),
  };

  const run = async (): Promise<Response> => {
    const res = new ResponseRecorder();

    // POST /api/enquiry is registered separately in the Express app, so it is
    // not part of handleApiRequest's path table.
    if (pathname.replace(/\/$/, "") === "/api/enquiry") {
      await handleEnquiryRequest(req, res);
      return res.toResponse();
    }

    const handled = await handleApiRequest(req, res);

    if (handled === null && !res.headersSent) {
      return new Response(
        JSON.stringify({ success: false, message: "Not found." }),
        { status: 404, headers: { "content-type": "application/json; charset=utf-8" } },
      );
    }

    return res.toResponse();
  };

  try {
    return await run();
  } catch (error) {
    if (isTransientDbError(error)) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 250));
        await prisma.$connect();
        return await run();
      } catch (retryError) {
        return errorResponse(retryError);
      }
    }
    return errorResponse(error);
  }
}
