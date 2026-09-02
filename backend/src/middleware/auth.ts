import type { NextFunction, Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { requireEnv } from "../lib/env.js";

const NEON_AUTH_BASE_URL = requireEnv("NEON_AUTH_BASE_URL");
const NEON_AUTH_JWKS_URL = requireEnv("NEON_AUTH_JWKS_URL");

// createRemoteJWKSet caches keys and handles rotation internally.
const jwks = createRemoteJWKSet(new URL(NEON_AUTH_JWKS_URL));

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      /** The caller's raw, verified bearer token — forwarded to the Data API so RLS applies. */
      authToken?: string;
    }
  }
}

/**
 * Verifies the Authorization: Bearer <jwt> header against Managed Better
 * Auth's JWKS. This is defense-in-depth on top of RLS: it lets us return a
 * clean 401 before touching the database, rather than letting an
 * unauthenticated request fall through to a Data API permission error.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing bearer token." });
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  try {
    const { payload } = await jwtVerify(token, jwks, { issuer: new URL(NEON_AUTH_BASE_URL).origin });
    if (!payload.sub) {
      res.status(401).json({ error: "Token is missing a subject claim." });
      return;
    }
    req.userId = payload.sub;
    req.authToken = token;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token." });
  }
}
