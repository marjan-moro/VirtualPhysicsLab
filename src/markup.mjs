import { categories, difficulties, eras, formatDate, kinds, statusLabel } from "./registry.mjs";

export function escapeHTML(value) {
  const characters = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(value).replace(/[&<>"']/g, (character) => characters[character]);
}

export const experimentHref = (entry, root = "./") => `${root}experiments/${entry.slug}/`;

export function referenceLinks(references) {
  return references.map(({ url, label }) => `<li><a href="${escapeHTML(url)}">${escapeHTML(label)}</a></li>`).join("");
}

export function experimentCard(entry, root = "./", heading = "h3") {
  const title = escapeHTML(entry.title);
  const name = entry.status === "published" ? `<a href="${experimentHref(entry, root)}">${title}</a>` : title;
  const thumbnail = entry.thumbnail
    ? `<figure><img loading="lazy" src="${escapeHTML(root + entry.thumbnail.src)}" alt="${escapeHTML(entry.thumbnail.alt)}">
        <figcaption><a href="${escapeHTML(entry.thumbnail.source)}">${escapeHTML(entry.thumbnail.credit)}</a> · ${escapeHTML(entry.thumbnail.license)}</figcaption></figure>`
    : "";
  return `<article class="experiment-card">
    <div class="entry-meta">
      <span class="entry-date">${escapeHTML(formatDate(entry))}</span>
      <span class="status${entry.laboratory ? " status-lab" : ""}">${statusLabel(entry)}</span>
    </div>
    <${heading} class="entry-title">${name}</${heading}>
    ${thumbnail}
    <p>${escapeHTML(entry.description)}</p>
    <div class="entry-details">
      <span>${escapeHTML(entry.scientists.join(", "))}</span>
      <span>${kinds[entry.kind]} · ${difficulties[entry.difficulty]}</span>
      <span>${eras.find(({ id }) => id === entry.era).label}</span>
    </div>
    <div class="category-labels">${entry.categories.map((id) => `<span>${categories[id]}</span>`).join("")}</div>
    ${entry.status === "planned" ? `<details class="entry-source"><summary>Historical source</summary><ul>${referenceLinks(entry.references)}</ul></details>` : ""}
  </article>`;
}

export function option(value, label) {
  return `<option value="${escapeHTML(value)}">${escapeHTML(label)}</option>`;
}

export function milestoneSections(entries) {
  const periods = new Map();
  for (const entry of entries) {
    const startYear = entry.year < 0 ? 0 : Math.floor(entry.year / 100) * 100;
    const key = entry.year < 0 ? "bce" : String(startYear);
    const label = key === "bce" ? "Before the Common Era" : `${Math.max(1, startYear)}–${startYear + 99} CE`;
    if (!periods.has(key)) periods.set(key, { label, entries: [] });
    periods.get(key).entries.push(entry);
  }
  return [...periods].map(([id, { label, entries }]) => `<section class="era-group" aria-labelledby="period-${id}">
    <h3 class="era-heading" id="period-${id}">${label}</h3>
    <div class="event-list">${entries.map((entry) => experimentCard(entry, "./", "h4")).join("")}</div>
  </section>`).join("");
}
