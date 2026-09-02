import { useState, type FormEvent } from "react";
import type { ContactDraft, Priority } from "../lib/types";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { InlineBanner } from "./StateViews";

const EMPTY_DRAFT: ContactDraft = {
  name: "",
  company: "",
  role: "",
  where_met: "",
  notes: "",
  priority: "medium",
};

export function ContactForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
  serverError,
}: {
  initial?: ContactDraft;
  onSubmit: (draft: ContactDraft) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
  serverError?: string | null;
}) {
  const [draft, setDraft] = useState<ContactDraft>(initial ?? EMPTY_DRAFT);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (draft.name.trim().length === 0) {
      next.name = "Name is required.";
    }
    if (!["low", "medium", "high"].includes(draft.priority)) {
      next.priority = "Priority must be low, medium, or high.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Client-side validation is UX-only, mirroring the rules the backend
    // enforces — the backend response (serverError) is the real source of truth.
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit(draft);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4">
      {serverError && <InlineBanner message={serverError} />}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Name <span className="text-red-500">*</span>
          <Input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            error={!!errors.name}
            required
          />
          {errors.name && <span className="text-xs text-red-600">{errors.name}</span>}
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Priority <span className="text-red-500">*</span>
          <Select
            value={draft.priority}
            onChange={(e) => setDraft({ ...draft, priority: e.target.value as Priority })}
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
          {errors.priority && <span className="text-xs text-red-600">{errors.priority}</span>}
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Company
          <Input value={draft.company} onChange={(e) => setDraft({ ...draft, company: e.target.value })} />
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Role
          <Input value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} />
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700 sm:col-span-2">
          Where you met
          <Input value={draft.where_met} onChange={(e) => setDraft({ ...draft, where_met: e.target.value })} />
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700 sm:col-span-2">
          Notes
          <textarea
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
            rows={3}
            value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
          />
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
