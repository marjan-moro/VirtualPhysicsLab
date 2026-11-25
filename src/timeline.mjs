import { filterExperiments, timeline } from "./registry.mjs";
import { milestoneSections } from "./markup.mjs";

const filters = document.querySelector("#filters");
const list = document.querySelector("#experiments");
const count = document.querySelector("#result-count");
const views = ["timeline", "grid", "compact"];
const fields = ["query", "era", "category", "difficulty", "lab"];
const controls = Object.fromEntries(fields.map((field) => [field, filters.elements.namedItem(field)]));

function readLocation() {
  const params = new URLSearchParams(window.location.search);
  for (const field of fields) controls[field].value = params.get(field) ?? "";
  const view = params.get("view");
  filters.elements.namedItem("view").value = views.includes(view) ? view : "timeline";
}

function currentFilters() {
  return Object.fromEntries(fields.map((field) => [field, controls[field].value]));
}

function render({ syncLocation = true } = {}) {
  const values = currentFilters();
  const view = filters.elements.namedItem("view").value;
  const results = filterExperiments(timeline, values);
  list.dataset.view = view;
  count.textContent = `${results.length} of ${timeline.length} milestones`;
  list.innerHTML = results.length
    ? milestoneSections(results)
    : '<p class="no-results">No milestones match these filters. Try a different search or clear the filters.</p>';
  document.querySelectorAll("[data-era]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.era === values.era));
  });
  if (syncLocation) {
    const params = new URLSearchParams(window.location.search);
    for (const [field, value] of Object.entries({ ...values, view: view === "timeline" ? "" : view })) {
      if (value) params.set(field, value);
      else params.delete(field);
    }
    const search = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`);
  }
}

filters.addEventListener("input", () => render());
filters.addEventListener("submit", (event) => event.preventDefault());
filters.addEventListener("reset", () => queueMicrotask(() => render()));
document.querySelector("#eras").addEventListener("click", (event) => {
  const button = event.target.closest("[data-era]");
  if (!button) return;
  controls.era.value = button.dataset.era;
  render();
});
window.addEventListener("popstate", () => {
  readLocation();
  render({ syncLocation: false });
});
readLocation();
render({ syncLocation: false });
