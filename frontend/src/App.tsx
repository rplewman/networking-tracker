import { useCallback, useEffect, useState } from "react";
import { neonAuth } from "./lib/neonAuth";
import { ApiError, createContact, deleteContact, listContacts, updateContact } from "./lib/api";
import type { Contact, ContactDraft, ContactFilters } from "./lib/types";
import { AuthPanel } from "./components/AuthPanel";
import { ContactForm } from "./components/ContactForm";
import { ContactTable } from "./components/ContactTable";
import { FilterSortBar } from "./components/FilterSortBar";
import { EmptyView, ErrorView, InlineBanner, LoadingView } from "./components/StateViews";
import { Button } from "./components/ui/Button";

const DEFAULT_FILTERS: ContactFilters = { sort: "created_at", order: "desc", priority: "", q: "" };

export default function App() {
  const session = neonAuth.auth.useSession();

  if (session.isPending) {
    return <LoadingView label="Loading…" />;
  }

  if (!session.data?.user) {
    return <AuthPanel />;
  }

  return <Dashboard userEmail={session.data.user.email ?? session.data.user.name} />;
}

function Dashboard({ userEmail }: { userEmail: string }) {
  const [filters, setFilters] = useState<ContactFilters>(DEFAULT_FILTERS);
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await listContacts(filters);
      setContacts(data);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Couldn't load contacts.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!banner) return;
    const timer = setTimeout(() => setBanner(null), 3000);
    return () => clearTimeout(timer);
  }, [banner]);

  async function handleCreate(draft: ContactDraft) {
    setCreateError(null);
    try {
      await createContact(draft);
      setShowCreateForm(false);
      setBanner("Contact added.");
      await refresh();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "Couldn't add contact.");
      throw err;
    }
  }

  async function handleSaveEdit(id: number, draft: ContactDraft) {
    setEditError(null);
    try {
      await updateContact(id, draft);
      setEditingId(null);
      setBanner("Contact updated.");
      await refresh();
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : "Couldn't update contact.");
      throw err;
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this contact? This can't be undone.")) return;
    setDeletingId(id);
    try {
      await deleteContact(id);
      setBanner("Contact deleted.");
      setContacts((prev) => prev?.filter((c) => c.id !== id) ?? prev);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "Couldn't delete contact.");
    } finally {
      setDeletingId(null);
    }
  }

  const hasFilters = filters.priority !== "" || filters.q.trim() !== "";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Networking Tracker</h1>
          <p className="text-sm text-slate-500">Signed in as {userEmail}</p>
        </div>
        <Button variant="secondary" onClick={() => neonAuth.auth.signOut()}>
          Sign out
        </Button>
      </header>

      {banner && (
        <div className="mb-4">
          <InlineBanner message={banner} tone="success" />
        </div>
      )}

      <div className="mb-4 flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4">
        <FilterSortBar filters={filters} onChange={setFilters} />
        <div>
          <Button onClick={() => setShowCreateForm((v) => !v)} variant={showCreateForm ? "ghost" : "primary"}>
            {showCreateForm ? "Cancel" : "+ Add contact"}
          </Button>
        </div>
        {showCreateForm && (
          <ContactForm
            onSubmit={handleCreate}
            onCancel={() => {
              setShowCreateForm(false);
              setCreateError(null);
            }}
            submitLabel="Add contact"
            serverError={createError}
          />
        )}
      </div>

      {loading && <LoadingView />}

      {!loading && loadError && <ErrorView message={loadError} onRetry={refresh} />}

      {!loading && !loadError && contacts && contacts.length === 0 && (
        <EmptyView hasFilters={hasFilters} onClearFilters={() => setFilters(DEFAULT_FILTERS)} />
      )}

      {!loading && !loadError && contacts && contacts.length > 0 && (
        <ContactTable
          contacts={contacts}
          editingId={editingId}
          editError={editError}
          deletingId={deletingId}
          onStartEdit={(id) => {
            setEditingId(id);
            setEditError(null);
          }}
          onCancelEdit={() => {
            setEditingId(null);
            setEditError(null);
          }}
          onSaveEdit={handleSaveEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
