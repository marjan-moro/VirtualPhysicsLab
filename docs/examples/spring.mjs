// Standalone authoring example for an ideal linear spring under static extension.
export const defaultParameters = Object.freeze({ stiffness: 100, displacement: 0.05 });

// Positive displacement extends the spring. Restoring force acts toward zero.
export function solveSpring(parameters) {
  const { stiffness, displacement } = parameters ?? {};
  if (!Number.isFinite(stiffness) || stiffness <= 0 || !Number.isFinite(displacement)) {
    throw new RangeError("Supply positive stiffness in N/m and finite displacement in m.");
  }

  const restoringForce = -stiffness * displacement;
  const storedEnergy = -0.5 * restoringForce * displacement;
  if (!Number.isFinite(restoringForce) || !Number.isFinite(storedEnergy)) {
    throw new RangeError("The force and stored energy must be representable.");
  }
  return {
    restoringForce, // N
    storedEnergy,   // J
  };
}
