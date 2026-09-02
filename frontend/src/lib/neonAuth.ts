import { createClient } from "@neondatabase/neon-js";
import { BetterAuthReactAdapter } from "@neondatabase/neon-js/auth/react/adapters";

/**
 * `@neondatabase/neon-js` two-URL object form: `auth.url` for Managed Better
 * Auth (sign up / sign in / sign out / session), `dataApi.url` for the Neon
 * Data API. This app only uses the `.auth` half from the browser — all
 * contact reads/writes go through the backend (see lib/api.ts) so field
 * validation runs in trusted server code, not just the browser. `dataApi.url`
 * is still wired up correctly (it's a public, non-secret endpoint, and RLS
 * would protect it either way) rather than left pointing at something wrong.
 */
export const neonAuth = createClient({
  auth: {
    url: import.meta.env.VITE_NEON_AUTH_BASE_URL,
    adapter: BetterAuthReactAdapter(),
  },
  dataApi: {
    url: import.meta.env.VITE_NEON_DATA_API_URL,
  },
});
