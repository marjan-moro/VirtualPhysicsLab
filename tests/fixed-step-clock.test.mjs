import assert from "node:assert/strict";
import { test } from "node:test";
import { createFixedStepClock } from "../src/fixed-step-clock.mjs";

test("60 Hz and 144 Hz playback produce the same fixed physics steps", () => {
  const dt = 1 / 120;
  for (const frameRate of [60, 144]) {
    const clock = createFixedStepClock(dt);
    let calls = 0;
    for (let frame = 0; frame <= frameRate; frame += 1) {
      clock.advance(1000 * frame / frameRate, 1, (step) => {
        assert.equal(step, dt);
        calls += 1;
      });
    }
    assert.equal(calls, 120);
  }
});

test("speed, pause, and reset affect pacing without changing the physics step", () => {
  const clock = createFixedStepClock(0.1);
  const step = (dt) => assert.equal(dt, 0.1);
  assert.equal(clock.advance(0, 1, step).steps, 0);
  assert.equal(clock.advance(70, 1, step).steps, 0);
  clock.resync();
  assert.equal(clock.advance(5000, 2, step).steps, 0);
  assert.equal(clock.advance(5020, 2, step).steps, 1);
  clock.reset();
  assert.equal(clock.advance(6000, 1, step).steps, 0);
  assert.equal(clock.advance(6095, 1, step).steps, 0);
});

test("a stalled frame has bounded catch-up and a completed trial stops immediately", () => {
  const clock = createFixedStepClock(0.01);
  clock.advance(0, 1, () => {});
  assert.deepEqual(clock.advance(2000, 1, () => {}), { steps: 25, completed: false });
  let calls = 0;
  const result = clock.advance(2200, 1, () => {
    calls += 1;
    return calls < 3;
  });
  assert.deepEqual(result, { steps: 3, completed: true });
  assert.deepEqual(clock.advance(5000, 1, () => {}), { steps: 0, completed: false });
});
