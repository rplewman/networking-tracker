import { Router } from "express";
import { dataApiClientForToken } from "../lib/neonClient.js";
import { PRIORITIES, validateContactInput } from "../lib/validation.js";

export const contactsRouter = Router();

const SORTABLE_FIELDS = new Set(["name", "priority", "company", "created_at"]);

function escapeOrTerm(term: string) {
  // PostgREST's .or() syntax uses "," to separate conditions and "%" as the
  // ilike wildcard delimiter — strip both from user input so a search term
  // can't inject an extra filter condition.
  return term.replace(/[,%]/g, "");
}

// GET /api/contacts?sort=&order=&priority=&q=
contactsRouter.get("/", async (req, res) => {
  const sort = typeof req.query.sort === "string" && SORTABLE_FIELDS.has(req.query.sort)
    ? req.query.sort
    : "created_at";
  const ascending = req.query.order === "asc";
  const priorityFilter = typeof req.query.priority === "string" ? req.query.priority : undefined;
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

  if (priorityFilter && !PRIORITIES.includes(priorityFilter as (typeof PRIORITIES)[number])) {
    res.status(400).json({ error: "Invalid priority filter." });
    return;
  }

  const client = dataApiClientForToken(req.authToken!);
  let query = client.from("contacts").select("*").order(sort, { ascending });

  if (priorityFilter) {
    query = query.eq("priority", priorityFilter);
  }
  if (q) {
    const term = escapeOrTerm(q);
    query = query.or(`name.ilike.%${term}%,company.ilike.%${term}%,where_met.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) {
    res.status(502).json({ error: error.message });
    return;
  }
  res.json({ data });
});

// POST /api/contacts
contactsRouter.post("/", async (req, res) => {
  const result = validateContactInput(req.body ?? {});
  if (!result.valid) {
    res.status(400).json({ error: "Invalid contact.", fields: result.errors });
    return;
  }

  const client = dataApiClientForToken(req.authToken!);
  // user_id is never taken from the request body — it's set by the
  // contacts.user_id column's `default auth.user_id()`.
  const { data, error } = await client.from("contacts").insert(result.value!).select().single();
  if (error) {
    res.status(502).json({ error: error.message });
    return;
  }
  res.status(201).json({ data });
});

// PATCH /api/contacts/:id
contactsRouter.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid contact id." });
    return;
  }

  const result = validateContactInput(req.body ?? {}, { partial: true });
  if (!result.valid) {
    res.status(400).json({ error: "Invalid contact.", fields: result.errors });
    return;
  }
  if (!result.value || Object.keys(result.value).length === 0) {
    res.status(400).json({ error: "No fields to update." });
    return;
  }

  const client = dataApiClientForToken(req.authToken!);
  const { data, error } = await client
    .from("contacts")
    .update(result.value)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) {
    res.status(502).json({ error: error.message });
    return;
  }
  if (!data) {
    // RLS makes another user's row invisible rather than returning 403 —
    // from this account's perspective it simply doesn't exist.
    res.status(404).json({ error: "Contact not found." });
    return;
  }
  res.json({ data });
});

// DELETE /api/contacts/:id
contactsRouter.delete("/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Invalid contact id." });
    return;
  }

  const client = dataApiClientForToken(req.authToken!);
  const { data, error } = await client.from("contacts").delete().eq("id", id).select().maybeSingle();
  if (error) {
    res.status(502).json({ error: error.message });
    return;
  }
  if (!data) {
    res.status(404).json({ error: "Contact not found." });
    return;
  }
  res.status(204).send();
});
