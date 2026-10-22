/**
 * Mathematical calculations and formulas for Parabolic Motion (Tiro Parabólico)
 * and Ballistics Mechanics.
 */

import { 
  ParabolicParams, 
  ParabolicInstant, 
  ParabolicResults, 
  ProjectilePreset, 
  EnvironmentPreset 
} from '../types/parabolic';

export const PROJECTILE_PRESETS: ProjectilePreset[] = [
  {
    id: 'pingpong',
    name: 'Pelota de Ping Pong Oficial (ITTF)',
    description: 'Ultra ligera de 2.7g, celuloide/plástico. Alta agilidad y rebote elástico distintivo.',
    mass: 2.7,
    radius: 0.18,
    color: '#fb923c', // Vibrant Ping-Pong Orange
    elasticity: 0.88,
    icon: '🏓',
  },
  {
    id: 'tennis',
    name: 'Pelota de Tenis',
    description: 'Masa de 58g con recubrimiento de fieltro. Mayor inercia y resistencia al viento.',
    mass: 58,
    radius: 0.28,
    color: '#a3e635', // Lime yellow
    elasticity: 0.72,
    icon: '🎾',
  },
  {
    id: 'steel',
    name: 'Balín Metálico de Precisión',
    description: '150g de acero templado. Gran momento lineal, vuela con mínima perturbación.',
    mass: 150,
    radius: 0.22,
    color: '#94a3b8', // Silver metallic
    elasticity: 0.45,
    icon: '⚪',
  },
  {
    id: 'basketball',
    name: 'Mini Balón de Baloncesto',
    description: 'Masa de 320g. Requiere mayor fuerza inicial para elevarse en parábola.',
    mass: 320,
    radius: 0.38,
    color: '#ea580c', // Dark orange
    elasticity: 0.78,
    icon: '🏀',
  },
];

export const ENVIRONMENT_PRESETS: EnvironmentPreset[] = [
  {
    id: 'earth',
    name: 'Planeta Tierra',
    gravity: 9.80665,
    icon: '🌍',
    atmosphere: '1 atm estándar (g = 9.8 m/s²)',
  },
  {
    id: 'moon',
    name: 'La Luna',
    gravity: 1.62,
    icon: '🌕',
    atmosphere: 'Vacío lunar (g = 1.62 m/s²)',
  },
  {
    id: 'mars',
    name: 'Marte',
    gravity: 3.71,
    icon: '🔴',
    atmosphere: 'Gravedad marciana (g = 3.71 m/s²)',
  },
  {
    id: 'jupiter',
    name: 'Júpiter',
    gravity: 24.79,
    icon: '🪐',
    atmosphere: 'Gravedad gigante (g = 24.8 m/s²)',
  },
];

export const DEFAULT_PARABOLIC_PARAMS: ParabolicParams = {
  initialVelocity: 16.0,   // 16 m/s
  angleDeg: 45.0,          // 45 degrees
  initialHeight: 0.35,     // 35 cm (tank cannon height)
  gravity: 9.8,            // m/s^2
  projectileMass: 2.7,     // grams
  projectileId: 'pingpong',
  targetDistance: 24.0,    // 24 meters
  targetHeight: 0.0,       // on the ground (or basket height)
  targetRadius: 1.2,       // 1.2 meters tolerance basket
};

/**
 * Degrees to radians conversion
 */
export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Radians to degrees conversion
 */
export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * Calculates complete parabolic motion analytical results
 */
export function calculateParabolicResults(params: ParabolicParams): ParabolicResults {
  const { initialVelocity, angleDeg, initialHeight, gravity, projectileMass, targetDistance, targetRadius } = params;
  const alphaRad = degToRad(angleDeg);
  const g = Math.max(0.01, gravity);
  const massKg = projectileMass / 1000;

  // Initial velocity components
  const vox = initialVelocity * Math.cos(alphaRad);
  const voy = initialVelocity * Math.sin(alphaRad);

  // Time to peak (ascent)
  const timeAscent = voy > 0 ? voy / g : 0;

  // Maximum height: y_max = y0 + voy^2 / (2g)
  const maxHeight = Math.max(initialHeight, initialHeight + (voy * voy) / (2 * g));

  // Total flight time until y = 0
  // Quadratic equation: -0.5*g*t^2 + voy*t + y0 = 0
  // a = -0.5*g, b = voy, c = y0
  const discr = voy * voy + 2 * g * initialHeight;
  let timeTotal = 0;
  if (discr >= 0) {
    timeTotal = (voy + Math.sqrt(discr)) / g;
  }
  timeTotal = Math.max(0, timeTotal);

  // Maximum horizontal range
  const maxRange = vox * timeTotal;

  // Final velocity components at impact (y = 0)
  const finalVx = vox;
  const finalVy = voy - g * timeTotal;
  const finalSpeed = Math.sqrt(finalVx * finalVx + finalVy * finalVy);
  const finalAngleDeg = radToDeg(Math.atan2(finalVy, finalVx));

  // Energies
  const initialKineticEnergy = 0.5 * massKg * initialVelocity * initialVelocity;
  const maxPotentialEnergy = massKg * g * (maxHeight - initialHeight);

  // Target Hit calculation
  const targetErrorMeters = Math.abs(maxRange - targetDistance);
  const hitTarget = targetErrorMeters <= targetRadius;

  // Score calculation (arcade mode: up to 1000 points, centered at bullseye)
  let score = 0;
  if (hitTarget) {
    const accuracyRatio = 1 - targetErrorMeters / targetRadius;
    score = Math.round(500 + accuracyRatio * 500);
  } else {
    // Partial score for being close
    const proximity = Math.max(0, 1 - targetErrorMeters / (targetRadius * 3));
    score = Math.round(proximity * 350);
  }

  return {
    vox,
    voy,
    timeAscent,
    timeTotal,
    maxHeight,
    maxRange,
    finalVx,
    finalVy,
    finalSpeed,
    finalAngleDeg,
    initialKineticEnergy,
    maxPotentialEnergy,
    hitTarget,
    targetErrorMeters,
    score,
  };
}

/**
 * Calculates projectile instantaneous state at time t
 */
export function getParabolicAtTime(params: ParabolicParams, t: number): ParabolicInstant {
  const { initialVelocity, angleDeg, initialHeight, gravity, projectileMass } = params;
  const alphaRad = degToRad(angleDeg);
  const g = Math.max(0.01, gravity);
  const massKg = projectileMass / 1000;

  const vox = initialVelocity * Math.cos(alphaRad);
  const voy = initialVelocity * Math.sin(alphaRad);

  const results = calculateParabolicResults(params);
  const clampedT = Math.max(0, Math.min(t, results.timeTotal));

  // Horizontal position (MRU)
  const x = vox * clampedT;

  // Vertical position (MRUV under gravity)
  const y = Math.max(0, initialHeight + voy * clampedT - 0.5 * g * clampedT * clampedT);

  // Velocity components
  const vx = vox;
  const vy = voy - g * clampedT;
  const velocity = Math.sqrt(vx * vx + vy * vy);
  const currentAngleDeg = radToDeg(Math.atan2(vy, vx));

  // Energies
  const kineticEnergy = 0.5 * massKg * velocity * velocity;
  const potentialEnergy = massKg * g * y;
  const totalEnergy = kineticEnergy + potentialEnergy;

  return {
    time: clampedT,
    x,
    y,
    vx,
    vy,
    velocity,
    angleDeg: currentAngleDeg,
    kineticEnergy,
    potentialEnergy,
    totalEnergy,
  };
}

/**
 * Generates coordinate points along the theoretical trajectory arc for canvas & SVG rendering
 */
export function generateTrajectoryPath(params: ParabolicParams, samples = 120): { x: number; y: number; t: number }[] {
  const results = calculateParabolicResults(params);
  const points: { x: number; y: number; t: number }[] = [];
  if (results.timeTotal <= 0) return points;

  const dt = results.timeTotal / samples;
  for (let i = 0; i <= samples; i++) {
    const t = i * dt;
    const instant = getParabolicAtTime(params, t);
    points.push({ x: instant.x, y: instant.y, t });
  }

  return points;
}
