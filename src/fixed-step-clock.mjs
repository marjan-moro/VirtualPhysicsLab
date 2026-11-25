// Track playback time independently of the simulation state. Discard wall time
// beyond this limit after a background-tab suspension or a stalled frame.
const maxFrameSeconds = 0.25;

export function createFixedStepClock(stepSeconds) {
  if (!Number.isFinite(stepSeconds) || stepSeconds <= 0) {
    throw new RangeError("The physics time step must be positive and finite.");
  }

  let previousTimestamp;
  let accumulated = 0;
  const roundoffTolerance = stepSeconds * 1e-12;

  return {
    resync() {
      previousTimestamp = undefined;
    },

    reset() {
      previousTimestamp = undefined;
      accumulated = 0;
    },

    advance(timestampMs, speed, step) {
      let steps = 0;
      if (previousTimestamp !== undefined) {
        const elapsedSeconds = (timestampMs - previousTimestamp) / 1000;
        accumulated += Math.min(maxFrameSeconds, Math.max(0, elapsedSeconds)) * speed;
      }
      previousTimestamp = timestampMs;
      while (accumulated + roundoffTolerance >= stepSeconds) {
        accumulated = Math.max(0, accumulated - stepSeconds);
        steps += 1;
        if (step(stepSeconds) === false) {
          previousTimestamp = undefined;
          accumulated = 0;
          return { steps, completed: true };
        }
      }
      return { steps, completed: false };
    },
  };
}
