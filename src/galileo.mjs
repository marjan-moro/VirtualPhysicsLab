// The uniform, rigid sphere starts at rest. Distance is positive downslope,
// measured along the center's path parallel to the ramp. Angles are in
// radians and all other quantities use SI units. Positive rotation rolls
// the sphere downslope. Gravitational potential is zero at the finish.
export const radiansPerDegree = Math.PI / 180;
export const physicsTimeStep = 1 / 120;
const minimumIncline = 0.1 * radiansPerDegree;
const inertiaRatio = 2 / 5;

export const defaultParameters = Object.freeze({
  angle: 10 * radiansPerDegree,
  length: 2,
  gravity: 9.81,
  mass: 0.25,
  radius: 0.025,
  mode: "rolling",
});

export const parameterDefinitions = {
  angle: { label: "Ramp angle", unit: "rad", min: 0, max: Math.PI / 3, step: minimumIncline },
  length: { label: "Ramp length", unit: "m", min: 0.2, max: 10, step: 0.1 },
  gravity: { label: "Gravitational acceleration", unit: "m/s²", min: 0.1, max: 30, step: 0.01 },
  mass: { label: "Sphere mass", unit: "kg", min: 0.01, max: 10, step: 0.01 },
  radius: { label: "Sphere radius", unit: "m", min: 0.01, max: 0.1, step: 0.005 },
};

export function createGalileoModel(parameters) {
  for (const [key, { label, min, max }] of Object.entries(parameterDefinitions)) {
    const value = parameters?.[key];
    if (!Number.isFinite(value) || value < min || value > max) {
      throw new RangeError(`${label} is outside the laboratory range.`);
    }
  }

  const { angle, length, gravity, mass, radius, mode } = parameters;
  if (mode !== "rolling" && mode !== "sliding") throw new RangeError("Choose rolling or frictionless sliding.");
  if (angle !== 0 && angle < minimumIncline) {
    throw new RangeError("Use a horizontal ramp at 0°, or an incline of at least 0.1° to keep run times manageable.");
  }

  const rolling = mode === "rolling";
  const slope = Math.sin(angle);
  const acceleration = gravity * slope / (rolling ? 1 + inertiaRatio : 1);
  const normalForce = mass * gravity * Math.cos(angle);
  const staticFriction = rolling ? inertiaRatio * mass * acceleration : 0;

  return {
    angle, length, gravity, mass, radius, mode,
    slope,
    acceleration,
    inertia: inertiaRatio * mass * radius * radius,
    normalForce,
    staticFriction,
    minimumFriction: staticFriction / normalForce,
    finishTime: acceleration > 0 ? Math.sqrt(2 * length / acceleration) : null,
  };
}

function kinematicState(model, time, distance, velocity, finished = false) {
  const angularSpeed = model.mode === "rolling" ? velocity / model.radius : 0;
  const angularDisplacement = model.mode === "rolling" ? distance / model.radius : 0;
  const translationalEnergy = 0.5 * model.mass * velocity * velocity;
  const rotationalEnergy = 0.5 * model.inertia * angularSpeed * angularSpeed;
  const potentialEnergy = model.mass * model.gravity * (model.length - distance) * model.slope;

  return {
    time, distance, velocity, angularSpeed, angularDisplacement, finished,
    verticalDrop: distance * model.slope,
    translationalEnergy,
    rotationalEnergy,
    potentialEnergy,
    totalEnergy: translationalEnergy + rotationalEnergy + potentialEnergy,
  };
}

function finishState(model) {
  const { finishTime, length, acceleration } = model;
  return kinematicState(model, finishTime, length, acceleration * finishTime, true);
}

// Closed-form reference trajectory. The model ends when the center reaches the
// downstream measurement station, so queries after arrival return the finish.
export function stateAtTime(model, time) {
  if (!Number.isFinite(time) || time < 0) throw new RangeError("Elapsed time must be finite and nonnegative.");
  if (model.finishTime !== null && time >= model.finishTime) return finishState(model);
  const velocity = model.acceleration * time;
  return kinematicState(model, time, 0.5 * velocity * time, velocity);
}

// For constant a these increments are exact over dt. If a tick crosses the
// finish, shorten it to the analytical event time and return the endpoint.
export function stepGalileo(model, state, dt = physicsTimeStep) {
  if (!Number.isFinite(dt) || dt <= 0) throw new RangeError("Time step must be finite and positive.");
  if (state.finished) return state;
  const time = state.time + dt;
  if (model.finishTime !== null && time >= model.finishTime) return finishState(model);
  if (!Number.isFinite(time)) throw new RangeError("Elapsed time exceeded the representable range.");
  const velocity = state.velocity + model.acceleration * dt;
  const distance = state.distance + 0.5 * (state.velocity + velocity) * dt;
  // Roundoff can put the last integrated point on the downstream endpoint.
  if (distance >= model.length && model.finishTime !== null) return finishState(model);
  return kinematicState(model, time, distance, velocity);
}

export function getGalileoPlots(model, state = stateAtTime(model, 0)) {
  // A horizontal ramp has no arrival event. Grow its initial observation
  // window as needed so the live point remains on the chart.
  const endTime = model.finishTime ?? Math.max(5, state.time);
  const end = stateAtTime(model, endTime);
  const samples = Array.from({ length: 65 }, (_, index) => {
    const time = endTime * (index / 64);
    return { x: time, y: stateAtTime(model, time).distance };
  });
  return [
    {
      id: "distance-time",
      title: "Distance versus time",
      xLabel: "Time (s)",
      yLabel: "Distance (m)",
      note: "From rest on a uniform incline, the distance grows quadratically with elapsed time.",
      points: samples,
      current: { x: state.time, y: state.distance },
    },
    {
      id: "distance-time-squared",
      title: "Distance versus time squared",
      xLabel: "Time squared (s²)",
      yLabel: "Distance (m)",
      note: "The straight-line slope in this plot equals half the acceleration.",
      points: [{ x: 0, y: 0 }, { x: endTime ** 2, y: end.distance }],
      current: { x: state.time ** 2, y: state.distance },
    },
    {
      id: "velocity-time",
      title: "Speed versus time",
      xLabel: "Time (s)",
      yLabel: "Speed (m/s)",
      note: "The straight-line slope in this plot equals the acceleration.",
      points: [{ x: 0, y: 0 }, { x: endTime, y: end.velocity }],
      current: { x: state.time, y: state.velocity },
    },
  ];
}
