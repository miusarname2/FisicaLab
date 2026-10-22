import React from 'react';
import { PhysicsParams, PhysicsInstant } from '../types/physics';
import { getPhysicsAtTime } from '../utils/physics';
import { Compass, ArrowRight, ShieldAlert, Sparkles, BookOpen, Scale } from 'lucide-react';

interface VectorVisualizerProps {
  params: PhysicsParams;
  currentTime: number;
}

export const VectorVisualizer: React.FC<VectorVisualizerProps> = ({
  params,
  currentTime,
}) => {
  const current = getPhysicsAtTime(params, currentTime);
  const gravity = 9.8; // m/s^2
  const weight = params.mass * gravity;
  const normal = weight;

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            <span>Laboratorio de Vectores y Diagrama de Cuerpo Libre (DCL)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Análisis de magnitudes vectoriales, sentidos y componentes de fuerza según las Leyes de Newton.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: Vector Velocidad */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
              <span className="font-bold text-sm text-slate-200">Vector Velocidad (v⃗)</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
              Magnitud: {current.velocity.toFixed(2)} m/s
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Representa la rapidez y el sentido del desplazamiento. En el MRUV varía linealmente en función del tiempo.
          </p>

          {/* Interactive Vector Line preview */}
          <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 mb-3">
            <div className="text-[10px] text-slate-400 font-mono mb-2">Dirección: 0° horizontal (+X)</div>
            <div className="h-6 flex items-center">
              <div 
                className="h-2 bg-emerald-400 rounded-full relative transition-all duration-100 flex items-center"
                style={{ 
                  width: `${Math.max(15, Math.min(100, (current.velocity / Math.max(1, current.acceleration * params.totalTime)) * 100))}%` 
                }}
              >
                <div className="absolute -right-1 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-emerald-400" />
              </div>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
            v⃗(t) = a · t î = ({current.acceleration.toFixed(2)} · {currentTime.toFixed(2)}) î = <strong className="text-emerald-400">{current.velocity.toFixed(2)} m/s î</strong>
          </div>
        </div>

        {/* Card 2: Vector Aceleración */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400"></span>
              <span className="font-bold text-sm text-slate-200">Vector Aceleración (a⃗)</span>
            </div>
            <span className="text-[11px] font-mono text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
              Magnitud: {current.acceleration.toFixed(2)} m/s²
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Razón de cambio de la velocidad en el tiempo. Al ser movimiento rectilíneo uniformemente acelerado, su valor es constante.
          </p>

          <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 mb-3">
            <div className="text-[10px] text-slate-400 font-mono mb-2">Dirección: 0° horizontal (+X)</div>
            <div className="h-6 flex items-center">
              <div 
                className="h-2 bg-amber-400 rounded-full relative transition-all duration-100 flex items-center"
                style={{ width: '70%' }}
              >
                <div className="absolute -right-1 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-amber-400" />
              </div>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
            a⃗ = (2d / t²) î = (2 · {params.distance} / {params.totalTime}²) î = <strong className="text-amber-400">{current.acceleration.toFixed(2)} m/s² î</strong>
          </div>
        </div>

        {/* Card 3: Vector Fuerza Neta */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-400"></span>
              <span className="font-bold text-sm text-slate-200">Vector Fuerza Neta (F⃗)</span>
            </div>
            <span className="text-[11px] font-mono text-purple-400 bg-purple-950/60 border border-purple-800/60 px-2 py-0.5 rounded">
              Magnitud: {current.force.toFixed(2)} N
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Segunda Ley de Newton: la fuerza resultante causa la aceleración del carrito con masa {params.mass} kg.
          </p>

          <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 mb-3">
            <div className="text-[10px] text-slate-400 font-mono mb-2">Dirección: colineal con la aceleración (0°)</div>
            <div className="h-6 flex items-center">
              <div 
                className="h-2 bg-purple-400 rounded-full relative transition-all duration-100 flex items-center"
                style={{ width: '80%' }}
              >
                <div className="absolute -right-1 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-purple-400" />
              </div>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
            F⃗ = m · a⃗ = ({params.mass} kg · {current.acceleration.toFixed(2)} m/s²) î = <strong className="text-purple-400">{current.force.toFixed(2)} N î</strong>
          </div>
        </div>
      </div>

      {/* Free Body Diagram Detail */}
      <div className="mt-5 p-5 bg-[#0b0f19] border border-slate-800 rounded-2xl">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Scale className="w-4 h-4 text-cyan-400" />
          <span>Equilibrio en el Eje Vertical (Y) y Tracción en el Eje Horizontal (X)</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono text-slate-300">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-slate-400 text-[11px] mb-1">Eje Y (Vertical - Equilibrio):</div>
            <div>Σ Fy = N - P = 0</div>
            <div className="text-sky-400 mt-1">Normal (N) = Peso (P) = {weight.toFixed(1)} N</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-slate-400 text-[11px] mb-1">Eje X (Horizontal - Dinámica):</div>
            <div>Σ Fx = F_tracción = m · a</div>
            <div className="text-purple-400 mt-1">F_neta = {current.force.toFixed(2)} N</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-slate-400 text-[11px] mb-1">Trabajo y Energía:</div>
            <div>W = F · x | Ek = ½ m v²</div>
            <div className="text-emerald-400 mt-1">
              W: {current.workDone.toFixed(1)} J | Ek: {current.kineticEnergy.toFixed(1)} J
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
