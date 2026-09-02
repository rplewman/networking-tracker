import { defineConfig } from "@neon/config/v1";

export default defineConfig({
  // Managed Better Auth + the Data API — required by the networking tracker
  // app (backend/frontend both read the resulting NEON_AUTH_URL /
  // NEON_DATA_API_URL via @neon/env; see README "Environment Variables").
  auth: true,
  dataApi: true,
  // Branch policy: per-branch tuning
  branch: (branch) => {
    if (branch.isDefault) {
      // Default branch: no overrides, uses project defaults
      return {};
    }
    if (!branch.exists) {
      // New non-default branches: auto-expire
      // Run `neon checkout <name>` to create a new branch with these settings
      return { ttl: "7d" };
    }
    // Existing branch: no changes
    return {};
  },
});
