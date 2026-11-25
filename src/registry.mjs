import { experiments } from "./catalog.mjs";

export const eras = [
  { id: "ancient", label: "Ancient and Medieval Physics" },
  { id: "revolution", label: "The Scientific Revolution" },
  { id: "classical", label: "The Age of Classical Physics" },
  { id: "fields", label: "Electromagnetism and Thermodynamics" },
  { id: "quantum", label: "The Quantum and Relativity Revolutions" },
  { id: "particle", label: "Nuclear and Particle Physics" },
  { id: "contemporary", label: "Contemporary Physics" },
];

export const categories = {
  mechanics: "Classical mechanics",
  fluids: "Fluid mechanics",
  solids: "Solid mechanics",
  acoustics: "Acoustics and vibrations",
  thermo: "Thermodynamics",
  optics: "Optics",
  electromagnetism: "Electromagnetism",
  gravitation: "Gravitation",
  "special-relativity": "Special relativity",
  "general-relativity": "General relativity",
  quantum: "Quantum mechanics",
  atomic: "Atomic physics",
  nuclear: "Nuclear physics",
  particle: "Particle physics",
  "condensed-matter": "Condensed matter physics",
  astronomy: "Astronomy and cosmology",
};

export const difficulties = {
  introductory: "Introductory",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const kinds = {
  experiment: "Experiment",
  observation: "Observation",
  theory: "Theoretical milestone",
};

export const contentLoaders = {
  archimedes: () => import("./archimedes-content.mjs"),
};

export const labLoaders = {
  archimedes: () => import("./lab.mjs"),
};

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const yearValid = (year) => Number.isSafeInteger(year) && year !== 0;

export function validateRegistry(entries) {
  const ids = new Set();
  const slugs = new Set();
  const errors = [];
  for (const entry of entries) {
    const report = (message) => errors.push(`${entry.id}: ${message}`);
    if (!slugPattern.test(entry.id) || ids.has(entry.id)) report("invalid or duplicate id");
    if (!slugPattern.test(entry.slug) || slugs.has(entry.slug)) report("invalid or duplicate slug");
    ids.add(entry.id);
    slugs.add(entry.slug);
    for (const field of ["title", "description", "subtitle"]) {
      if (typeof entry[field] !== "string" || !entry[field].trim()) report(`missing ${field}`);
    }
    if (!yearValid(entry.year)) report("invalid start year");
    if (entry.endYear !== undefined && (!yearValid(entry.endYear) || entry.endYear < entry.year)) {
      report("invalid end year");
    }
    if (!eras.some(({ id }) => id === entry.era)) report("unknown era");
    if (!entry.categories?.length || entry.categories.some((category) => !Object.hasOwn(categories, category))) {
      report("unknown or missing categories");
    }
    if (!Object.hasOwn(difficulties, entry.difficulty)) report("unknown difficulty");
    if (!Object.hasOwn(kinds, entry.kind)) report("unknown milestone type");
    if (!entry.scientists?.length) report("missing scientists");
    if (!Array.isArray(entry.keywords) || !Array.isArray(entry.related)) report("missing keywords or related entries");
    if (!["published", "planned"].includes(entry.status)) report("unknown publication status");
    if (entry.status === "published" && !Object.hasOwn(contentLoaders, entry.id)) report("missing published content");
    if (entry.laboratory && (entry.status !== "published" || !Object.hasOwn(labLoaders, entry.laboratory))) {
      report("missing lab module or unpublished lab");
    }
    if (entry.thumbnail && !["src", "alt", "credit", "license", "source"].every((key) => entry.thumbnail[key])) {
      report("missing image or attribution");
    }
    if (!entry.references?.length || entry.references.some(({ label, url }) => !label || !/^https?:\/\/\S+$/.test(url))) {
      report("missing or invalid references");
    }
  }
  for (const entry of entries) {
    for (const id of entry.related ?? []) {
      if (id === entry.id || !ids.has(id)) errors.push(`${entry.id}: invalid related id ${id}`);
    }
  }
  return errors;
}

function displayYear(year) {
  return year < 0 ? `${Math.abs(year)} BCE` : `${year} CE`;
}

export function formatDate({ year, endYear, approximate, displayDate }) {
  if (displayDate) return displayDate;
  const start = endYear > year && Math.sign(year) === Math.sign(endYear)
    ? String(Math.abs(year))
    : displayYear(year);
  const range = endYear > year ? `${start}–${displayYear(endYear)}` : start;
  return approximate ? `c. ${range}` : range;
}

export function chronological(entries) {
  return [...entries].sort((a, b) => a.year - b.year || a.title.localeCompare(b.title, "en"));
}

const normalize = (text) => text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "")
  .replace(/ø/g, "o").replace(/æ/g, "ae").replace(/œ/g, "oe").replace(/ß/g, "ss").replace(/[’']/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

export function filterExperiments(entries, { query = "", era = "", category = "", difficulty = "", lab = "" } = {}) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  return chronological(entries).filter((entry) => {
    if (era && entry.era !== era) return false;
    if (category && !entry.categories.includes(category)) return false;
    if (difficulty && entry.difficulty !== difficulty) return false;
    if (lab === "available" && !entry.laboratory) return false;
    if (lab === "unavailable" && entry.laboratory) return false;
    if (terms.length === 0) return true;
    const searchable = normalize([
      entry.title, entry.subtitle, entry.description, formatDate(entry),
      ...entry.scientists, ...entry.keywords, ...entry.categories.map((id) => categories[id]),
    ].join(" "));
    return terms.every((term) => searchable.includes(term));
  });
}

export const timeline = chronological(experiments);

export function neighbors(entries, id) {
  const published = chronological(entries).filter((entry) => entry.status === "published");
  const index = published.findIndex((entry) => entry.id === id);
  return index < 0 ? {} : { previous: published[index - 1], next: published[index + 1] };
}

export function relatedExperiments(entries, entry) {
  return entry.related.map((id) => entries.find((candidate) => candidate.id === id)).filter(Boolean);
}

export function statusLabel(entry) {
  if (entry.laboratory) return "Virtual lab";
  return entry.status === "published" ? "Educational content" : "Planned";
}
