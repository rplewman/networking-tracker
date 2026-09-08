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
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="sm:flex-1">
        <Input
          aria-label="Search"
          placeholder="Search name, company, or where you met…"
          value={filters.q}
          onChange={(e) => onChange({ ...filters, q: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 sm:flex sm:shrink-0">
        <Select
          aria-label="Filter by priority"
          value={filters.priority}
          onChange={(e) => onChange({ ...filters, priority: e.target.value as Priority | "" })}
        >
          <option value="">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </Select>

        <Select
          aria-label="Sort by"
          value={filters.sort}
          onChange={(e) => onChange({ ...filters, sort: e.target.value as SortField })}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>

        <Button
          type="button"
          variant="secondary"
          onClick={() => onChange({ ...filters, order: filters.order === "asc" ? "desc" : "asc" })}
          aria-label="Toggle sort order"
          className="whitespace-nowrap"
        >
          {filters.order === "asc" ? "↑ Asc" : "↓ Desc"}
        </Button>
      </div>
    </div>
  );
}
