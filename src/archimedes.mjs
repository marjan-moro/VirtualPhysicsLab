export const defaultParameters = Object.freeze({
  objectDensity: 650,
  fluidDensity: 1000,
  gravity: 9.81,
  length: 0.30,
  width: 0.24,
  height: 0.30,
  bottomDepth: 0.12,
});

// Bounds define this lab's modeling range. Inputs outside it are rejected.
export const parameterDefinitions = {
  objectDensity: { label: "Object density", unit: "kg/m³", min: 1, max: 23000, step: 1 },
  fluidDensity: { label: "Fluid density", unit: "kg/m³", min: 1, max: 14000, step: 1 },
  gravity: { label: "Gravitational acceleration", unit: "m/s²", min: 0.1, max: 30, step: 0.01 },
  length: { label: "Length", unit: "m", min: 0.02, max: 2, step: 0.01 },
  width: { label: "Width", unit: "m", min: 0.02, max: 2, step: 0.01 },
  height: { label: "Height", unit: "m", min: 0.02, max: 2, step: 0.01 },
  bottomDepth: { label: "Bottom depth", unit: "m", min: -2, max: 6, step: 0.001 },
};

// Representative densities for comparison. Actual materials vary.
export const materialPresets = [
  { label: "Wood (650 kg/m³)", value: 650 },
  { label: "Acrylic (1,180 kg/m³)", value: 1180 },
  { label: "Aluminum (2,700 kg/m³)", value: 2700 },
  { label: "Steel (7,850 kg/m³)", value: 7850 },
  { label: "Gold (19,300 kg/m³)", value: 19300 },
];

export const fluidPresets = [
  { label: "Fresh water (1,000 kg/m³)", value: 1000 },
  { label: "Seawater (1,025 kg/m³)", value: 1025 },
  { label: "Olive oil (920 kg/m³)", value: 920 },
  { label: "Glycerol (1,260 kg/m³)", value: 1260 },
];

export const challenges = [
  {
    title: 'Float the block',
    prompt: 'Choose a block less dense than the liquid. Predict the submerged fraction, then adjust the depth until the forces nearly balance.',
    check: (state) => state.behavior === 'floats' && state.submergedFraction > 0 && state.submergedFraction < 1
      && Math.abs(state.apparentWeight) <= 0.02 * state.weight,
    success: 'Within 2% of force balance. Compare the submerged fraction with the ratio of object density to fluid density.',
    retry: 'Try a less dense object and adjust the depth until the holding force is within 2% of the weight.',
  },
  {
    title: 'Hold down a buoyant block',
    prompt: 'Submerge a block that would float. Which sign should the holding force have?',
    check: (state) => state.behavior === 'floats' && state.submergedFraction === 1,
    success: 'The holding force is negative. You have to push downward to counter the excess upward buoyancy.',
    retry: 'Use a block less dense than the fluid. Lower its top face to the surface or below it.',
  },
  {
    title: 'Suspend a sinking block',
    prompt: 'Fully submerge a denser block. Compare the holding force in the liquid with its weight in air.',
    check: (state) => state.behavior === 'sinks' && state.submergedFraction === 1,
    success: 'The upward support force is smaller than the weight. Buoyancy supplies the rest of the upward force.',
    retry: 'Use a block denser than the fluid and move it until the submerged fraction reaches 100%.',
  },
];

export function validateParameters(parameters) {
  for (const [key, definition] of Object.entries(parameterDefinitions)) {
    const value = parameters?.[key];
    const { label, min, max, unit } = definition;
    if (!Number.isFinite(value) || value < min || value > max) {
      throw new RangeError(`${label} must be a finite number between ${min} and ${max} ${unit}.`);
    }
  }
}

// Depth is positive down from the undisturbed free surface. The homogeneous
// cuboid stays upright in an incompressible, stationary fluid of uniform density.
// Weight and buoyancy are reported as magnitudes. Signed forces are positive up.
export function solveArchimedes(parameters) {
  validateParameters(parameters);
  const { objectDensity, fluidDensity, gravity, length, width, height, bottomDepth } = parameters;
  const area = length * width;
  const volume = area * height;
  // The submerged column is the intersection of the body and the half-space
  // below the surface. Its height can range from dry to fully submerged.
  const submergedHeight = Math.min(Math.max(bottomDepth, 0), height);
  const displacedVolume = area * submergedHeight;
  const hydrostaticGradient = fluidDensity * gravity;
  const mass = objectDensity * volume;
  const weight = mass * gravity;
  const buoyancy = hydrostaticGradient * displacedVolume;
  const netForce = buoyancy - weight;
  const topDepth = bottomDepth - height;
  const behavior = objectDensity < fluidDensity ? "floats"
    : objectDensity > fluidDensity ? "sinks" : "neutral";
  const floatingDepth = behavior === "floats" ? (objectDensity / fluidDensity) * height : null;

  return {
    mass,
    volume,
    displacedVolume,
    submergedHeight,
    submergedFraction: submergedHeight / height,
    weight,
    buoyancy,
    netForce,
    apparentWeight: weight - buoyancy,
    bottomDepth,
    bottomPressure: hydrostaticGradient * Math.max(bottomDepth, 0),
    topPressure: hydrostaticGradient * Math.max(topDepth, 0),
    hydrostaticGradient,
    centerOfMassDepth: bottomDepth - height / 2,
    centerOfBuoyancyDepth: submergedHeight > 0 ? bottomDepth - submergedHeight / 2 : null,
    floatingDepth,
    behavior,
  };
}

export function getPlots(parameters) {
  const state = solveArchimedes(parameters);
  const { objectDensity, fluidDensity, gravity, height, bottomDepth } = parameters;
  const pressureDepth = Math.max(bottomDepth, 0);
  const pressureLimit = Math.max(height, pressureDepth);
  const fullBuoyancy = fluidDensity * gravity * state.volume;
  const dryDepth = Math.min(-height, bottomDepth);
  const deepDepth = Math.max(2 * height, bottomDepth);
  return [
    {
      id: "buoyancy-volume",
      title: "Buoyant force versus displaced volume",
      xLabel: "Displaced volume (m³)",
      yLabel: "Buoyant force (N)",
      note: "The slope is fluid density multiplied by gravitational acceleration.",
      points: [{ x: 0, y: 0 }, { x: state.volume, y: fullBuoyancy }],
      current: { x: state.displacedVolume, y: state.buoyancy },
    },
    {
      id: "fraction-density",
      title: "Equilibrium submerged fraction versus object density",
      xLabel: "Object density (kg/m³)",
      yLabel: "Equilibrium submerged fraction",
      note: "The curve ends at neutral buoyancy. Freely released objects denser than the fluid sink. The marker shows the equilibrium fraction.",
      points: [{ x: 0, y: 0 }, { x: fluidDensity, y: 1 }],
      current: state.behavior === "sinks" ? null : { x: objectDensity, y: objectDensity / fluidDensity },
    },
    {
      id: "pressure-depth",
      title: "Hydrostatic pressure versus depth",
      xLabel: "Depth below the surface (m)",
      yLabel: "Gauge pressure (Pa)",
      note: "Pressure rises linearly in the fluid. The marker represents the bottom face when it is at or below the surface.",
      points: [{ x: 0, y: 0 }, { x: pressureLimit, y: fluidDensity * gravity * pressureLimit }],
      current: bottomDepth < 0 ? null : { x: pressureDepth, y: state.bottomPressure },
    },
    {
      id: "weight-depth",
      title: "Apparent weight versus immersion",
      xLabel: "Bottom depth (m)",
      yLabel: "Signed holding force (N)",
      note: "Positive force supports the block upward. Negative force holds it down. The force levels off once the block is fully submerged.",
      points: [
        { x: dryDepth, y: state.weight },
        { x: 0, y: state.weight },
        { x: height, y: state.weight - fullBuoyancy },
        { x: deepDepth, y: state.weight - fullBuoyancy },
      ],
      current: { x: bottomDepth, y: state.apparentWeight },
    },
  ];
}
