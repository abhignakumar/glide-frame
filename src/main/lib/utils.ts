import { SPRING_SETTLING_TIME_TOLERANCE } from './constants';

export function calculateSpringSettlingDurationMs({
  mass,
  stiffness,
  damping,
}: {
  mass: number;
  stiffness: number;
  damping: number;
}): number {
  // Calculate natural frequency
  const naturalFrequency = Math.sqrt(stiffness / mass);

  // Calculate damping ratio
  const dampingRatio = damping / (2 * Math.sqrt(mass * stiffness));

  // Calculate settling time based on damping ratio
  // For damping ratio <= 1 (underdamped or critically damped), use the formula:
  // t ≈ -ln(0.01) / (dampingRatio * naturalFrequency)
  // Where 0.01 is the tolerance for the settling time, 0.01 is 1% tolerance band
  const settlingTimeInSeconds =
    -Math.log(SPRING_SETTLING_TIME_TOLERANCE) / (dampingRatio * naturalFrequency);
  return settlingTimeInSeconds * 1000;
}
