import { Button } from "./ui/Button";

export function LoadingView({ label = "Loading contacts…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
      {label}
    </div>
  );
}

export function EmptyView({
  hasFilters,
  onClearFilters,
}: {
  hasFilters: boolean;
  onClearFilters: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-300 py-16 text-center text-sm text-slate-500">
      {hasFilters ? (
        <>
          <p>No contacts match your current search/filter.</p>
          <Button variant="ghost" onClick={onClearFilters}>
            Clear filters
          </Button>
        </>
      ) : (
        <p>No contacts yet — add the first person you want to stay in touch with.</p>
      )}
    </div>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-lg border border-red-200 bg-red-50 py-10 text-center text-sm text-red-700"
    >
      <p>{message}</p>
      <Button variant="secondary" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

export function InlineBanner({ message, tone = "error" }: { message: string; tone?: "error" | "success" }) {
  const toneClasses =
    tone === "error"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-md border px-3 py-2 text-sm ${toneClasses}`}>
      {message}
    </div>
  );
}
