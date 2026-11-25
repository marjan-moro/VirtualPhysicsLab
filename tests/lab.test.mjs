import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sampleCurve, serializeCsv } from '../src/lab-tools.mjs';

test('measurement CSV keeps signed values and escapes delimiter, line break, and quote text', () => {
  const csv = serializeCsv(
    ['Trial', 'Force (N)', 'Material, approximate'],
    [[1, -14.225, 'A "sample"\nname'], [2, 0, 'water']],
  );
  assert.equal(csv, 'Trial,Force (N),"Material, approximate"\r\n1,-14.225,"A ""sample""\nname"\r\n2,0,water\r\n');
});

test('plot cursor reads values between the knots of a piecewise linear curve', () => {
  const points = [{ x: -2, y: 5 }, { x: 0, y: 5 }, { x: 2, y: 1 }, { x: 6, y: 1 }];
  assert.deepEqual(sampleCurve(points, 0), { x: -2, y: 5 });
  assert.deepEqual(sampleCurve(points, 0.25), { x: 0, y: 5 });
  assert.deepEqual(sampleCurve(points, 0.375), { x: 1, y: 3 });
  assert.deepEqual(sampleCurve(points, 1), { x: 6, y: 1 });
});
