import type { ContactFilters, Priority, SortField } from "../lib/types";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "created_at", label: "Date added" },
  { value: "name", label: "Name" },
  { value: "priority", label: "Priority" },
  { value: "company", label: "Company" },
];

export function FilterSortBar({
  filters,
  onChange,
}: {
  filters: ContactFilters;
  onChange: (filters: ContactFilters) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex-1">
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Search
          <Input
            placeholder="Name, company, or where you met…"
            value={filters.q}
            onChange={(e) => onChange({ ...filters, q: e.target.value })}
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Priority
          <Select
            value={filters.priority}
            onChange={(e) => onChange({ ...filters, priority: e.target.value as Priority | "" })}
          >
            <option value="">All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-700">
          Sort by
          <Select
            value={filters.sort}
            onChange={(e) => onChange({ ...filters, sort: e.target.value as SortField })}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </label>

        <div className="flex flex-col gap-1 text-sm text-slate-700">
          <span className="opacity-0 select-none">Order</span>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onChange({ ...filters, order: filters.order === "asc" ? "desc" : "asc" })}
            aria-label="Toggle sort order"
          >
            {filters.order === "asc" ? "Ascending ↑" : "Descending ↓"}
          </Button>
        </div>
      </div>
    </div>
  );
}
