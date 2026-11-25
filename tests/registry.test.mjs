import assert from "node:assert/strict";
import { test } from "node:test";
import { chronological, filterExperiments, formatDate, neighbors, relatedExperiments, timeline, validateRegistry } from "../src/registry.mjs";

test("catalog covers the first lab and all seven eras", () => {
  assert.deepEqual(validateRegistry(timeline), []);
  assert.ok(timeline.length >= 70);
  assert.equal(new Set(timeline.map(({ era }) => era)).size, 7);
  assert.deepEqual(timeline.filter(({ laboratory }) => laboratory).map(({ id }) => id), ["archimedes"]);
});

test("validation catches duplicate keys, a year zero, and missing relations", () => {
  const entry = timeline[0];
  const messages = validateRegistry([entry, { ...entry, year: 0, related: ["missing"] }]).join("\n");
  assert.match(messages, /duplicate id/);
  assert.match(messages, /duplicate slug/);
  assert.match(messages, /invalid start year/);
  assert.match(messages, /invalid related id missing/);
});

test("chronology and date labels use signed historical years without year zero", () => {
  const years = [1, -1, -250, 1666];
  assert.deepEqual(chronological(years.map((year) => ({ year }))).map(({ year }) => year), [-250, -1, 1, 1666]);
  assert.equal(formatDate({ year: -250, endYear: -220, approximate: true }), "c. 250–220 BCE");
  assert.equal(formatDate({ year: -2, endYear: 2 }), "2 BCE–2 CE");
  assert.equal(formatDate({ year: 1666 }), "1666 CE");
});

test("search combines accent-insensitive terms with independent filters", () => {
  assert.ok(filterExperiments(timeline, { query: "romer light" }).length > 0);
  assert.equal(filterExperiments(timeline, { era: "ancient", category: "fluids", lab: "available", difficulty: "introductory" })[0]?.id, "archimedes");
  assert.equal(filterExperiments(timeline, { era: "contemporary", lab: "available" }).length, 0);
  assert.equal(filterExperiments(timeline, { query: "nonexistent physics title" }).length, 0);
});

test("navigation skips planned experiments and keeps related entries detectable", () => {
  const published = { id: "example", title: "Published lesson", status: "published", year: 2000 };
  const archimedes = timeline.find(({ id }) => id === "archimedes");
  assert.equal(neighbors([...timeline, published], "archimedes").next, published);
  assert.equal(neighbors(timeline, "archimedes").next, undefined);
  assert.deepEqual(neighbors(timeline, "missing"), {});
  assert.equal(relatedExperiments(timeline, archimedes).length, archimedes.related.length);
});
