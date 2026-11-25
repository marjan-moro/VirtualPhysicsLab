import assert from "node:assert/strict";
import { test } from "node:test";
import {
  defaultGeometry,
  defaultObservations,
  estimateEratosthenes,
  getSensitivityPlot,
  radiansPerDegree,
  referenceEarthRadius,
  simulateEratosthenes,
} from "../src/eratosthenes.mjs";

function close(actual, expected, tolerance) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected} by more than ${tolerance}`);
}

test("the textbook shadow pair recovers 7.2 degrees and 40,000 km", () => {
  const result = estimateEratosthenes(defaultObservations);
  assert.equal(result.south.zenithAngle, 0);
  assert.equal(result.south.altitude, Math.PI / 2);
  close(result.north.zenithAngle, 7.2 * radiansPerDegree, 1e-15);
  close(result.angleDifference, 7.2 * radiansPerDegree, 1e-15);
  close(result.circumference, 40_000_000, 1e-7);
  close(result.radius, 40_000_000 / (2 * Math.PI), 1e-7);
  close(result.errorPercent, 100 * (result.radius / referenceEarthRadius - 1), 1e-13);
});

test("oppositely directed shadows add their unsigned zenith angles", () => {
  const southAngle = -4 * radiansPerDegree;
  const northAngle = 6 * radiansPerDegree;
  const result = estimateEratosthenes({
    baseline: 1_000_000,
    southHeight: 2,
    northHeight: 1,
    southShadow: 2 * Math.tan(southAngle),
    northShadow: Math.tan(northAngle),
  });
  close(result.angleDifference, 10 * radiansPerDegree, 1e-15);
  close(result.circumference, 36_000_000, 1e-7);
  assert.ok(result.south.shadow < 0);
  assert.ok(result.north.shadow > 0);
});

test("unequal gnomon heights scale their shadows without changing the angle", () => {
  const original = simulateEratosthenes({ ...defaultGeometry, southLatitude: 20 * radiansPerDegree });
  const scaled = simulateEratosthenes({
    ...defaultGeometry, southLatitude: 20 * radiansPerDegree, southHeight: 2, northHeight: 3,
  });
  close(scaled.south.shadow, 2 * original.south.shadow, 1e-15);
  close(scaled.north.shadow, 3 * original.north.shadow, 1e-15);
  close(scaled.radius, original.radius, 1e-7);
});

test("forward and inverse geometry recover the input radius as solar declination changes", () => {
  for (const declination of [-15, 0, 20]) {
    const parameters = {
      ...defaultGeometry,
      radius: 6_500_000,
      southLatitude: 12 * radiansPerDegree,
      declination: declination * radiansPerDegree,
      baseline: 1_010_000,
    };
    const result = simulateEratosthenes(parameters);
    assert.equal(result.modelRadius, parameters.radius);
    close(result.north.latitude - result.south.latitude, parameters.baseline / parameters.radius, 1e-15);
    close(result.angleDifference, parameters.baseline / parameters.radius, 1e-15);
    close(result.radius, parameters.radius, 1e-7);
    close(result.circumference, 2 * Math.PI * parameters.radius, 1e-6);
  }
});

test("equal or reversed angles cannot determine the northward arc radius", () => {
  const equal = { ...defaultObservations, southShadow: 1, northShadow: 2, northHeight: 2 };
  assert.throws(() => estimateEratosthenes(equal), /north zenith angle must exceed the south/);
  assert.throws(() => estimateEratosthenes({ ...defaultObservations, northShadow: -0.1 }), /Check shadow lengths and signs/);
  assert.throws(() => estimateEratosthenes({ ...defaultObservations, northShadow: Number.MIN_VALUE }), /too close/);
});

test("invalid coordinates, baseline, heights, latitude range, and daylight are rejected", () => {
  assert.throws(() => estimateEratosthenes({ ...defaultObservations, baseline: 0 }), /Meridian distance/);
  assert.throws(() => estimateEratosthenes({ ...defaultObservations, northHeight: -1 }), /North gnomon height/);
  assert.throws(() => estimateEratosthenes({ ...defaultObservations, northShadow: Infinity }), /finite/);
  assert.throws(() => estimateEratosthenes({ ...defaultObservations, southShadow: -100 }), /south station/);
  assert.throws(() => simulateEratosthenes({ ...defaultGeometry, southLatitude: 89 * radiansPerDegree }), /between the poles/);
  assert.throws(() => simulateEratosthenes({ ...defaultGeometry, southLatitude: -80 * radiansPerDegree }), /south station/);
  assert.throws(() => simulateEratosthenes({ ...defaultGeometry, declination: Math.PI }), /Solar declination/);
});

test("sensitivity plot uses the fixed-baseline inverse and agrees with the active trial", () => {
  const result = estimateEratosthenes(defaultObservations);
  const plot = getSensitivityPlot(result);
  close(plot.current.x, result.angleDifference / radiansPerDegree, 1e-15);
  close(plot.current.y, result.circumference / 1000, 1e-9);
  plot.points.forEach(({ x, y }, index) => {
    const expected = 2 * Math.PI * result.baseline / (x * radiansPerDegree) / 1000;
    close(y, expected, 1e-8);
    if (index > 0) {
      assert.ok(x > plot.points[index - 1].x);
      assert.ok(y < plot.points[index - 1].y);
    }
  });
});
