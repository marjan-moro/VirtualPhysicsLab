import {
  challenges,
  defaultParameters,
  fluidPresets,
  getPlots,
  materialPresets,
  parameterDefinitions,
  solveArchimedes,
} from './archimedes.mjs';
import { downloadCsv, drawPlot, format, sampleCurve, serializeCsv } from './lab-tools.mjs';

const parameterKeys = Object.keys(parameterDefinitions);
const measurementFields = [
  ...parameterKeys.map((key) => ({
    key,
    label: `${parameterDefinitions[key].label} (${parameterDefinitions[key].unit})`,
  })),
  { key: 'mass', label: 'Mass (kg)' },
  { key: 'volume', label: 'Object volume (m³)' },
  { key: 'displacedVolume', label: 'Displaced volume (m³)' },
  { key: 'submergedFraction', label: 'Submerged fraction' },
  { key: 'weight', label: 'Weight (N)' },
  { key: 'buoyancy', label: 'Buoyant force (N)' },
  { key: 'apparentWeight', label: 'Signed holding force (N)' },
  { key: 'netForce', label: 'Force without support (N)' },
  { key: 'bottomPressure', label: 'Bottom gauge pressure (Pa)' },
  { key: 'topPressure', label: 'Top gauge pressure (Pa)' },
];

const resultFields = [
  ['submergedFraction', 'Submerged', '%', 100],
  ['buoyancy', 'Buoyant force', 'N'],
  ['weight', 'Weight', 'N'],
  ['apparentWeight', 'Holding force', 'N'],
  ['displacedVolume', 'Displaced volume', 'm³'],
  ['bottomPressure', 'Bottom gauge pressure', 'Pa'],
];

function numberControl(key) {
  const { label, unit, min, max } = parameterDefinitions[key];
  return `<label class="lab-field">${label} <span>(${unit})</span>
    <input aria-label="${label} (${unit})" name="${key}" type="number" min="${min}" max="${max}" step="any" required>
  </label>`;
}

function presetControl(id, name, presets) {
  return `<label class="lab-field">${name}
    <select id="${id}">
      <option value="">Custom</option>
      ${presets.map(({ label, value }) => `<option value="${value}">${label}</option>`).join('')}
    </select>
  </label>`;
}

function labMarkup() {
  return `
    <div class="lab-bench">
      <form class="lab-controls lab-panel" aria-label="Laboratory parameters" novalidate>
        <h3>Parameters</h3>
        <fieldset>
          <legend>Materials and gravity</legend>
          ${presetControl('lab-material', 'Material preset', materialPresets)}
          ${numberControl('objectDensity')}
          ${presetControl('lab-fluid', 'Fluid preset', fluidPresets)}
          ${numberControl('fluidDensity')}
          ${numberControl('gravity')}
        </fieldset>
        <fieldset>
          <legend>Block dimensions</legend>
          <div class="lab-dimensions">
            ${numberControl('length')}
            ${numberControl('width')}
            ${numberControl('height')}
          </div>
        </fieldset>
        <fieldset>
          <legend>Immersion</legend>
          ${numberControl('bottomDepth')}
          <input class="lab-range" id="lab-depth-slider" type="range" aria-label="Adjust bottom depth (m)" aria-describedby="lab-depth-help"
            min="${parameterDefinitions.bottomDepth.min}" max="${parameterDefinitions.bottomDepth.max}"
            step="${parameterDefinitions.bottomDepth.step}">
          <p class="lab-help" id="lab-depth-help">Depth is measured downward from the free surface to the bottom of the block.</p>
        </fieldset>
        <p class="lab-error" id="lab-error" role="status" hidden></p>
        <div class="lab-actions">
          <button type="button" id="lab-equilibrium">Place at floating equilibrium</button>
          <button type="button" id="lab-reset">Reset parameters</button>
        </div>
      </form>

      <div class="lab-panel lab-visualization">
        <div class="lab-card-heading">
          <h3>Hydrostatic tank</h3>
          <div class="lab-toggles">
            <label><input id="lab-show-forces" type="checkbox" checked> Force vectors</label>
            <label><input id="lab-show-pressure" type="checkbox" checked> Gauge pressure</label>
          </div>
        </div>
        <figure class="lab-figure">
          <div id="lab-scene"></div>
          <figcaption>Front view of a fixed upright block. Its width into the page contributes to volume. The pressure arrows show pressure against a vertical wall at corresponding depths.</figcaption>
        </figure>
        <dl class="lab-results" aria-label="Calculated results">
          ${resultFields.map(([key, label]) => `<div><dt>${label}</dt><dd id="lab-result-${key}"></dd></div>`).join('')}
        </dl>
        <p id="lab-behavior" class="lab-help"></p>
        <p class="lab-help">A positive holding force acts upward. A negative value means the fixture pushes down. The tank and arrow scales adapt to the current setup.</p>
      </div>
    </div>

    <section class="lab-panel lab-plot" aria-labelledby="lab-plot-title">
      <div class="lab-card-heading">
        <h3 id="lab-plot-title">Model plots</h3>
        <label class="lab-field">Plot
          <select id="lab-plot-select"></select>
        </label>
      </div>
      <p class="lab-help" id="lab-plot-note"></p>
      <div class="lab-chart" id="lab-chart"></div>
      <div class="lab-plot-controls">
        <label class="lab-field">Read plot value
          <input id="lab-cursor" class="lab-range" type="range" min="0" max="100" value="0">
        </label>
        <p id="lab-plot-reading"></p>
      </div>
      <p class="lab-model-key" id="lab-model-key"><span aria-hidden="true">◆</span> Current setup</p>
    </section>

    <section class="lab-panel" aria-labelledby="lab-measurements-title">
      <div class="lab-card-heading">
        <h3 id="lab-measurements-title">Measurements</h3>
        <div class="lab-actions">
          <button type="button" id="lab-record" class="lab-primary">Record measurement</button>
          <button type="button" id="lab-export">Export CSV</button>
          <button type="button" id="lab-clear">Clear measurements</button>
        </div>
      </div>
      <p class="lab-help" id="lab-measurement-status" role="status">No measurements recorded.</p>
      <div class="lab-table-scroll" tabindex="0" role="region" aria-label="Recorded measurements table" hidden>
        <table class="lab-table">
          <caption>Recorded model measurements. The CSV includes all parameters and force, volume and pressure outputs.</caption>
          <thead><tr>
            <th scope="col">Trial</th><th scope="col">Depth (m)</th><th scope="col">Submerged (%)</th>
            <th scope="col">Buoyancy (N)</th><th scope="col">Holding force (N)</th><th scope="col">Bottom pressure (Pa)</th>
          </tr></thead>
          <tbody></tbody>
        </table>
      </div>
    </section>

    <section class="lab-panel" aria-labelledby="lab-challenges-title">
      <h3 id="lab-challenges-title">Challenges</h3>
      <div class="lab-challenges">
        ${challenges.map(({ title, prompt }, index) => `<article>
          <h4>${title}</h4><p>${prompt}</p>
          <button type="button" data-lab-challenge="${index}" aria-label="Check setup for ${title.toLowerCase()}">Check setup</button>
          <p class="lab-challenge-response" id="lab-challenge-${index}" role="status" hidden></p>
        </article>`).join('')}
      </div>
    </section>`;
}

function drawTank(parameters, result, showForces, showPressure) {
  const waterLeft = 55;
  const waterRight = 548;
  const blockCenter = 285;
  const topDepth = result.bottomDepth - parameters.height;
  const topLimit = Math.min(-0.45, topDepth - 0.21 * parameters.height);
  const bottomLimit = Math.max(0.6, result.bottomDepth + 0.27 * parameters.height);
  const scale = Math.min(294 / (bottomLimit - topLimit), 174 / parameters.length);
  const originY = 37 + (294 - (bottomLimit - topLimit) * scale) / 2 - topLimit * scale;
  const depthY = (depth) => originY + depth * scale;
  const floor = depthY(bottomLimit);
  const rectTop = depthY(topDepth);
  const rectBottom = depthY(result.bottomDepth);
  const rectWidth = parameters.length * scale;
  const rectX = blockCenter - rectWidth / 2;
  const rectHeight = parameters.height * scale;

  const maxForce = Math.max(result.weight, result.buoyancy);
  const buoyancyRoom = result.centerOfBuoyancyDepth === null ? 76 : depthY(result.centerOfBuoyancyDepth) - 44;
  const maxArrow = Math.min(76, 349 - depthY(result.centerOfMassDepth), buoyancyRoom);
  function forceArrow(label, x, depth, magnitude, sign, classes) {
    const startY = depthY(depth);
    const endY = startY + sign * maxArrow * magnitude / maxForce;
    const tagY = startY + sign * (25 + maxArrow * magnitude / maxForce);
    return `<g class="${classes}">
      <path d="M${x},${startY} H${blockCenter}" stroke-dasharray="3 4" opacity=".65"/>
      <circle cx="${blockCenter}" cy="${startY}" r="2.6"/>
      <path d="M${x},${startY} V${endY}" class="lab-force-line" marker-end="url(#lab-tip-${classes})"/>
      <text x="${x}" y="${tagY}" text-anchor="middle">${label}</text>
    </g>`;
  }

  const arrows = showForces
    ? forceArrow('Weight', 155, result.centerOfMassDepth, result.weight, 1, 'lab-weight') +
      (result.centerOfBuoyancyDepth === null ? '' :
        forceArrow('Buoyant force', 413, result.centerOfBuoyancyDepth, result.buoyancy, -1, 'lab-buoyancy'))
    : '';

  const pressureArrows = showPressure ? [0.2, 0.4, 0.6, 0.8, 1].map((fraction) => {
    const y = depthY(fraction * bottomLimit);
    return `<path d="M${waterRight},${y} h-${50 * fraction}" marker-end="url(#lab-tip-pressure)"/>`;
  }).join('') : '';

  const waterlineOverBlock = originY > rectTop && originY < rectBottom
    ? `<path d="M${rectX},${originY} h${rectWidth}" class="lab-waterline lab-waterline-block"/>` : '';

  return `<svg class="lab-diagram" viewBox="0 0 620 385" role="img" aria-labelledby="lab-diagram-title lab-diagram-desc">
    <title id="lab-diagram-title">Block in a hydrostatic tank</title>
    <desc id="lab-diagram-desc">The bottom of the block is at ${format(result.bottomDepth)} meters. The submerged fraction is ${format(100 * result.submergedFraction)} percent. Weight acts downward and any buoyant force acts upward.</desc>
    <defs>
      <pattern id="lab-grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" class="lab-grid-line"/></pattern>
      <marker id="lab-tip-lab-weight" markerWidth="7" markerHeight="7" refX="6.6" refY="3.5" orient="auto" markerUnits="userSpaceOnUse"><path class="lab-weight" d="M0 0L7 3.5L0 7Z"/></marker>
      <marker id="lab-tip-lab-buoyancy" markerWidth="7" markerHeight="7" refX="6.6" refY="3.5" orient="auto" markerUnits="userSpaceOnUse"><path class="lab-buoyancy" d="M0 0L7 3.5L0 7Z"/></marker>
      <marker id="lab-tip-pressure" markerWidth="6" markerHeight="6" refX="5.6" refY="3" orient="auto" markerUnits="userSpaceOnUse"><path class="lab-pressure-tip" d="M0 0L6 3L0 6Z"/></marker>
    </defs>
    <rect class="lab-scene-bg" width="620" height="385"/>
    <rect width="620" height="385" fill="url(#lab-grid)"/>
    <rect class="lab-water" x="${waterLeft}" y="${originY}" width="${waterRight - waterLeft}" height="${floor - originY}"/>
    <path d="M${waterLeft},${originY - 14} V${floor} H${waterRight} V${originY - 14}" class="lab-tank-wall"/>
    <path d="M${waterLeft},${originY} H${waterRight}" class="lab-waterline"/>
    <text x="${waterLeft + 8}" y="${originY - 8}" class="lab-surface-label">Liquid surface · 0 m</text>
    <rect class="lab-block" x="${rectX}" y="${rectTop}" width="${rectWidth}" height="${rectHeight}"/>
    ${waterlineOverBlock}
    ${arrows}
    <g class="lab-pressure">${pressureArrows}</g>
  </svg>
  ${showPressure ? `<p class="lab-help lab-pressure-scale">Gauge pressure at tank floor · ${format(result.hydrostaticGradient * bottomLimit)} Pa</p>` : ''}`;
}

function behaviorText(state) {
  if (state.behavior === 'neutral') {
    return 'Equal densities. A fully submerged block balances at any depth in this model.';
  }
  if (state.behavior === 'sinks') {
    return 'The block is denser than the fluid and sinks without an external support.';
  }
  return `A freely floating upright block would balance at a bottom depth of ${format(state.floatingDepth)} m.`;
}

export function mountLab(root) {
  root.classList.add('lab');
  root.innerHTML = labMarkup();
  const find = (selector) => root.querySelector(selector);
  const form = find('form');
  const numberInputs = Object.fromEntries(parameterKeys.map((key) => [key, form.elements.namedItem(key)]));
  const depthSlider = find('#lab-depth-slider');
  const material = find('#lab-material');
  const fluid = find('#lab-fluid');
  const showForces = find('#lab-show-forces');
  const showPressure = find('#lab-show-pressure');
  const error = find('#lab-error');
  const equilibrium = find('#lab-equilibrium');
  const plotSelect = find('#lab-plot-select');
  const plotCursor = find('#lab-cursor');
  const chart = find('#lab-chart');
  const measurementButtons = {
    record: find('#lab-record'),
    export: find('#lab-export'),
    clear: find('#lab-clear'),
  };
  const challengeButtons = Array.from(root.querySelectorAll('[data-lab-challenge]'));
  const measurements = [];
  let parameters = { ...defaultParameters };
  let result = solveArchimedes(parameters);
  let plots = getPlots(parameters);

  plotSelect.innerHTML = plots.map(({ id, title }) => `<option value="${id}">${title}</option>`).join('');

  function updatePlot() {
    const plot = plots.find(({ id }) => id === plotSelect.value);
    const point = sampleCurve(plot.points, Number(plotCursor.value) / 100);
    plotCursor.setAttribute('aria-valuetext', `${plot.xLabel} ${format(point.x)}, ${plot.yLabel} ${format(point.y)}`);
    find('#lab-plot-note').textContent = plot.note;
    chart.innerHTML = drawPlot(plot, point, chart.clientWidth);
    find('#lab-plot-reading').textContent = `${plot.xLabel} · ${format(point.x)}  |  ${plot.yLabel} · ${format(point.y)}`;
    find('#lab-model-key').hidden = !plot.current;
  }

  function updateScene() {
    find('#lab-scene').innerHTML = drawTank(parameters, result, showForces.checked, showPressure.checked);
  }

  function updateMeasurements() {
    const count = measurements.length;
    find('#lab-measurement-status').textContent = count
      ? `${count} measurement${count === 1 ? '' : 's'} recorded in this session.`
      : 'No measurements recorded.';
    measurementButtons.export.disabled = !count;
    measurementButtons.clear.disabled = !count;
    find('.lab-table-scroll').hidden = !count;
    find('.lab-table tbody').innerHTML = measurements.map((row, index) => `<tr>
      <th scope="row">${index + 1}</th><td>${format(row.bottomDepth)}</td><td>${format(100 * row.submergedFraction)}</td>
      <td>${format(row.buoyancy)}</td><td>${format(row.apparentWeight)}</td><td>${format(row.bottomPressure)}</td>
    </tr>`).join('');
  }

  function clearFeedback() {
    challenges.forEach((_, index) => { find(`#lab-challenge-${index}`).hidden = true; });
  }

  function updateModel() {
    const invalid = parameterKeys.find((key) => !numberInputs[key].validity.valid);
    parameterKeys.forEach((key) => {
      const input = numberInputs[key];
      input.setAttribute('aria-invalid', String(!input.validity.valid));
    });
    error.hidden = !invalid;
    measurementButtons.record.disabled = Boolean(invalid);
    challengeButtons.forEach((button) => { button.disabled = Boolean(invalid); });
    clearFeedback();

    if (invalid) {
      const { label, min, max, unit } = parameterDefinitions[invalid];
      error.textContent = `Enter ${label.toLowerCase()} between ${min} and ${max} ${unit}. The display shows the last valid setup.`;
      equilibrium.disabled = true;
      return;
    }

    parameters = Object.fromEntries(parameterKeys.map((key) => [key, numberInputs[key].valueAsNumber]));
    result = solveArchimedes(parameters);
    plots = getPlots(parameters);
    material.value = String(parameters.objectDensity);
    fluid.value = String(parameters.fluidDensity);
    if (material.selectedIndex < 0) material.value = '';
    if (fluid.selectedIndex < 0) fluid.value = '';
    depthSlider.value = parameters.bottomDepth;
    depthSlider.setAttribute('aria-valuetext', `${format(parameters.bottomDepth)} meters`);
    equilibrium.disabled = result.floatingDepth === null;
    for (const [key, , unit, factor = 1] of resultFields) {
      find(`#lab-result-${key}`).textContent = `${format(result[key] * factor)} ${unit}`;
    }
    find('#lab-behavior').textContent = behaviorText(result);
    updateScene();
    updatePlot();
  }

  function reset() {
    parameterKeys.forEach((key) => { numberInputs[key].value = defaultParameters[key]; });
    showForces.checked = true;
    showPressure.checked = true;
    plotSelect.selectedIndex = 0;
    plotCursor.value = 0;
    updateModel();
  }

  // Keep the numeric coordinate authoritative so solving for equilibrium retains full precision.
  for (const input of Object.values(numberInputs)) input.addEventListener('input', updateModel);
  form.addEventListener('submit', (event) => event.preventDefault());
  depthSlider.addEventListener('input', () => {
    numberInputs.bottomDepth.value = depthSlider.value;
    updateModel();
  });
  material.addEventListener('change', () => {
    if (material.value) numberInputs.objectDensity.value = material.value;
    else numberInputs.objectDensity.focus();
    if (material.value) updateModel();
  });
  fluid.addEventListener('change', () => {
    if (fluid.value) numberInputs.fluidDensity.value = fluid.value;
    else numberInputs.fluidDensity.focus();
    if (fluid.value) updateModel();
  });
  equilibrium.addEventListener('click', () => {
    numberInputs.bottomDepth.value = result.floatingDepth;
    updateModel();
  });
  find('#lab-reset').addEventListener('click', reset);
  showForces.addEventListener('change', updateScene);
  showPressure.addEventListener('change', updateScene);
  plotSelect.addEventListener('change', () => {
    plotCursor.value = 0;
    updatePlot();
  });
  plotCursor.addEventListener('input', updatePlot);
  measurementButtons.record.addEventListener('click', () => {
    measurements.push({ ...parameters, ...result });
    updateMeasurements();
  });
  measurementButtons.clear.addEventListener('click', () => {
    measurements.length = 0;
    updateMeasurements();
    if (!measurementButtons.record.disabled) measurementButtons.record.focus();
  });
  measurementButtons.export.addEventListener('click', () => {
    downloadCsv('archimedes-measurements.csv', serializeCsv(
      ['Trial', ...measurementFields.map(({ label }) => label)],
      measurements.map((row, index) => [index + 1, ...measurementFields.map(({ key }) => row[key])]),
    ));
  });
  challengeButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
      const challenge = challenges[index];
      const feedback = find(`#lab-challenge-${index}`);
      feedback.textContent = challenge.check(result) ? challenge.success : challenge.retry;
      feedback.hidden = false;
    });
  });

  reset();
  updateMeasurements();
  const resize = new ResizeObserver(() => {
    if (chart.isConnected) updatePlot();
    else resize.disconnect();
  });
  resize.observe(chart);
}
