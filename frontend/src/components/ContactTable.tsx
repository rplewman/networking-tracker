import type { Contact, ContactDraft } from "../lib/types";
import { contactToDraft } from "../lib/types";
import { ContactForm } from "./ContactForm";
import { Button } from "./ui/Button";
import { PriorityBadge } from "./ui/Badge";

interface ContactTableProps {
  contacts: Contact[];
  editingId: number | null;
  editError: string | null;
  deletingId: number | null;
  onStartEdit: (id: number) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: number, draft: ContactDraft) => Promise<void>;
  onDelete: (id: number) => void;
}

export function ContactTable({
  contacts,
  editingId,
  editError,
  deletingId,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}: ContactTableProps) {
  return (
    <>
      {/* Desktop / tablet: table layout */}
      <div className="hidden overflow-x-auto rounded-lg border border-slate-200 md:block">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Company</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Where met</th>
              <th className="px-4 py-2">Priority</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {contacts.map((c) =>
              editingId === c.id ? (
                <tr key={c.id}>
                  <td colSpan={6} className="p-3">
                    <ContactForm
                      initial={contactToDraft(c)}
                      onSubmit={(draft) => onSaveEdit(c.id, draft)}
                      onCancel={onCancelEdit}
                      submitLabel="Save changes"
                      serverError={editError}
                    />
                  </td>
                </tr>
              ) : (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                  <td className="px-4 py-3 text-slate-600">{c.company || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{c.role || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{c.where_met || "—"}</td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={c.priority} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => onStartEdit(c.id)}>
                        Edit
                      </Button>
                      <Button variant="danger" onClick={() => onDelete(c.id)} disabled={deletingId === c.id}>
                        {deletingId === c.id ? "Deleting…" : "Delete"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {contacts.map((c) =>
          editingId === c.id ? (
            <ContactForm
              key={c.id}
              initial={contactToDraft(c)}
              onSubmit={(draft) => onSaveEdit(c.id, draft)}
              onCancel={onCancelEdit}
              submitLabel="Save changes"
              serverError={editError}
            />
          ) : (
            <div key={c.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900">{c.name}</p>
                  {(c.role || c.company) && (
                    <p className="text-sm text-slate-500">{[c.role, c.company].filter(Boolean).join(" at ")}</p>
                  )}
                </div>
                <PriorityBadge priority={c.priority} />
              </div>
              {c.where_met && <p className="mt-2 text-sm text-slate-600">Met: {c.where_met}</p>}
              {c.notes && <p className="mt-1 text-sm text-slate-500">{c.notes}</p>}
              <div className="mt-3 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => onStartEdit(c.id)}>
                  Edit
                </Button>
                <Button variant="danger" onClick={() => onDelete(c.id)} disabled={deletingId === c.id}>
                  {deletingId === c.id ? "Deleting…" : "Delete"}
                </Button>
              </div>
            </div>
          ),
        )}
      </div>
    </>
  );
}
