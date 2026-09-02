// Vercel Node serverless entry point. Vercel's Node runtime treats a default
// export matching Node's (req, res) handler signature as the function body —
// an Express app satisfies that directly, so no extra adapter is needed.
import app from "../src/app.js";

export default app;
