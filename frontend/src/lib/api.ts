import { neonAuth } from "./neonAuth";
import type { Contact, ContactDraft, ContactFilters } from "./types";

const API_URL = import.meta.env.VITE_API_URL;

export class ApiError extends Error {
  fields?: Record<string, string>;
  status: number;

  constructor(message: string, status: number, fields?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await neonAuth.auth.getSession();
  if (!data?.session?.token) {
    throw new ApiError("You're not signed in.", 401);
  }
  return { Authorization: `Bearer ${data.session.token}` };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...(await authHeader()),
    ...init.headers,
  };

  const response = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(body.error ?? "Request failed.", response.status, body.fields);
  }

  return body as T;
}

export async function listContacts(filters: ContactFilters): Promise<Contact[]> {
  const params = new URLSearchParams({ sort: filters.sort, order: filters.order });
  if (filters.priority) params.set("priority", filters.priority);
  if (filters.q) params.set("q", filters.q);

  const { data } = await request<{ data: Contact[] }>(`/contacts?${params.toString()}`);
  return data;
}

export async function createContact(draft: ContactDraft): Promise<Contact> {
  const { data } = await request<{ data: Contact }>("/contacts", {
    method: "POST",
    body: JSON.stringify(draft),
  });
  return data;
}

export async function updateContact(id: number, draft: Partial<ContactDraft>): Promise<Contact> {
  const { data } = await request<{ data: Contact }>(`/contacts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(draft),
  });
  return data;
}

export async function deleteContact(id: number): Promise<void> {
  await request<void>(`/contacts/${id}`, { method: "DELETE" });
}
