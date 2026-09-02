// Side-effecting module: must be the FIRST import in any entry point.
// ES module imports are evaluated depth-first in source order, so importing
// this before anything else guarantees process.env is populated before
// other modules' top-level `requireEnv(...)` calls run.
import { config } from "dotenv";

config({ path: ".env.local" });
