import assert from "node:assert/strict";
import { test } from "node:test";
import { solveSpring } from "./spring.mjs";

test("the restoring force reverses under displacement reversal while energy is unchanged", () => {
  assert.deepEqual(solveSpring({ stiffness: 64, displacement: 0.25 }), {
    restoringForce: -16,
    storedEnergy: 2,
  });
  assert.deepEqual(solveSpring({ stiffness: 64, displacement: -0.25 }), {
    restoringForce: 16,
    storedEnergy: 2,
  });
});

test("rejects nonphysical and non-finite inputs or results", () => {
  assert.throws(() => solveSpring({ stiffness: 0, displacement: 0.25 }), RangeError);
  assert.throws(() => solveSpring({ stiffness: 64, displacement: Infinity }), RangeError);
  assert.throws(() => solveSpring({ stiffness: 1e308, displacement: 1e308 }), RangeError);
});
