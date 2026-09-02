import { createClient } from "@neondatabase/neon-js";
import { requireEnv } from "./env.js";

const NEON_DATA_API_URL = requireEnv("NEON_DATA_API_URL");

/**
 * Returns a Data API client scoped to one already-verified caller token.
 *
 * `@neondatabase/neon-js`'s two-URL form (`{ auth: { url }, dataApi: { url } }`)
 * is built around a single client owning a persistent browser session — it
 * calls back into its own `auth` adapter to fetch a token on every request.
 * That model doesn't fit a stateless multi-tenant server: this backend
 * already verified the caller's JWT in `middleware/auth.ts` (against Managed
 * Better Auth's JWKS) and just needs to forward that exact token so Neon's
 * RLS policies apply to *this* request.
 *
 * `neon-js` documents exactly this "bring your own token" case as the
 * external-auth-provider form: omit `auth` and supply `dataApi.getToken`,
 * called lazily per request. We create one lightweight client per request,
 * closing over that request's token, so concurrent requests from different
 * signed-in users can never cross-contaminate.
 */
export function dataApiClientForToken(token: string) {
  return createClient({
    dataApi: {
      url: NEON_DATA_API_URL,
      getToken: async () => token,
    },
  });
}
