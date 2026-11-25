import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createGalileoModel,
  defaultParameters,
  getGalileoPlots,
  physicsTimeStep,
  radiansPerDegree,
  stateAtTime,
  stepGalileo,
} from "../src/galileo.mjs";

function close(actual, expected, tolerance = 1e-12) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected} by more than ${tolerance}`);
}

test("a solid sphere accelerates at five sevenths of the frictionless sliding acceleration", () => {
  const angle = 30 * radiansPerDegree;
  const rolling = createGalileoModel({ ...defaultParameters, angle });
  const sliding = createGalileoModel({ ...defaultParameters, angle, mode: "sliding" });
  close(sliding.acceleration, 4.905);
  close(rolling.acceleration, (5 / 7) * 4.905);
  close(rolling.finishTime, Math.sqrt(4 / ((5 / 7) * 4.905)));
  close(sliding.finishTime, Math.sqrt(4 / 4.905));
  close(rolling.minimumFriction, (2 / 7) * Math.tan(angle));
  close(rolling.staticFriction * rolling.radius, rolling.inertia * rolling.acceleration / rolling.radius);
  assert.equal(sliding.staticFriction, 0);
});

test("distance is proportional to time squared and rolling remains without slip", () => {
  const model = createGalileoModel(defaultParameters);
  const half = stateAtTime(model, model.finishTime / 4);
  const full = stateAtTime(model, model.finishTime / 2);
  close(full.distance / half.distance, 4);
  close(full.velocity / half.velocity, 2);
  close(full.velocity, full.angularSpeed * model.radius);
  close(full.distance, full.angularDisplacement * model.radius);
  close(full.verticalDrop, full.distance * Math.sin(model.angle));
});

test("both lossless modes conserve mechanical energy until the exact arrival event", () => {
  for (const mode of ["rolling", "sliding"]) {
    const model = createGalileoModel({ ...defaultParameters, mode });
    const initial = stateAtTime(model, 0);
    for (const fraction of [0.2, 0.5, 0.8, 1]) {
      const state = stateAtTime(model, fraction * model.finishTime);
      close(state.totalEnergy, initial.totalEnergy);
      if (mode === "rolling") close(state.rotationalEnergy / state.translationalEnergy, 2 / 5);
      else assert.equal(state.rotationalEnergy, 0);
    }
    const arrived = stateAtTime(model, model.finishTime + 1);
    assert.equal(arrived.distance, model.length);
    assert.equal(arrived.time, model.finishTime);
    assert.equal(arrived.finished, true);
    assert.equal(arrived.potentialEnergy, 0);
  }
});

test("fixed-step updates agree with the analytical trajectory across step sizes", () => {
  const model = createGalileoModel({ ...defaultParameters, angle: 30 * radiansPerDegree });
  for (const dt of [physicsTimeStep / 2, physicsTimeStep, 0.07]) {
    let state = stateAtTime(model, 0);
    while (state.time + dt < model.finishTime) {
      state = stepGalileo(model, state, dt);
      const reference = stateAtTime(model, state.time);
      close(state.distance, reference.distance);
      close(state.velocity, reference.velocity);
      close(state.totalEnergy, reference.totalEnergy);
      assert.equal(state.finished, false);
    }
    assert.ok(state.time < model.finishTime);
    const terminal = stepGalileo(model, state, dt);
    assert.equal(terminal.time, model.finishTime);
    assert.equal(terminal.distance, model.length);
    assert.equal(terminal.finished, true);
    assert.equal(stepGalileo(model, terminal, dt), terminal);
  }
});

test("the horizontal plane stays at rest and its graph follows elapsed time", () => {
  const model = createGalileoModel({ ...defaultParameters, angle: 0 });
  const advanced = stepGalileo(model, stateAtTime(model, 0), 10);
  assert.equal(model.finishTime, null);
  assert.deepEqual(advanced, stateAtTime(model, 10));
  assert.equal(advanced.distance, 0);
  assert.equal(advanced.totalEnergy, 0);
  assert.equal(advanced.finished, false);
  const [distanceTime, distanceSquared] = getGalileoPlots(model, advanced);
  assert.deepEqual(distanceTime.points.at(-1), { x: 10, y: 0 });
  assert.deepEqual(distanceSquared.points.at(-1), { x: 100, y: 0 });
});

test("parameter, time, and time step validation catch unsupported inputs", () => {
  for (const [key, value] of Object.entries({ angle: -0.1, length: 0, gravity: Infinity, mass: NaN, radius: -1 })) {
    assert.throws(() => createGalileoModel({ ...defaultParameters, [key]: value }), RangeError);
  }
  assert.throws(() => createGalileoModel({ ...defaultParameters, mode: "skipping" }), /Choose rolling/);
  assert.throws(() => createGalileoModel({ ...defaultParameters, angle: 0.05 * radiansPerDegree }), /incline of at least 0.1°/);
  const model = createGalileoModel(defaultParameters);
  assert.throws(() => stateAtTime(model, -1), /elapsed time/i);
  assert.throws(() => stepGalileo(model, stateAtTime(model, 0), 0), /time step/i);
});

test("the analytical plots and live markers agree with the kinematics", () => {
  const model = createGalileoModel(defaultParameters);
  const state = stateAtTime(model, 0.5 * model.finishTime);
  const [distanceTime, distanceSquared, speedTime] = getGalileoPlots(model, state);
  close(distanceTime.points[32].y, state.distance);
  assert.deepEqual(distanceTime.current, { x: state.time, y: state.distance });
  assert.deepEqual(distanceSquared.current, { x: state.time ** 2, y: state.distance });
  const lastDistanceSquared = distanceSquared.points.at(-1);
  close(lastDistanceSquared.y / lastDistanceSquared.x, model.acceleration / 2);
  const lastSpeedTime = speedTime.points.at(-1);
  close(lastSpeedTime.y / lastSpeedTime.x, model.acceleration);
  assert.deepEqual(speedTime.current, { x: state.time, y: state.velocity });
});
