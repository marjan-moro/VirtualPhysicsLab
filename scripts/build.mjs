import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { categories, contentLoaders, difficulties, eras, formatDate, kinds, laboratories, neighbors, relatedExperiments, timeline, validateRegistry } from "../src/registry.mjs";
import { escapeHTML, experimentCard, experimentHref, milestoneSections, option, referenceLinks } from "../src/markup.mjs";

const dist = new URL("../dist/", import.meta.url);
const errors = validateRegistry(timeline);
if (errors.length) throw new Error(`Invalid experiment registry:\n${errors.join("\n")}`);

function page({ title, description, root = "./", body, script, stylesheets = [] }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHTML(description)}">
  <meta name="color-scheme" content="light dark">
  <title>${escapeHTML(title)}</title>
  <link rel="stylesheet" href="${root}assets/site.css">
  ${stylesheets.map((stylesheet) => `<link rel="stylesheet" href="${root}assets/${escapeHTML(stylesheet)}">`).join("\n  ")}
  <script type="module" src="${root}assets/${script}"></script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="masthead">
    <div class="container masthead-inner">
      <a class="wordmark" href="${root}">Physics Through Time</a>
      <nav aria-label="Main"><a href="${root}#timeline">Timeline</a></nav>
    </div>
  </header>
  <main id="main" tabindex="-1">${body}</main>
  <footer class="footer"><div class="container">Physics Through Time <a href="${root}#timeline">Browse the timeline</a></div></footer>
</body>
</html>`;
}

const first = timeline.find((entry) => entry.id === "archimedes");
const hero = `<section class="hero">
  <div class="container hero-inner">
    <div class="hero-copy">
      <h1>Physics<br> Through Time</h1>
      <p>Experiments that changed our understanding of the universe.</p>
      <div class="hero-actions">
        <a class="button primary" href="#timeline">Explore the timeline</a>
        <a class="button secondary" href="${experimentHref(first)}#virtual-lab">Open the buoyancy lab</a>
      </div>
    </div>
    <figure class="hero-figure">
      <svg viewBox="0 0 440 280" role="img" aria-labelledby="hero-diagram-title hero-diagram-description">
        <title id="hero-diagram-title">A partially submerged block in equilibrium</title>
        <desc id="hero-diagram-description">The equal length arrows show upward buoyancy and downward weight. With equal forces, the block floats.</desc>
        <defs>
          <pattern id="draft-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="currentColor" opacity=".12"/></pattern>
          <marker id="draft-up" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#82e3e1"/></marker>
          <marker id="draft-down" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#f8ce8e"/></marker>
        </defs>
        <rect x="8" y="8" width="424" height="264" rx="12" fill="url(#draft-grid)" stroke="currentColor" stroke-opacity=".25"/>
        <path d="M33 141H407V233H33Z" fill="#42c4cf" fill-opacity=".13"/>
        <rect x="158" y="84" width="122" height="115" rx="3" fill="#faf1d4" fill-opacity=".14" stroke="#efe7cd" stroke-width="2"/>
        <path d="M33 141H407" stroke="#82e3e1" stroke-width="2" stroke-dasharray="6 4"/>
        <path d="M210 170V77" stroke="#82e3e1" stroke-width="2.5" marker-end="url(#draft-up)"/>
        <path d="M226 142V235" stroke="#f8ce8e" stroke-width="2.5" marker-end="url(#draft-down)"/>
        <text x="209" y="57" text-anchor="middle" fill="#a4eeec">Buoyancy</text>
        <text x="226" y="254" text-anchor="middle" fill="#f8ce8e">Weight</text>
        <text x="44" y="129" fill="#d4eae8">Waterline</text>
      </svg>
      <figcaption>Floating equilibrium · buoyancy equals weight</figcaption>
    </figure>
  </div>
</section>`;

const timelinePage = page({
  title: "Physics Through Time · Interactive Historical Physics Laboratory",
  description: "Browse historical experiments and observations, and explore buoyancy and Earth’s circumference in interactive laboratories.",
  script: "timeline.mjs",
  body: hero + `<section class="container timeline-section" id="timeline" aria-labelledby="timeline-title">
    <div class="section-heading"><h2 id="timeline-title">Experiment timeline</h2>
      <p>Browse experiments and observations by era, discipline, or laboratory availability.</p></div>
    <nav class="era-nav" id="eras" aria-label="Historical eras">
      <button type="button" data-era="" aria-pressed="true">All eras</button>
      ${eras.map(({ id, label }) => `<button type="button" data-era="${id}" aria-pressed="false">${label}</button>`).join("")}
    </nav>
    <form id="filters" class="filters" role="search" aria-label="Find a milestone">
      <label class="search-field">Search <input name="query" type="search" placeholder="Try ‘buoyancy’ or ‘Galileo’"></label>
      <label>Era <select name="era">${option("", "All eras")}${eras.map(({ id, label }) => option(id, label)).join("")}</select></label>
      <label>Category <select name="category">${option("", "All categories")}${Object.entries(categories).map(([id, label]) => option(id, label)).join("")}</select></label>
      <label>Difficulty <select name="difficulty">${option("", "All levels")}${Object.entries(difficulties).map(([id, label]) => option(id, label)).join("")}</select></label>
      <label>Virtual lab <select name="lab">${option("", "All milestones")}${option("available", "Lab available")}${option("unavailable", "Lab unavailable")}</select></label>
      <label>View <select name="view">${option("timeline", "Timeline")}${option("grid", "Grid")}${option("compact", "Compact list")}</select></label>
      <button type="reset" class="text-button">Clear filters</button>
    </form>
    <p id="result-count" class="result-count" role="status">${timeline.length} milestones</p>
    <div id="experiments" data-view="timeline"><noscript><p>Enable JavaScript to filter the timeline.</p></noscript>
      ${milestoneSections(timeline)}
    </div>
  </section>`,
});

function referencesList(references) {
  return `<ul class="reference-list">${referenceLinks(references)}</ul>`;
}

function experimentPage(entry, content) {
  const root = "../../";
  const laboratory = laboratories[entry.laboratory];
  const stylesheets = laboratory ? ["lab.css", laboratory.stylesheet].filter(Boolean) : [];
  const { previous, next } = neighbors(timeline, entry.id);
  const related = relatedExperiments(timeline, entry);
  const sectionIds = new Set();
  for (const section of content) {
    if (!/^[a-z][a-z0-9-]*$/.test(section.id) || sectionIds.has(section.id) ||
        !["explore", "understand", "simulate"].includes(section.level) || !section.paragraphs.length) {
      throw new Error(`Invalid educational section on ${entry.id}: ${section.id}`);
    }
    sectionIds.add(section.id);
  }
  return page({
    title: `${entry.title} · Physics Through Time`,
    description: entry.description,
    root,
    script: "experiment.mjs",
    stylesheets,
    body: `<header class="lesson-header"><div class="container">
      <a class="breadcrumb" href="${root}#timeline">← Experiment timeline</a>
      <div class="lesson-meta">${escapeHTML(formatDate(entry))} · ${escapeHTML(entry.scientists.join(", "))} · ${kinds[entry.kind]}</div>
      <h1>${escapeHTML(entry.title)}</h1>
      <p class="lesson-subtitle">${escapeHTML(entry.subtitle)}</p>
      <div class="category-labels">${entry.categories.map((id) => `<span>${categories[id]}</span>`).join("")}</div>
    </div></header>
    <div class="container lesson">
      <aside class="lesson-sidebar">
        <label for="education-level">Learning level</label>
        <select id="education-level"><option value="explore">Explore</option><option value="understand">Understand</option><option value="simulate">Simulate</option></select>
        <nav aria-label="On this page"><ul>
          ${content.map(({ id, title, level }) => `<li data-level="${level}"><a href="#${id}">${escapeHTML(title)}</a></li>`).join("")}
          ${entry.laboratory ? '<li><a href="#virtual-lab">Virtual laboratory</a></li>' : ""}
          <li><a href="#references">References</a></li>
          ${related.length ? '<li><a href="#related">Related milestones</a></li>' : ""}
        </ul></nav>
      </aside>
      <div class="lesson-body">
        ${content.map(({ id, title, level, paragraphs, equations, references }) => `<section data-level="${level}" id="${id}">
          <h2>${escapeHTML(title)}</h2>
          ${paragraphs.map((paragraph) => `<p>${escapeHTML(paragraph)}</p>`).join("")}
          ${equations?.map(({ text, description }) => `<figure class="equation"><p>${escapeHTML(text)}</p><figcaption>${escapeHTML(description)}</figcaption></figure>`).join("") ?? ""}
          ${references?.length ? referencesList(references) : ""}
        </section>`).join("")}
        ${entry.laboratory ? `<section id="virtual-lab"><h2>Virtual laboratory</h2>
          <div data-laboratory="${entry.laboratory}"><noscript><p>Enable JavaScript to use the laboratory.</p></noscript></div></section>` : ""}
        <section id="references"><h2>References</h2>${referencesList(entry.references)}</section>
        ${related.length ? `<section id="related"><h2>Related milestones</h2><div class="related-list">${related.map((candidate) => experimentCard(candidate, root)).join("")}</div></section>` : ""}
        ${previous || next ? `<nav class="lesson-neighbors" aria-label="Experiment navigation">
          ${previous ? `<a href="${experimentHref(previous, root)}">← ${escapeHTML(previous.title)}</a>` : ""}
          ${next ? `<a href="${experimentHref(next, root)}">${escapeHTML(next.title)} →</a>` : ""}
        </nav>` : ""}
      </div>
    </div>`,
  });
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(new URL("../src/", import.meta.url), new URL("assets/", dist), { recursive: true });
await writeFile(new URL("index.html", dist), timelinePage);
for (const entry of timeline.filter(({ status }) => status === "published")) {
  const { content } = await contentLoaders[entry.id]();
  const folder = new URL(`experiments/${entry.slug}/`, dist);
  await mkdir(folder, { recursive: true });
  await writeFile(new URL("index.html", folder), experimentPage(entry, content));
}
console.log(`Built ${timeline.length} milestones in ${fileURLToPath(dist)}`);
