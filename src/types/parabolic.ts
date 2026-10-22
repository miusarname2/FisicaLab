/**
 * Types and interfaces for Parabolic Projectile Motion (Tiro Parabólico)
 */

export interface ProjectilePreset {
  id: string;
  name: string;
  description: string;
  mass: number; // in grams
  radius: number; // in meters for rendering
  color: string;
  elasticity: number; // restitution bounce factor (0.85 for ping pong)
  icon: string;
}

export interface EnvironmentPreset {
  id: string;
  name: string;
  gravity: number; // m/s^2
  icon: string;
  atmosphere: string;
}

export interface ParabolicParams {
  initialVelocity: number; // v0 in m/s (e.g. 15 m/s)
  angleDeg: number;        // alpha in degrees (e.g. 45°)
  initialHeight: number;   // y0 in meters (default 0.35m launcher height)
  gravity: number;         // g in m/s^2 (default 9.8 m/s^2)
  projectileMass: number;  // mass in grams (default 2.7g)
  projectileId: string;    // 'pingpong' | 'tennis' | 'steel' | 'custom'
  targetDistance: number;  // distance to target basket in meters
  targetHeight: number;    // height of target basket (default 0 or 1.2m)
  targetRadius: number;    // radius of target basket in meters (e.g. 0.75m)
}

export interface ParabolicInstant {
  time: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  velocity: number;
  angleDeg: number;
  kineticEnergy: number;   // in Joules
  potentialEnergy: number; // in Joules
  totalEnergy: number;     // in Joules
}

export interface ParabolicResults {
  vox: number;             // v0 * cos(alpha)
  voy: number;             // v0 * sin(alpha)
  timeAscent: number;      // voy / g
  timeTotal: number;       // total flight time
  maxHeight: number;       // y0 + voy^2 / (2g)
  maxRange: number;        // vox * timeTotal
  finalVx: number;
  finalVy: number;
  finalSpeed: number;
  finalAngleDeg: number;
  initialKineticEnergy: number; // in Joules
  maxPotentialEnergy: number;   // in Joules
  hitTarget: boolean;           // true if trajectory intersects target
  targetErrorMeters: number;    // distance difference from target center
  score: number;                // 0 to 1000
}
