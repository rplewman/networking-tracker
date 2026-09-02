import { test } from "node:test";
import assert from "node:assert/strict";
import { validateContactInput } from "../src/lib/validation.js";

test("rejects a missing name on create", () => {
  const result = validateContactInput({ priority: "high" });
  assert.equal(result.valid, false);
  assert.match(result.errors.name, /required/i);
});

test("rejects a whitespace-only name on create", () => {
  const result = validateContactInput({ name: "   ", priority: "medium" });
  assert.equal(result.valid, false);
  assert.match(result.errors.name, /required/i);
});

test("rejects an invalid priority value", () => {
  const result = validateContactInput({ name: "Ada Lovelace", priority: "urgent" });
  assert.equal(result.valid, false);
  assert.match(result.errors.priority, /low, medium, high/i);
});

test("rejects a missing priority on create", () => {
  const result = validateContactInput({ name: "Ada Lovelace" });
  assert.equal(result.valid, false);
  assert.ok(result.errors.priority);
});

test("accepts a valid full payload and trims/normalizes optional fields", () => {
  const result = validateContactInput({
    name: "  Ada Lovelace  ",
    company: "  ",
    role: "Engineer",
    where_met: undefined,
    notes: "Met at a Berkeley networking event",
    priority: "high",
  });
  assert.equal(result.valid, true);
  assert.deepEqual(result.value, {
    name: "Ada Lovelace",
    company: null,
    role: "Engineer",
    notes: "Met at a Berkeley networking event",
    priority: "high",
  });
});

test("partial mode allows omitted fields but still rejects a present-but-bad priority", () => {
  const okPartial = validateContactInput({ notes: "Follow up next week" }, { partial: true });
  assert.equal(okPartial.valid, true);
  assert.equal(okPartial.value?.name, undefined);

  const badPartial = validateContactInput({ priority: "asap" }, { partial: true });
  assert.equal(badPartial.valid, false);
  assert.ok(badPartial.errors.priority);
});

test("partial mode still rejects an explicit empty name", () => {
  const result = validateContactInput({ name: "" }, { partial: true });
  assert.equal(result.valid, false);
  assert.ok(result.errors.name);
});
