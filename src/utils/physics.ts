/**
 * Mathematical calculations and formulas for Uniformly Accelerated Linear Motion (MRUV)
 * and Dynamics (Newton's Second Law)
 */

import { PhysicsParams, PhysicsInstant, PresetProfile } from '../types/physics';

/**
 * Calculates acceleration based on total distance, total time, and initial velocity
 * d = v0 * t + 0.5 * a * t^2 => a = 2 * (d - v0 * t) / t^2
 */
export function calculateAcceleration(params: PhysicsParams): number {
  const { distance, totalTime, initialVelocity } = params;
  if (totalTime <= 0) return 0;
  return (2 * (distance - initialVelocity * totalTime)) / (totalTime * totalTime);
}

/**
 * Calculates full physics state at a given instant of time t
 */
export function getPhysicsAtTime(params: PhysicsParams, t: number): PhysicsInstant {
  const { mass, distance, totalTime, initialVelocity } = params;
  const clampedTime = Math.max(0, Math.min(t, totalTime));
  const acceleration = calculateAcceleration(params);
  
  // Kinematics: x(t) = v0*t + 0.5*a*t^2
  const position = Math.max(0, Math.min(
    initialVelocity * clampedTime + 0.5 * acceleration * clampedTime * clampedTime,
    distance
  ));
  
  // Velocity: v(t) = v0 + a*t
  const velocity = initialVelocity + acceleration * clampedTime;
  
  // Dynamics: F = m * a (Newton's 2nd Law)
  const force = mass * acceleration;
  
  // Energy: Ek = 0.5 * m * v^2
  const kineticEnergy = 0.5 * mass * velocity * velocity;
  
  // Work: W = F * x
  const workDone = force * position;
  
  const progress = totalTime > 0 ? clampedTime / totalTime : 0;

  return {
    time: clampedTime,
    position,
    velocity,
    acceleration,
    force,
    kineticEnergy,
    workDone,
    progress,
  };
}

/**
 * Given a position x in meters, computes the corresponding time t
 */
export function getTimeFromPosition(params: PhysicsParams, x: number): number {
  const { distance, totalTime, initialVelocity } = params;
  const clampedX = Math.max(0, Math.min(x, distance));
  const a = calculateAcceleration(params);

  if (a === 0 && initialVelocity === 0) return 0;
  
  // If v0 = 0: x = 0.5 * a * t^2 => t = sqrt(2x / a)
  if (Math.abs(initialVelocity) < 0.0001) {
    if (a <= 0) return 0;
    const t = Math.sqrt((2 * clampedX) / a);
    return Math.min(t, totalTime);
  }

  // Quadratic formula: 0.5 * a * t^2 + v0 * t - x = 0
  const A = 0.5 * a;
  const B = initialVelocity;
  const C = -clampedX;
  const discriminant = B * B - 4 * A * C;
  if (discriminant < 0) return 0;
  
  const t = (-B + Math.sqrt(discriminant)) / (2 * A);
  return Math.max(0, Math.min(t, totalTime));
}

/**
 * Generates sample data points for D3 graphs
 */
export function generateGraphData(params: PhysicsParams, sampleCount = 60) {
  const points: PhysicsInstant[] = [];
  const dt = params.totalTime / sampleCount;

  for (let i = 0; i <= sampleCount; i++) {
    const t = i * dt;
    points.push(getPhysicsAtTime(params, t));
  }

  return points;
}

/**
 * Realistic and educational presets
 */
export const PRESETS: PresetProfile[] = [
  {
    id: 'rover-mecanum',
    name: 'Rover Robótico Móvil',
    description: 'Carrito robótico con ruedas mecanum (como en el diagrama inicial). Ideal para entender cinemática básica.',
    icon: '🤖',
    params: {
      mass: 2.5,
      distance: 3.0,
      totalTime: 3.0,
      initialVelocity: 0,
    },
  },
  {
    id: 'lab-cart',
    name: 'Carrito de Laboratorio',
    description: 'Móvil de baja fricción en pista de riel con sensor óptico de tiempo y fotoceldas.',
    icon: '🔬',
    params: {
      mass: 0.8,
      distance: 2.0,
      totalTime: 2.0,
      initialVelocity: 0,
    },
  },
  {
    id: 'electric-car',
    name: 'Auto Eléctrico Deportivo',
    description: 'Aceleración rápida de 0 a 100 metros en línea recta demostrando grandes fuerzas de tracción.',
    icon: '⚡',
    params: {
      mass: 1400,
      distance: 100,
      totalTime: 4.5,
      initialVelocity: 0,
    },
  },
  {
    id: 'heavy-truck',
    name: 'Camión de Carga Pesada',
    description: 'Gran masa que ilustra la inercia: para acelerar se requiere enorme fuerza o más tiempo.',
    icon: '🚛',
    params: {
      mass: 6500,
      distance: 40,
      totalTime: 8.0,
      initialVelocity: 0,
    },
  },
];
