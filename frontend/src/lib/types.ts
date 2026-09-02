export type Priority = "low" | "medium" | "high";

export interface Contact {
  id: number;
  user_id: string;
  name: string;
  company: string | null;
  role: string | null;
  where_met: string | null;
  notes: string | null;
  priority: Priority;
  created_at: string;
  updated_at: string;
}

export interface ContactDraft {
  name: string;
  company: string;
  role: string;
  where_met: string;
  notes: string;
  priority: Priority;
}

export type SortField = "name" | "priority" | "company" | "created_at";
export type SortOrder = "asc" | "desc";

export interface ContactFilters {
  sort: SortField;
  order: SortOrder;
  priority: Priority | "";
  q: string;
}

export function contactToDraft(contact: Contact): ContactDraft {
  return {
    name: contact.name,
    company: contact.company ?? "",
    role: contact.role ?? "",
    where_met: contact.where_met ?? "",
    notes: contact.notes ?? "",
    priority: contact.priority,
  };
}
