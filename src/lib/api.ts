/**
 * Kept as an alias only.
 *
 * `src/lib/api.ts` and `src/lib/api-url.ts` were byte-for-byte copies of the
 * same three helpers, and different files imported different copies
 * (`src/routes/admin/reviews.tsx` used this one, everything else used
 * `api-url.ts`). Two copies of URL-resolution logic is one copy too many: the
 * SSR absolute-url fix would have landed in one of them and silently skipped
 * whichever callers imported the other.
 *
 * `api-url.ts` is now the single implementation. This module re-exports it so
 * existing imports keep working.
 */
export { API_BASE_URL, apiResourceUrl, apiUrl } from "./api-url";
