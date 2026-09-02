export const PRIORITIES = ["low", "medium", "high"] as const;
export type Priority = (typeof PRIORITIES)[number];

export interface ContactInput {
  name?: unknown;
  company?: unknown;
  role?: unknown;
  where_met?: unknown;
  notes?: unknown;
  priority?: unknown;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  /** Present only when valid: the input narrowed/trimmed to safe values. */
  value?: {
    name?: string;
    company?: string | null;
    role?: string | null;
    where_met?: string | null;
    notes?: string | null;
    priority?: Priority;
  };
}

const OPTIONAL_TEXT_FIELDS = ["company", "role", "where_met", "notes"] as const;

function normalizeOptionalText(input: unknown): string | null | undefined {
  if (input === undefined) return undefined;
  if (input === null) return null;
  if (typeof input !== "string") return undefined;
  const trimmed = input.trim();
  return trimmed.length === 0 ? null : trimmed;
}

/**
 * Validates a contact create/update payload. This is the trusted boundary:
 * it runs server-side before any database write, independent of whatever
 * the browser already checked. `partial: true` allows fields to be omitted
 * (PATCH) but still rejects a present-but-invalid value.
 */
export function validateContactInput(
  input: ContactInput,
  { partial = false }: { partial?: boolean } = {},
): ValidationResult {
  const errors: Record<string, string> = {};
  const value: ValidationResult["value"] = {};

  if (!partial || input.name !== undefined) {
    if (typeof input.name !== "string" || input.name.trim().length === 0) {
      errors.name = "Name is required.";
    } else {
      value.name = input.name.trim();
    }
  }

  if (!partial || input.priority !== undefined) {
    if (
      typeof input.priority !== "string" ||
      !PRIORITIES.includes(input.priority as Priority)
    ) {
      errors.priority = `Priority must be one of: ${PRIORITIES.join(", ")}.`;
    } else {
      value.priority = input.priority as Priority;
    }
  }

  for (const field of OPTIONAL_TEXT_FIELDS) {
    const raw = input[field];
    if (raw === undefined) continue;
    const normalized = normalizeOptionalText(raw);
    if (normalized === undefined) {
      errors[field] = `${field} must be text.`;
    } else {
      value[field] = normalized;
    }
  }

  return { valid: Object.keys(errors).length === 0, errors, value };
}
