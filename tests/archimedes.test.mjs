import assert from "node:assert/strict";
import { test } from "node:test";
import {
  defaultParameters,
  getPlots,
  parameterDefinitions,
  solveArchimedes,
  validateParameters,
} from "../src/archimedes.mjs";

const block = {
  objectDensity: 750,
  fluidDensity: 1000,
  gravity: 10,
  length: 0.4,
  width: 0.5,
  height: 0.5,
  bottomDepth: 0.25,
};

function approximately(actual, expected) {
  assert.ok(Math.abs(actual - expected) <= 1e-11 * Math.max(1, Math.abs(expected)),
    `Expected ${actual} to be within tolerance of ${expected}`);
}

test("validates defaults and rejects nonphysical, missing, and nonnumeric inputs", () => {
  assert.doesNotThrow(() => validateParameters(defaultParameters));
  for (const [key, { min, max }] of Object.entries(parameterDefinitions)) {
    for (const invalid of [min - 0.01, max + 0.01, NaN, Infinity, String(min), undefined]) {
      assert.throws(() => solveArchimedes({ ...block, [key]: invalid }), RangeError, key);
    }
    for (const boundary of [min, max]) {
      assert.doesNotThrow(() => validateParameters({ ...block, [key]: boundary }), key);
    }
  }
  assert.throws(() => validateParameters(null), RangeError);
});

test("matches a half-submerged analytical case and balances signed support", () => {
  const result = solveArchimedes(block);
  approximately(result.volume, 0.1);
  approximately(result.mass, 75);
  approximately(result.submergedHeight, 0.25);
  approximately(result.displacedVolume, 0.05);
  approximately(result.submergedFraction, 0.5);
  approximately(result.weight, 750);
  approximately(result.buoyancy, 500);
  approximately(result.apparentWeight, 250);
  approximately(result.netForce + result.apparentWeight, 0);
  approximately(result.centerOfMassDepth, 0);
  approximately(result.centerOfBuoyancyDepth, 0.125);
});

test("hydrostatic surface pressures integrate to the buoyant force at any modeled immersion", () => {
  for (const bottomDepth of [-0.2, 0, 0.05, 0.2, 0.5, 1, 6]) {
    const result = solveArchimedes({ ...block, bottomDepth });
    const netPressureForce = (result.bottomPressure - result.topPressure) * block.length * block.width;
    approximately(result.buoyancy, netPressureForce);
  }
});

test("dry and fully wet volumes bound displaced volume without changing depths", () => {
  const dry = solveArchimedes({ ...block, bottomDepth: -0.5 });
  assert.equal(dry.displacedVolume, 0);
  assert.equal(dry.bottomPressure, 0);
  assert.equal(dry.topPressure, 0);
  assert.equal(dry.centerOfBuoyancyDepth, null);
  assert.equal(dry.bottomDepth, -0.5);
  assert.equal(dry.apparentWeight, dry.weight);

  const immersed = solveArchimedes({ ...block, bottomDepth: 0.5 });
  const deep = solveArchimedes({ ...block, bottomDepth: 1 });
  assert.equal(immersed.displacedVolume, immersed.volume);
  assert.equal(deep.buoyancy, immersed.buoyancy);
  assert.equal(deep.bottomDepth, 1);
  approximately(deep.centerOfBuoyancyDepth, 0.75);
  approximately(deep.bottomPressure - immersed.bottomPressure, 5000);
  approximately(deep.topPressure - immersed.topPressure, 5000);
  assert.ok(deep.apparentWeight < 0);
});

test("matches analytical floating depth and distinguishes neutral and sinking cases", () => {
  const light = solveArchimedes(block);
  assert.equal(light.behavior, "floats");
  approximately(light.floatingDepth, 0.375);
  const float = solveArchimedes({ ...block, bottomDepth: light.floatingDepth });
  approximately(float.submergedFraction, 0.75);
  approximately(float.netForce, 0);

  const neutral = solveArchimedes({ ...block, objectDensity: 1000, bottomDepth: 1 });
  assert.equal(neutral.behavior, "neutral");
  assert.equal(neutral.floatingDepth, null);
  approximately(neutral.apparentWeight, 0);

  const dense = solveArchimedes({ ...block, objectDensity: 1200, bottomDepth: 1 });
  assert.equal(dense.behavior, "sinks");
  assert.equal(dense.floatingDepth, null);
  assert.ok(dense.netForce < 0);
});

test("g scales forces and pressure but leaves floating depth and displaced volume fixed", () => {
  const original = solveArchimedes(block);
  const doubled = solveArchimedes({ ...block, gravity: 20 });
  for (const key of ["weight", "buoyancy", "netForce", "apparentWeight", "bottomPressure"]) {
    approximately(doubled[key], 2 * original[key]);
  }
  assert.equal(doubled.floatingDepth, original.floatingDepth);
  assert.equal(doubled.displacedVolume, original.displacedVolume);
});

test("plots follow the model and include valid operating points only", () => {
  for (const bottomDepth of [-0.2, 0, 0.25, 0.5, 1, 6]) {
    const parameters = { ...block, bottomDepth };
    const state = solveArchimedes(parameters);
    const [buoyancy, fraction, pressure, weight] = getPlots(parameters);
    assert.deepEqual(buoyancy.current, { x: state.displacedVolume, y: state.buoyancy });
    assert.deepEqual(fraction.current, { x: 750, y: 0.75 });
    assert.deepEqual(pressure.current, bottomDepth < 0 ? null : { x: bottomDepth, y: state.bottomPressure });
    assert.deepEqual(weight.current, { x: bottomDepth, y: state.apparentWeight });

    for (const { points, current } of [buoyancy, fraction, pressure, weight]) {
      assert.ok(points.every((point, index) => index === 0 || points[index - 1].x < point.x));
      if (current) {
        const right = points.findIndex(point => point.x >= current.x);
        assert.ok(right >= 0);
        if (right === 0) {
          approximately(current.y, points[0].y);
        } else {
          const [a, b] = points.slice(right - 1, right + 1);
          approximately(current.y, a.y + (b.y - a.y) * (current.x - a.x) / (b.x - a.x));
        }
      }
    }
  }
  const [, fraction] = getPlots({ ...block, objectDensity: 1200 });
  assert.equal(fraction.current, null);
  assert.deepEqual(fraction.points.at(-1), { x: block.fluidDensity, y: 1 });
});
