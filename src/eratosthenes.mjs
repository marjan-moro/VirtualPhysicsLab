// The idealized stations share a meridian. Angles are radians and lengths
// are meters. Northward latitude, shadow displacement, and zenith angle
// are positive. The baseline is the surface arc from the south to north station.
export const radiansPerDegree = Math.PI / 180;
export const referenceEarthRadius = 6_371_008.8;
export const minimumSolarAltitude = radiansPerDegree;

const halfTurn = Math.PI;
const rightAngle = halfTurn / 2;
const zenithAngleLimit = rightAngle - minimumSolarAltitude;
const declinationLimit = 23.44 * radiansPerDegree;

const baseline = {
  label: "Meridian distance", unit: "m", min: 1, max: 20_000_000, step: 1000,
};
const gnomonHeight = { unit: "m", min: 0.01, max: 100, step: 0.01 };
const shadowLength = { unit: "m", min: -1_000_000, max: 1_000_000, step: 0.001 };
const heights = {
  southHeight: { ...gnomonHeight, label: "South gnomon height" },
  northHeight: { ...gnomonHeight, label: "North gnomon height" },
};

export const geometryDefinitions = {
  radius: { label: "Model radius", unit: "m", min: 1_000_000, max: 10_000_000, step: 1000 },
  southLatitude: {
    label: "South-station latitude", unit: "rad", min: -rightAngle, max: rightAngle,
    step: 0.01 * radiansPerDegree,
  },
  declination: {
    label: "Solar declination", unit: "rad", min: -declinationLimit, max: declinationLimit,
    step: 0.01 * radiansPerDegree,
  },
  baseline,
  ...heights,
};

export const observationDefinitions = {
  baseline,
  ...heights,
  southShadow: { ...shadowLength, label: "South signed shadow" },
  northShadow: { ...shadowLength, label: "North signed shadow" },
};

export const defaultGeometry = Object.freeze({
  radius: referenceEarthRadius,
  southLatitude: declinationLimit,
  declination: declinationLimit,
  baseline: 800_000,
  southHeight: 1,
  northHeight: 1,
});

// Rounded textbook geometry, supplied as an illustration of the method.
export const defaultObservations = Object.freeze({
  baseline: 800_000,
  southHeight: 1,
  northHeight: 1,
  southShadow: 0,
  northShadow: Math.tan(7.2 * radiansPerDegree),
});

function validate(parameters, definitions) {
  for (const [key, { label, min, max }] of Object.entries(definitions)) {
    const value = parameters?.[key];
    if (!Number.isFinite(value)) throw new RangeError(`${label} must be a finite number.`);
    if (value < min || value > max) throw new RangeError(`${label} is outside the laboratory range.`);
  }
}

function checkDaylight(zenithAngle, station) {
  if (Math.abs(zenithAngle) > zenithAngleLimit) {
    throw new RangeError(`The Sun must be at least 1° above the horizon at the ${station} station.`);
  }
}

function observedSite(height, shadow, station) {
  const zenithAngle = Math.atan2(shadow, height);
  checkDaylight(zenithAngle, station);
  return { height, shadow, zenithAngle, altitude: rightAngle - Math.abs(zenithAngle) };
}

function circumferenceFor(radius) {
  return 2 * Math.PI * radius;
}

export function estimateEratosthenes(parameters) {
  validate(parameters, observationDefinitions);
  const { baseline, southHeight, northHeight, southShadow, northShadow } = parameters;
  const south = observedSite(southHeight, southShadow, "south");
  const north = observedSite(northHeight, northShadow, "north");
  const angleDifference = north.zenithAngle - south.zenithAngle;
  if (angleDifference <= 0) {
    throw new RangeError("The north zenith angle must exceed the south zenith angle. Check shadow lengths and signs.");
  }
  const radius = baseline / angleDifference;
  const circumference = circumferenceFor(radius);
  if (!Number.isFinite(circumference)) {
    throw new RangeError("The shadow angles are too close to estimate a finite circumference.");
  }
  const errorPercent = 100 * ((radius - referenceEarthRadius) / referenceEarthRadius);
  return { baseline, south, north, angleDifference, radius, circumference, errorPercent };
}

export function simulateEratosthenes(parameters) {
  validate(parameters, geometryDefinitions);
  const {
    radius: modelRadius, southLatitude, declination, baseline, southHeight, northHeight,
  } = parameters;
  const northLatitude = southLatitude + baseline / modelRadius;
  if (southLatitude <= -rightAngle || southLatitude >= rightAngle || northLatitude >= rightAngle) {
    throw new RangeError("Both stations must be between the poles. Adjust the latitude, radius, or distance.");
  }

  const southZenithAngle = southLatitude - declination;
  const northZenithAngle = northLatitude - declination;
  checkDaylight(southZenithAngle, "south");
  checkDaylight(northZenithAngle, "north");
  const estimate = estimateEratosthenes({
    baseline,
    southHeight,
    northHeight,
    southShadow: southHeight * Math.tan(southZenithAngle),
    northShadow: northHeight * Math.tan(northZenithAngle),
  });
  return {
    ...estimate,
    south: { ...estimate.south, latitude: southLatitude },
    north: { ...estimate.north, latitude: northLatitude },
    declination,
    modelRadius,
  };
}

// Convert at the presentation boundary only. Each plot knot is an analytic
// sample of the circumference at fixed baseline. The shared cursor interpolates
// between knots on the same curve drawn on screen.
export function getSensitivityPlot(result) {
  const { baseline, angleDifference, circumference } = result;
  const min = angleDifference / 2;
  const max = Math.min(2 * angleDifference, 2 * zenithAngleLimit);
  const points = Array.from({ length: 65 }, (_, index) => {
    const delta = min + (max - min) * (index / 64);
    return { x: delta / radiansPerDegree, y: (2 * Math.PI / 1000) * (baseline / delta) };
  });
  return {
    id: "circumference-angle",
    title: "Circumference versus measured angle difference",
    xLabel: "Angle difference (°)",
    yLabel: "Circumference (km)",
    note: "The meridian distance stays fixed. Smaller angle differences give larger circumference estimates and are more sensitive to a fixed angle error.",
    points,
    current: { x: angleDifference / radiansPerDegree, y: circumference / 1000 },
  };
}
