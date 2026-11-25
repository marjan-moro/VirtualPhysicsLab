import {
  createGalileoModel,
  defaultParameters,
  getGalileoPlots,
  parameterDefinitions,
  physicsTimeStep,
  radiansPerDegree,
  stateAtTime,
  stepGalileo,
} from "./galileo.mjs";
import { createFixedStepClock } from "./fixed-step-clock.mjs";
import { downloadCsv, drawPlot, format, sampleCurve, serializeCsv } from "./lab-tools.mjs";

const modes = { rolling: "Rolling solid sphere", sliding: "Frictionless slider" };
const timingTarget = 2;
const timingTolerance = 0.05;
const measurementFields = [
  ["run", "Run"],
  ["mode", "Mode"],
  ["angle", "Incline angle (rad)"],
  ["length", "Ramp length (m)"],
  ["gravity", "Gravity (m/s²)"],
  ["mass", "Mass (kg)"],
  ["radius", "Sphere radius (m)"],
  ["time", "Time (s)"],
  ["distance", "Down-ramp distance (m)"],
  ["velocity", "Speed (m/s)"],
  ["acceleration", "Acceleration (m/s²)"],
  ["angularSpeed", "Angular speed (rad/s)"],
  ["verticalDrop", "Vertical drop (m)"],
  ["translationalEnergy", "Translational kinetic energy (J)"],
  ["rotationalEnergy", "Rotational kinetic energy (J)"],
  ["potentialEnergy", "Gravitational potential energy (J)"],
  ["totalEnergy", "Total mechanical energy (J)"],
];
const results = [
  ["time", "Time", "s"],
  ["distance", "Distance down ramp", "m"],
  ["velocity", "Speed", "m/s"],
  ["acceleration", "Acceleration", "m/s²"],
  ["angularSpeed", "Angular speed", "rad/s"],
  ["verticalDrop", "Vertical drop", "m"],
  ["translationalEnergy", "Translational energy", "J"],
  ["rotationalEnergy", "Rotational energy", "J"],
  ["potentialEnergy", "Potential energy", "J"],
  ["totalEnergy", "Total energy", "J"],
];

function fieldDefinition(key) {
  const definition = parameterDefinitions[key];
  if (key === "mass") return { ...definition, label: "Object mass" };
  if (key !== "angle") return definition;
  return {
    ...definition,
    unit: "°",
    min: Math.round(definition.min / radiansPerDegree),
    max: Math.round(definition.max / radiansPerDegree),
  };
}

function numberField(key) {
  const { label, unit, min, max } = fieldDefinition(key);
  return `<label class="lab-field"${key === "radius" ? ' id="galileo-radius-field"' : ""}>${label} <span>(${unit})</span>
    <input type="number" name="${key}" min="${min}" max="${max}" step="any" required>
  </label>`;
}

function labMarkup() {
  return `
    <div class="lab-bench">
      <form class="lab-controls lab-panel galileo-controls" aria-label="Inclined plane parameters" novalidate>
        <h3>Parameters</h3>
        <label class="lab-field">Motion model
          <select name="mode">
            ${Object.entries(modes).map(([value, label]) => `<option value="${value}">${label}</option>`).join("")}
          </select>
        </label>
        ${Object.keys(parameterDefinitions).map(numberField).join("")}
        <p class="lab-help">Changing a parameter starts a new run from rest.</p>
        <p class="lab-error" id="galileo-error" role="status" hidden></p>
        <button type="button" id="galileo-reset">Reset parameters</button>
      </form>
      <section class="lab-panel" aria-labelledby="galileo-ramp-heading">
        <h3 id="galileo-ramp-heading">Inclined plane</h3>
        <div id="galileo-run">
          <figure class="lab-figure">
            <div id="galileo-scene"></div>
            <figcaption>Distance is measured along the ramp, starting at the release point. The object size is schematic.</figcaption>
          </figure>
          <div class="galileo-playback">
            <div class="lab-actions">
              <button class="lab-primary" type="button" id="galileo-toggle">Play</button>
              <button type="button" id="galileo-step">Step</button>
              <button type="button" id="galileo-restart">Restart run</button>
            </div>
            <label class="lab-field">Playback speed
              <select id="galileo-speed">
                <option value=".25">0.25×</option><option value=".5">0.5×</option>
                <option value="1" selected>1×</option><option value="2">2×</option>
                <option value="4">4×</option>
              </select>
            </label>
          </div>
          <p id="galileo-status" class="lab-help" role="status"></p>
          <dl class="lab-results" aria-label="Live model results">
            ${results.map(([key, label]) => `<div${key === "angularSpeed" || key === "rotationalEnergy" ? " data-rolling-result" : ""}><dt>${label}</dt><dd id="galileo-${key}"></dd></div>`).join("")}
          </dl>
          <p id="galileo-model-note" class="lab-help"></p>
        </div>
        <p id="galileo-unavailable" class="lab-help" hidden>Enter valid parameters to start a run.</p>
      </section>
    </div>
    <section class="lab-panel lab-plot" id="galileo-plots" aria-labelledby="galileo-plot-heading">
      <div class="lab-card-heading">
        <h3 id="galileo-plot-heading">Motion plots</h3>
        <label class="lab-field">Plot
          <select id="galileo-plot-select"></select>
        </label>
      </div>
      <p class="lab-help" id="galileo-plot-note"></p>
      <div class="lab-chart" id="galileo-plot"></div>
      <div class="lab-plot-controls">
        <label class="lab-field">Read plot value
          <input id="galileo-cursor" class="lab-range" type="range" min="0" max="100" value="0">
        </label>
        <p id="galileo-plot-reading"></p>
      </div>
      <p class="lab-model-key"><span aria-hidden="true">◆</span> Current run position</p>
    </section>
    <section class="lab-panel" aria-labelledby="galileo-measurements-heading">
      <div class="lab-card-heading">
        <h3 id="galileo-measurements-heading">Measurements</h3>
        <div class="lab-actions">
          <button type="button" id="galileo-record" class="lab-primary">Record measurement</button>
          <button type="button" id="galileo-export">Export CSV</button>
          <button type="button" id="galileo-clear">Clear measurements</button>
        </div>
      </div>
      <p class="lab-help" id="galileo-measurement-status" role="status">No measurements recorded.</p>
      <div class="lab-table-scroll" id="galileo-table" tabindex="0" role="region" aria-label="Recorded ramp measurements" hidden>
        <table class="lab-table">
          <caption>Live readings by run. The CSV includes parameters and calculated outputs in SI units.</caption>
          <thead><tr>
            <th scope="col">Trial</th><th scope="col">Run</th><th scope="col">Time (s)</th>
            <th scope="col">Distance (m)</th><th scope="col">Speed (m/s)</th>
            <th scope="col">Total energy (J)</th>
          </tr></thead>
          <tbody></tbody>
        </table>
      </div>
    </section>
    <section class="lab-panel" aria-labelledby="galileo-challenges-heading">
      <h3 id="galileo-challenges-heading">Challenges</h3>
      <div class="lab-challenges">
        <article>
          <h4>Two-second descent</h4>
          <p>Adjust the incline or ramp length to reach the bottom in ${timingTarget} s, within ${timingTolerance} s.</p>
          <button type="button" id="galileo-challenge-timing">Check descent time</button>
          <p class="lab-challenge-response" id="galileo-timing-feedback" role="status" hidden></p>
        </article>
        <article>
          <h4>Test the square-time law</h4>
          <p>Record two readings from the same run after release. Take the second reading near twice the first time. Compare how far the object traveled.</p>
          <button type="button" id="galileo-challenge-square-law">Check recorded readings</button>
          <p class="lab-challenge-response" id="galileo-square-feedback" role="status" hidden></p>
        </article>
      </div>
    </section>`;
}

function buildRamp(model) {
  const x = 51;
  const y = 43;
  const ground = 200;
  const angleDegrees = model.angle / radiansPerDegree;
  const cos = Math.cos(model.angle);
  const sin = Math.sin(model.angle);
  const trackPixels = Math.min(348 / cos, (ground - y - 9) / (sin || 1e-16));
  const point = (fraction) => ({ x: x + fraction * trackPixels * cos, y: y + fraction * trackPixels * sin });
  const end = point(1);
  const mark = (fraction) => {
    const p = point(fraction);
    return `<path d="M${p.x - 3 * sin},${p.y + 3 * cos} L${p.x + 6 * sin},${p.y - 6 * cos}"/>`;
  };
  return {
    // Screen axes point right and down. The contact point follows the incline;
    // the drawn object center is offset along the outward normal.
    pose(distance) {
      const p = point(distance / model.length);
      return `translate(${p.x + 14 * sin} ${p.y - 14 * cos}) rotate(${angleDegrees})`;
    },
    markup: `<svg class="lab-diagram galileo-ramp" viewBox="0 0 472 238" role="img" aria-labelledby="galileo-diagram-title galileo-diagram-description">
      <title id="galileo-diagram-title">A ${modes[model.mode].toLowerCase()} on an inclined plane</title>
      <desc id="galileo-diagram-description">The plane descends ${format(angleDegrees)} degrees from left to right. Progress is reported in the live results.</desc>
      <defs><pattern id="galileo-grid" width="19" height="19" patternUnits="userSpaceOnUse">
        <path d="M19 0H0V19" class="lab-grid-line" fill="none"/>
      </pattern></defs>
      <rect width="472" height="238" class="lab-scene-bg"/>
      <rect width="472" height="238" fill="url(#galileo-grid)"/>
      <path class="galileo-support" d="M${x},${y} L${end.x},${end.y} V${ground} H${x} Z"/>
      <path class="galileo-ground" d="M22,${ground} H450"/>
      <path class="galileo-track" d="M${x},${y} L${end.x},${end.y}"/>
      <g class="galileo-marks">${[0, .25, .5, .75, 1].map(mark).join("")}</g>
      <text class="galileo-diagram-label" x="25" y="221">Ramp length ${format(model.length)} m · Incline ${format(angleDegrees)}°</text>
      <g id="galileo-object">
        ${model.mode === "rolling"
          ? '<circle class="galileo-ball" r="14"/><path id="galileo-wheel-mark" class="galileo-ball-mark" d="M0,0V-9"/>'
          : '<rect class="galileo-ball" x="-13" y="-1" width="26" height="15" rx="2"/>'}
      </g>
    </svg>`,
  };
}

function snapshot(run, model, state) {
  return {
    run,
    mode: modes[model.mode],
    angle: model.angle,
    length: model.length,
    gravity: model.gravity,
    mass: model.mass,
    radius: model.mode === "rolling" ? model.radius : null,
    acceleration: model.acceleration,
    ...state,
  };
}

export function mountLab(root) {
  root.classList.add("lab", "galileo-lab");
  root.innerHTML = labMarkup();

  const find = (selector) => root.querySelector(selector);
  const form = find("form");
  const input = (name) => form.elements.namedItem(name);
  const error = find("#galileo-error");
  const toggle = find("#galileo-toggle");
  const step = find("#galileo-step");
  const restart = find("#galileo-restart");
  const speed = find("#galileo-speed");
  const status = find("#galileo-status");
  const scene = find("#galileo-scene");
  const selector = find("#galileo-plot-select");
  const cursor = find("#galileo-cursor");
  const chart = find("#galileo-plot");
  const record = find("#galileo-record");
  const download = find("#galileo-export");
  const clear = find("#galileo-clear");
  const timingCheck = find("#galileo-challenge-timing");
  const timingFeedback = find("#galileo-timing-feedback");
  const squareFeedback = find("#galileo-square-feedback");

  const clock = createFixedStepClock(physicsTimeStep);
  const measurements = [];
  let run = 0;
  let model;
  let state;
  let ramp;
  let object;
  let wheel;
  let frameId;
  let playing = false;
  let lastPlotFrame = 0;

  function updatePlot() {
    if (!model) return;
    const plots = getGalileoPlots(model, state);
    if (!selector.options.length) {
      selector.innerHTML = plots.map(({ id, title }) => `<option value="${id}">${title}</option>`).join("");
    }
    const plot = plots.find(({ id }) => id === selector.value);
    const point = sampleCurve(plot.points, Number(cursor.value) / 100);
    const reading = `${plot.xLabel} · ${format(point.x)}  |  ${plot.yLabel} · ${format(point.y)}`;
    cursor.setAttribute("aria-valuetext", reading);
    find("#galileo-plot-reading").textContent = reading;
    find("#galileo-plot-note").textContent = plot.note;
    chart.innerHTML = drawPlot(plot, point, chart.clientWidth);
  }

  function renderState() {
    object.setAttribute("transform", ramp.pose(state.distance));
    if (wheel) wheel.setAttribute("transform", `rotate(${state.angularDisplacement / radiansPerDegree})`);
    for (const [key, , unit] of results) {
      const value = key === "acceleration" ? model.acceleration : state[key];
      find(`#galileo-${key}`).textContent = `${format(value)} ${unit}`;
    }
  }

  function updateControls(message) {
    toggle.textContent = playing ? "Pause" : state.finished ? "Replay" : "Play";
    step.disabled = playing || state.finished;
    status.textContent = message;
  }

  function pause() {
    playing = false;
    if (frameId !== undefined) cancelAnimationFrame(frameId);
    frameId = undefined;
    clock.resync();
  }

  function startRun() {
    pause();
    run += 1;
    clock.reset();
    state = stateAtTime(model, 0);
    renderState();
    updatePlot();
    updateControls("Ready to start from rest.");
  }

  function animate(timestamp) {
    frameId = undefined;
    if (!playing || !root.isConnected) return;
    const { steps, completed } = clock.advance(timestamp, Number(speed.value), (dt) => {
      state = stepGalileo(model, state, dt);
      return !state.finished;
    });
    if (steps) {
      renderState();
      if (completed || timestamp - lastPlotFrame >= 100) {
        updatePlot();
        lastPlotFrame = timestamp;
      }
    }
    if (completed) {
      pause();
      updateControls("Reached the bottom of the ramp.");
    } else {
      frameId = requestAnimationFrame(animate);
    }
  }

  function updateParameters() {
    pause();
    const mode = input("mode").value;
    const rolling = mode === "rolling";
    find("#galileo-radius-field").hidden = !rolling;
    input("radius").disabled = !rolling;
    root.querySelectorAll("[data-rolling-result]").forEach((item) => { item.hidden = !rolling; });
    const parameters = { mode };
    let issue = "";
    for (const key of Object.keys(parameterDefinitions)) {
      if (key === "radius" && !rolling) {
        parameters.radius = defaultParameters.radius;
        continue;
      }
      const field = input(key);
      const valid = field.validity.valid;
      field.setAttribute("aria-invalid", String(!valid));
      if (!valid && !issue) {
        const { label, unit, min, max } = fieldDefinition(key);
        issue = `Enter ${label.toLowerCase()} from ${min} to ${max} ${unit}.`;
      }
      parameters[key] = field.valueAsNumber * (key === "angle" ? radiansPerDegree : 1);
    }
    model = null;
    if (!issue) {
      try {
        model = createGalileoModel(parameters);
      } catch (problem) {
        if (!(problem instanceof RangeError)) throw problem;
        issue = problem.message;
      }
    }

    error.textContent = issue;
    error.hidden = !issue;
    find("#galileo-run").hidden = !model;
    find("#galileo-plots").hidden = !model;
    find("#galileo-unavailable").hidden = Boolean(model);
    record.disabled = !model;
    timingCheck.disabled = !model;
    timingFeedback.hidden = true;
    if (!model) return;

    ramp = buildRamp(model);
    scene.innerHTML = ramp.markup;
    object = find("#galileo-object");
    wheel = find("#galileo-wheel-mark");
    const friction = rolling ? ` Rolling without slipping requires a static friction coefficient of at least ${format(model.minimumFriction)}.` : "";
    const motion = model.finishTime === null
      ? "On a horizontal plane the object remains at rest."
      : `Predicted time to the bottom is ${format(model.finishTime)} s.`;
    find("#galileo-model-note").textContent = motion + friction;
    startRun();
  }

  function reset() {
    for (const [key, value] of Object.entries(defaultParameters)) {
      input(key).value = key === "angle" ? value / radiansPerDegree : value;
    }
    speed.value = 1;
    if (selector.options.length) selector.selectedIndex = 0;
    cursor.value = 0;
    updateParameters();
  }

  function updateMeasurements() {
    const count = measurements.length;
    download.disabled = !count;
    clear.disabled = !count;
    find("#galileo-table").hidden = !count;
    find("#galileo-measurement-status").textContent = count
      ? `${count} measurement${count === 1 ? "" : "s"} recorded in this session.`
      : "No measurements recorded.";
    find("#galileo-table tbody").innerHTML = measurements.map((row, index) => `<tr>
      <th scope="row">${index + 1}</th><td>${row.run}</td><td>${format(row.time)}</td>
      <td>${format(row.distance)}</td><td>${format(row.velocity)}</td><td>${format(row.totalEnergy)}</td>
    </tr>`).join("");
    squareFeedback.hidden = true;
  }

  form.addEventListener("submit", (event) => event.preventDefault());
  form.addEventListener("input", (event) => {
    if (event.target.name !== "mode") updateParameters();
  });
  input("mode").addEventListener("change", updateParameters);
  toggle.addEventListener("click", () => {
    if (playing) {
      pause();
      renderState();
      updatePlot();
      updateControls("Paused.");
      return;
    }
    if (state.finished) startRun();
    playing = true;
    clock.resync();
    lastPlotFrame = 0;
    updateControls("Running.");
    frameId = requestAnimationFrame(animate);
  });
  speed.addEventListener("change", () => clock.resync());
  step.addEventListener("click", () => {
    clock.reset();
    state = stepGalileo(model, state);
    renderState();
    updatePlot();
    updateControls(state.finished ? "Reached the bottom of the ramp." : `Advanced to ${format(state.time)} s.`);
  });
  restart.addEventListener("click", startRun);
  find("#galileo-reset").addEventListener("click", reset);
  selector.addEventListener("change", () => {
    cursor.value = 0;
    updatePlot();
  });
  cursor.addEventListener("input", updatePlot);
  record.addEventListener("click", () => {
    measurements.push(snapshot(run, model, state));
    updateMeasurements();
  });
  download.addEventListener("click", () => {
    downloadCsv("galileo-inclined-plane.csv", serializeCsv(
      ["Trial", ...measurementFields.map(([, label]) => label)],
      measurements.map((row, index) => [index + 1, ...measurementFields.map(([key]) => row[key])]),
    ));
  });
  clear.addEventListener("click", () => {
    measurements.length = 0;
    updateMeasurements();
    if (!record.disabled) record.focus();
  });
  timingCheck.addEventListener("click", () => {
    if (model.finishTime === null) {
      timingFeedback.textContent = "The object remains at rest. Raise the incline to begin a descent.";
    } else {
      const near = Math.abs(model.finishTime - timingTarget) <= timingTolerance;
      timingFeedback.textContent = near
        ? `Correct. The predicted descent is ${format(model.finishTime)} s.`
        : `The predicted descent is ${format(model.finishTime)} s. Adjust the ramp length or incline and try again.`;
    }
    timingFeedback.hidden = false;
  });
  find("#galileo-challenge-square-law").addEventListener("click", () => {
    for (const earlier of measurements) {
      if (earlier.time <= 0 || earlier.distance <= 0) continue;
      const later = measurements.find((row) =>
        row.run === earlier.run && Math.abs(row.time / earlier.time - 2) <= 0.1,
      );
      if (later) {
        squareFeedback.textContent =
          `Times of ${format(earlier.time)} s and ${format(later.time)} s give a distance ratio of ${format(later.distance / earlier.distance)}. Doubling time quadruples distance for constant acceleration from rest.`;
        squareFeedback.hidden = false;
        return;
      }
    }
    squareFeedback.textContent = "Record two readings in one moving run. Aim for a second time within 5% of twice the first time.";
    squareFeedback.hidden = false;
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
