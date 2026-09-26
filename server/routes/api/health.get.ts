/**
 * GET /api/health
 *
 * Plain h3 route handler -- no `h3` import. `h3` is not a declared dependency
 * of this project (it arrives transitively through nitro), and
 * server/middleware/grok-pwa.ts shows the pattern that is already shipping:
 * export a function, return a web Response.
 */
export default async function healthRoute() {
  return new Response(
    JSON.stringify({ success: true, message: "API is running" }),
    {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
    },
  );
}
