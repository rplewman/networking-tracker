import "../src/loadEnv.js";

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Client } from "pg";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set. Copy backend/.env.example to backend/.env.local and fill it in.");
  process.exit(1);
}

const schemaPath = fileURLToPath(new URL("./schema.sql", import.meta.url));
const schema = readFileSync(schemaPath, "utf8");

const client = new Client({ connectionString: DATABASE_URL });

try {
  await client.connect();
  await client.query(schema);
  console.log("Schema applied: contacts table, RLS, and ownership policies are up to date.");
} finally {
  await client.end();
}
