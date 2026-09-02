import "./loadEnv.js";

import cors from "cors";
import express from "express";
import { requireAuth } from "./middleware/auth.js";
import { contactsRouter } from "./routes/contacts.js";

const FRONTEND_URL = process.env.FRONTEND_URL;

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: FRONTEND_URL ? [FRONTEND_URL] : false,
  }),
);

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/contacts", requireAuth, contactsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found." });
});

export default app;
