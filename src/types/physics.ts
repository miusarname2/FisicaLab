/**
 * Types and interfaces for Physics Kinematics and Dynamics Simulator
 */

export interface PhysicsParams {
  mass: number;        // kg (m)
  distance: number;    // meters (d)
  totalTime: number;   // seconds (t)
  initialVelocity: number; // m/s (v0, defaults to 0)
}

export interface PhysicsInstant {
  time: number;        // current time t (s)
  position: number;    // x(t) in meters
  velocity: number;    // v(t) in m/s
  acceleration: number;// a(t) in m/s^2
  force: number;       // F = m * a in Newtons (N)
  kineticEnergy: number; // Ek = 0.5 * m * v^2 in Joules (J)
  workDone: number;    // W = F * x in Joules (J)
  progress: number;    // 0 to 1
}

export interface PresetProfile {
  id: string;
  name: string;
  description: string;
  icon: string;
  params: PhysicsParams;
}

export type ViewMode = '2D' | '3D';
