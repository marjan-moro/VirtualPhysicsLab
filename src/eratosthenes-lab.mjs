import {
  defaultGeometry,
  defaultObservations,
  estimateEratosthenes,
  getSensitivityPlot,
  geometryDefinitions,
  observationDefinitions,
  radiansPerDegree,
  referenceEarthRadius,
  simulateEratosthenes,
} from "./eratosthenes.mjs";
import { downloadCsv, drawPlot, format, sampleCurve, serializeCsv } from "./lab-tools.mjs";

const fullNumber = new Intl.NumberFormat("en", { maximumSignificantDigits: 7 });
const circumferenceTolerancePercent = 0.05;
const modeLabels = { observations: "Estimate from shadows", geometry: "Predict shadows" };
const modes = {
  observations: { definitions: observationDefinitions, defaults: defaultObservations, solve: estimateEratosthenes },
  geometry: { definitions: geometryDefinitions, defaults: defaultGeometry, solve: simulateEratosthenes },
};
const size = {
  radius: { scale: 1000, unit: "km" },
  baseline: { scale: 1000, unit: "km" },
  southLatitude: { scale: radiansPerDegree, unit: "°" },
  declination: { scale: radiansPerDegree, unit: "°" },
};
const measurementColumns = [
  ["mode", "Mode"],
  ["baseline", "Baseline (m)"],
  ["southHeight", "South gnomon height (m)"],
  ["southShadow", "South signed shadow (m)"],
  ["southAngle", "South signed zenith angle (rad)"],
  ["northHeight", "North gnomon height (m)"],
  ["northShadow", "North signed shadow (m)"],
  ["northAngle", "North signed zenith angle (rad)"],
  ["angleDifference", "Angle difference (rad)"],
  ["radius", "Estimated radius (m)"],
  ["circumference", "Estimated circumference (m)"],
  ["errorPercent", "Difference from reference (%)"],
];

function displayValue(key, value) {
  return value / (size[key]?.scale ?? 1);
}

function formatDistance(kilometers) {
  return kilometers < 0.001 || kilometers >= 1e8 ? format(kilometers) : fullNumber.format(kilometers);
}

function numberField(mode, key) {
  const { label, unit, min, max } = modes[mode].definitions[key];
  const displayUnit = size[key]?.unit ?? unit;
  return `<label class="lab-field">${label} <span>(${displayUnit})</span>
    <input name="${mode}-${key}" type="number" required step="any"
      min="${displayValue(key, min)}" max="${displayValue(key, max)}">
  </label>`;
}

function siteObservation(mode, site, name) {
  return `<fieldset>
    <legend>${name}</legend>
    ${numberField(mode, `${site}Height`)}
    ${mode === "observations" ? numberField(mode, `${site}Shadow`) : ""}
  </fieldset>`;
}

function labMarkup() {
  return `
    <div class="lab-bench">
      <form class="lab-panel lab-controls earth-controls" aria-label="Earth measurement parameters" novalidate>
        <h3>Parameters</h3>
        <fieldset class="earth-modes">
          <legend>Laboratory mode</legend>
          ${Object.entries(modeLabels).map(([value, label]) =>
            `<label><input type="radio" name="earth-mode" value="${value}"${value === "observations" ? " checked" : ""}> ${label}</label>`,
          ).join("")}
        </fieldset>
        <div class="earth-mode-fields" data-earth-mode="observations">
          <p class="lab-help">Start with an illustrative reconstruction using an 800 km meridian arc and a 7.2° difference in noon shadow angles. Enter signed shadow lengths to try another pair.</p>
          ${numberField("observations", "baseline")}
          ${siteObservation("observations", "south", "South site")}
          ${siteObservation("observations", "north", "North site")}
        </div>
        <div class="earth-mode-fields" data-earth-mode="geometry" hidden>
          <p class="lab-help">Set a spherical model and solar declination to predict the shadows at local solar noon.</p>
          ${numberField("geometry", "radius")}
          ${numberField("geometry", "southLatitude")}
          ${numberField("geometry", "declination")}
          ${numberField("geometry", "baseline")}
          ${siteObservation("geometry", "south", "South site")}
          ${siteObservation("geometry", "north", "North site")}
        </div>
        <p class="lab-help">Positive shadows point north. Negative shadows point south.</p>
        <p class="lab-error" id="earth-error" role="status" hidden></p>
        <div class="lab-actions">
          <button type="button" id="earth-transfer" hidden>Use predicted shadows</button>
          <button type="button" id="earth-reset">Reset parameters</button>
        </div>
      </form>
      <section class="lab-panel" aria-labelledby="earth-observation-title">
        <h3 id="earth-observation-title">Noon observations</h3>
        <div id="earth-valid-results">
          <figure class="lab-figure">
            <div id="earth-meridian"></div>
            <figcaption>The highlighted arc represents the surface baseline along the shared meridian. The Earth cross-section is shown relative to the point with the Sun overhead.</figcaption>
          </figure>
          <div class="earth-observations" id="earth-observations"></div>
          <dl class="lab-results" aria-label="Estimated Earth dimensions">
            <div><dt>Angle difference</dt><dd id="earth-angle"></dd></div>
            <div><dt>Estimated radius</dt><dd id="earth-radius"></dd></div>
            <div><dt>Estimated circumference</dt><dd id="earth-circumference"></dd></div>
          </dl>
          <p class="lab-help" id="earth-reference"></p>
          <p class="lab-help" id="earth-prediction-latitudes" hidden></p>
        </div>
        <p class="lab-help" id="earth-unavailable" hidden>Enter valid readings to display the observations and estimate.</p>
      </section>
    </div>
    <section class="lab-panel lab-plot" id="earth-sensitivity" aria-labelledby="earth-plot-heading">
      <h3 id="earth-plot-heading">How angle error affects the estimate</h3>
      <p class="lab-help" id="earth-plot-note"></p>
      <div class="lab-chart" id="earth-plot"></div>
      <div class="lab-plot-controls">
        <label class="lab-field">Read plot value
          <input id="earth-cursor" class="lab-range" type="range" min="0" max="100" step="0.1" value="0">
        </label>
        <p id="earth-plot-reading"></p>
      </div>
      <p class="lab-model-key"><span aria-hidden="true">◆</span> Current observation</p>
    </section>
    <section class="lab-panel" aria-labelledby="earth-measurements-title">
      <div class="lab-card-heading">
        <h3 id="earth-measurements-title">Measurements</h3>
        <div class="lab-actions">
          <button type="button" id="earth-record" class="lab-primary">Record measurement</button>
          <button type="button" id="earth-export">Export CSV</button>
          <button type="button" id="earth-clear">Clear measurements</button>
        </div>
      </div>
      <p class="lab-help" id="earth-measurement-status" role="status">No measurements recorded.</p>
      <div class="lab-table-scroll" id="earth-table" tabindex="0" role="region" aria-label="Recorded Earth measurements" hidden>
        <table class="lab-table">
          <caption>Recorded estimates. The CSV contains the observation inputs and derived values in SI units.</caption>
          <thead><tr>
            <th scope="col">Trial</th><th scope="col">Mode</th><th scope="col">Baseline (km)</th>
            <th scope="col">Angle difference (°)</th><th scope="col">Radius (km)</th>
            <th scope="col">Circumference (km)</th>
          </tr></thead>
          <tbody></tbody>
        </table>
      </div>
    </section>
    <section class="lab-panel" aria-labelledby="earth-challenges-title">
      <h3 id="earth-challenges-title">Challenges</h3>
      <div class="lab-challenges">
        <article>
          <h4>Shadows in opposite directions</h4>
          <p>Set up two noon observations with the southern shadow pointing south and the northern shadow pointing north.</p>
          <button type="button" id="earth-check-shadows">Check shadow directions</button>
          <p id="earth-shadow-feedback" class="lab-challenge-response" role="status" hidden></p>
        </article>
        <article>
          <h4>Estimate Earth’s circumference</h4>
          <p>Use the shadow measurements to estimate a circumference within ${circumferenceTolerancePercent}% of the reference sphere.</p>
          <button type="button" id="earth-check-circumference">Check circumference estimate</button>
          <p id="earth-circumference-feedback" class="lab-challenge-response" role="status" hidden></p>
        </article>
      </div>
    </section>`;
}

function meridianDiagram(result) {
  const earth = { x: 128, y: 110, radius: 73 };
  const sunRight = 349;
  const point = (angle, radius = earth.radius) => ({
    x: earth.x + radius * Math.cos(angle),
    y: earth.y - radius * Math.sin(angle),
  });
  const south = point(result.south.zenithAngle);
  const north = point(result.north.zenithAngle);
  const site = ({ x, y }, className) => `
    <path class="earth-ray" d="M${sunRight - 30},${y} H${x}" marker-end="url(#earth-ray-tip)"/>
    <path class="earth-radius-line" d="M${earth.x},${earth.y} L${x},${y}"/>
    <circle class="${className}" cx="${x}" cy="${y}" r="4"/>`;
  return `<svg class="lab-diagram earth-diagram" viewBox="0 0 366 216" role="img" aria-labelledby="earth-diagram-title earth-diagram-desc">
      <title id="earth-diagram-title">Earth meridian cross-section</title>
      <desc id="earth-diagram-desc">Two sites span a surface arc of ${format(result.baseline / 1000)} kilometers with an angle of ${format(result.angleDifference / radiansPerDegree)} degrees. Parallel rays come from the right.</desc>
      <defs>
        <marker id="earth-ray-tip" markerWidth="8" markerHeight="7" refX="7.5" refY="3.5" orient="auto" markerUnits="userSpaceOnUse"><path class="earth-ray-tip" d="M0 0 L8 3.5 L0 7 Z"/></marker>
      </defs>
      <rect width="366" height="216" class="lab-scene-bg"/>
      <circle class="earth-body" cx="${earth.x}" cy="${earth.y}" r="${earth.radius}"/>
      <path class="earth-origin" d="M${earth.x - earth.radius},${earth.y} H${earth.x + earth.radius}"/>
      <text class="earth-graphic-label" x="${sunRight - 5}" y="29" text-anchor="end">Parallel sunlight</text>
      ${site(south, "earth-south")}
      ${site(north, "earth-north")}
      <path class="earth-baseline" d="M${south.x},${south.y} A${earth.radius},${earth.radius} 0 0 0 ${north.x},${north.y}"/>
      <circle class="earth-center" cx="${earth.x}" cy="${earth.y}" r="3"/>
      <text class="earth-graphic-label" x="${earth.x}" y="${earth.y + 25}" text-anchor="middle">Earth</text>
    </svg>
    <p class="earth-key"><span><i class="earth-south"></i> South site</span><span><i class="earth-north"></i> North site</span><span><i class="earth-baseline"></i> Surface arc</span></p>`;
}

function shadowDiagram(name, site, scale) {
  const base = { x: 125, y: 99 };
  const topY = base.y - site.height * scale;
  const shadowX = base.x + site.shadow * scale;
  const extension = Math.min(22 / Math.max(site.height * scale, 1), 0.5);
  const direction = site.shadow > 0 ? "north" : "south";
  const shadow = site.shadow === 0 ? "No shadow" : `${format(Math.abs(site.shadow))} m ${direction}`;
  return `<figure class="earth-shadow">
    <svg class="lab-diagram earth-diagram" viewBox="0 0 250 122" role="img" aria-label="${name} side view of a vertical stick and its noon shadow">
      <rect width="250" height="122" class="lab-scene-bg"/>
      <path class="earth-ground" d="M10,${base.y} H240"/>
      <path class="earth-ray" d="M${base.x - site.shadow * scale * extension},${topY - site.height * scale * extension} L${shadowX},${base.y}"/>
      <path class="earth-gnomon" d="M${base.x},${base.y} V${topY}"/>
      <path class="earth-shadow-line" d="M${base.x},${base.y} H${shadowX}"/>
      <text class="earth-graphic-label" x="13" y="113">S</text>
      <text class="earth-graphic-label" x="237" y="113" text-anchor="end">N</text>
    </svg>
    <figcaption><strong>${name}</strong> · ${shadow}<br>Zenith angle ${format(site.zenithAngle / radiansPerDegree)}°</figcaption>
  </figure>`;
}

function measurement(mode, result) {
  return {
    mode: modeLabels[mode],
    baseline: result.baseline,
    southHeight: result.south.height,
    southShadow: result.south.shadow,
    southAngle: result.south.zenithAngle,
    northHeight: result.north.height,
    northShadow: result.north.shadow,
    northAngle: result.north.zenithAngle,
    angleDifference: result.angleDifference,
    radius: result.radius,
    circumference: result.circumference,
    errorPercent: result.errorPercent,
  };
}

export function mountLab(root) {
  root.classList.add("lab", "earth-lab");
  root.innerHTML = labMarkup();

  const find = (selector) => root.querySelector(selector);
  const form = find("form");
  const inputs = (mode, key) => form.elements.namedItem(`${mode}-${key}`);
  const modeControls = form.elements.namedItem("earth-mode");
  const error = find("#earth-error");
  const transfer = find("#earth-transfer");
  const record = find("#earth-record");
  const download = find("#earth-export");
  const clear = find("#earth-clear");
  const shadowCheck = find("#earth-check-shadows");
  const circumferenceCheck = find("#earth-check-circumference");
  const shadowFeedback = find("#earth-shadow-feedback");
  const circumferenceFeedback = find("#earth-circumference-feedback");
  const chart = find("#earth-plot");
  const cursor = find("#earth-cursor");
  const measurements = [];
  let result;
  let plot;

  function setFields(mode, values) {
    for (const [key, value] of Object.entries(values)) {
      inputs(mode, key).value = displayValue(key, value);
    }
  }

  function updatePlot() {
    if (!result) return;
    const point = sampleCurve(plot.points, cursor.valueAsNumber / 100);
    const reading = `${format(point.x)}° · ${formatDistance(point.y)} km`;
    cursor.setAttribute("aria-valuetext", reading);
    find("#earth-plot-reading").textContent = reading;
    chart.innerHTML = drawPlot(plot, point, chart.clientWidth);
  }

  function updateModel() {
    const mode = modeControls.value;
    const { definitions, solve } = modes[mode];
    const parameters = {};
    let issue = "";
    for (const key of Object.keys(definitions)) {
      const input = inputs(mode, key);
      const valid = input.validity.valid;
      input.setAttribute("aria-invalid", String(!valid));
      if (!valid && !issue) {
        const { label, unit } = definitions[key];
        issue = `Enter ${label.toLowerCase()} from ${input.min} to ${input.max} ${size[key]?.unit ?? unit}.`;
      }
      parameters[key] = input.valueAsNumber * (size[key]?.scale ?? 1);
    }
    result = null;
    if (!issue) {
      try {
        result = solve(parameters);
      } catch (rangeError) {
        if (!(rangeError instanceof RangeError)) throw rangeError;
        issue = rangeError.message;
      }
    }

    error.textContent = issue;
    error.hidden = !issue;
    find("#earth-valid-results").hidden = !result;
    find("#earth-unavailable").hidden = Boolean(result);
    find("#earth-sensitivity").hidden = !result;
    [transfer, record, shadowCheck, circumferenceCheck].forEach((button) => { button.disabled = !result; });
    shadowFeedback.hidden = true;
    circumferenceFeedback.hidden = true;
    if (!result) return;

    find("#earth-meridian").innerHTML = meridianDiagram(result);
    const scale = Math.min(
      65 / Math.max(result.south.height, result.north.height),
      100 / Math.max(Math.abs(result.south.shadow), Math.abs(result.north.shadow)),
    );
    find("#earth-observations").innerHTML =
      shadowDiagram("South site", result.south, scale) + shadowDiagram("North site", result.north, scale);
    find("#earth-angle").textContent = `${format(result.angleDifference / radiansPerDegree)}°`;
    find("#earth-radius").textContent = `${formatDistance(result.radius / 1000)} km`;
    find("#earth-circumference").textContent = `${formatDistance(result.circumference / 1000)} km`;
    const discrepancy = Math.abs(result.errorPercent);
    const comparison = discrepancy < 0.001
      ? "differs by less than 0.001% from the reference"
      : `is ${format(discrepancy)}% ${result.errorPercent > 0 ? "above" : "below"} the reference`;
    find("#earth-reference").textContent =
      `The estimate ${comparison} for a sphere of radius ${fullNumber.format(referenceEarthRadius / 1000)} km.`;
    const latitudes = find("#earth-prediction-latitudes");
    latitudes.hidden = mode !== "geometry";
    if (mode === "geometry") {
      latitudes.textContent =
        `Site latitudes are ${format(result.south.latitude / radiansPerDegree)}° and ${format(result.north.latitude / radiansPerDegree)}° (north positive).`;
    }
    plot = getSensitivityPlot(result);
    find("#earth-plot-note").textContent = plot.note;
    updatePlot();
  }

  function updateMode() {
    root.querySelectorAll("[data-earth-mode]").forEach((panel) => {
      panel.hidden = panel.dataset.earthMode !== modeControls.value;
    });
    transfer.hidden = modeControls.value !== "geometry";
    updateModel();
  }

  function updateMeasurements() {
    const count = measurements.length;
    download.disabled = !count;
    clear.disabled = !count;
    find("#earth-table").hidden = !count;
    find("#earth-measurement-status").textContent = count
      ? `${count} measurement${count === 1 ? "" : "s"} recorded in this session.`
      : "No measurements recorded.";
    find("#earth-table tbody").innerHTML = measurements.map((row, index) => `<tr>
      <th scope="row">${index + 1}</th><td>${row.mode}</td><td>${format(row.baseline / 1000)}</td>
      <td>${format(row.angleDifference / radiansPerDegree)}</td><td>${formatDistance(row.radius / 1000)}</td>
      <td>${formatDistance(row.circumference / 1000)}</td>
    </tr>`).join("");
  }

  function reset() {
    for (const [mode, { defaults }] of Object.entries(modes)) setFields(mode, defaults);
    modeControls.value = "observations";
    cursor.value = 33.3;
    updateMode();
  }

  form.addEventListener("submit", (event) => event.preventDefault());
  form.addEventListener("input", (event) => {
    if (event.target.name === "earth-mode") updateMode();
    else updateModel();
  });
  find("#earth-reset").addEventListener("click", reset);
  cursor.addEventListener("input", updatePlot);
  transfer.addEventListener("click", () => {
    const { baseline, south, north } = result;
    setFields("observations", {
      baseline, southHeight: south.height, southShadow: south.shadow,
      northHeight: north.height, northShadow: north.shadow,
    });
    modeControls.value = "observations";
    updateMode();
    inputs("observations", "baseline").focus();
  });
  record.addEventListener("click", () => {
    measurements.push(measurement(modeControls.value, result));
    updateMeasurements();
  });
  download.addEventListener("click", () => {
    downloadCsv("eratosthenes-measurements.csv", serializeCsv(
      ["Trial", ...measurementColumns.map(([, label]) => label)],
      measurements.map((row, index) => [index + 1, ...measurementColumns.map(([key]) => row[key])]),
    ));
  });
  clear.addEventListener("click", () => {
    measurements.length = 0;
    updateMeasurements();
    if (!record.disabled) record.focus();
  });
  shadowCheck.addEventListener("click", () => {
    shadowFeedback.textContent = result.south.shadow < 0 && result.north.shadow > 0
      ? "Correct. The Sun is between the two local zenith directions. Subtracting the signed angles adds their magnitudes."
      : "Try a negative southern shadow and a positive northern shadow. In prediction mode, place the Sun’s declination between the two site latitudes.";
    shadowFeedback.hidden = false;
  });
  circumferenceCheck.addEventListener("click", () => {
    circumferenceFeedback.textContent = Math.abs(result.errorPercent) <= circumferenceTolerancePercent
      ? `Correct. Your estimated circumference is within ${circumferenceTolerancePercent}% of the reference.`
      : `The estimate lies outside the ${circumferenceTolerancePercent}% range. Compare the signed angle difference and the baseline to see which inputs can explain the difference.`;
    circumferenceFeedback.hidden = false;
  });

  reset();
  updateMeasurements();
  if (typeof ResizeObserver !== "undefined") {
    const resize = new ResizeObserver(() => {
      if (chart.isConnected) updatePlot();
      else resize.disconnect();
    });
    resize.observe(chart);
  }
}
