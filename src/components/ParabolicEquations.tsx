import React, { useState } from 'react';
import { ParabolicParams } from '../types/parabolic';
import { calculateParabolicResults, degToRad } from '../utils/parabolic';
import { BookOpen, Sparkles, CheckCircle2, ChevronRight, Calculator, Layers } from 'lucide-react';

interface ParabolicEquationsProps {
  params: ParabolicParams;
}

export const ParabolicEquations: React.FC<ParabolicEquationsProps> = ({ params }) => {
  const [activeTab, setActiveTab] = useState<'cinematica' | 'energia' | 'trayectoria'>('cinematica');
  const results = calculateParabolicResults(params);

  const v0 = params.initialVelocity;
  const theta = params.angleDeg;
  const g = params.gravity;
  const y0 = params.initialHeight;
  const m = params.projectileMass / 1000; // in kg

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <h3 className="text-lg sm:text-xl font-black text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-orange-400" />
            Modelo Matemático & Demostración de Ecuaciones
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Deducción formal de cinemática vectorial 2D para la presentación académica (UCC · Física Mecánica).
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('cinematica')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'cinematica' ? 'bg-orange-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Cinemática Vectorial
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('trayectoria')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'trayectoria' ? 'bg-orange-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Ecuación Trayectoria y(x)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('energia')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === 'energia' ? 'bg-orange-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Energía & Momento
          </button>
        </div>
      </div>

      {/* Tab 1: Cinemática Vectorial */}
      {activeTab === 'cinematica' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Descomposición de la Velocidad */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-emerald-400">
              <span>1. DESCOMPOSICIÓN DE VELOCIDAD</span>
              <span>MRU / MRUV</span>
            </div>
            <div className="space-y-2 text-xs font-mono bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 text-slate-200">
              <div>
                <span className="text-slate-400">v₀ₓ = v₀ · cos(α)</span>
                <div className="text-emerald-400 font-bold">
                  = {v0} · cos({theta}°) = {results.vox.toFixed(3)} m/s
                </div>
              </div>
              <div className="pt-1 border-t border-slate-800">
                <span className="text-slate-400">v₀ᵧ = v₀ · sin(α)</span>
                <div className="text-purple-400 font-bold">
                  = {v0} · sin({theta}°) = {results.voy.toFixed(3)} m/s
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              En el eje X no hay aceleración (aₓ = 0), por lo que la velocidad horizontal permanece estrictamente constante durante todo el vuelo.
            </p>
          </div>

          {/* Card 2: Altura Máxima */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-sky-400">
              <span>2. ALTURA MÁXIMA (Ymax)</span>
              <span>vᵧ = 0</span>
            </div>
            <div className="space-y-2 text-xs font-mono bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 text-slate-200">
              <div className="text-slate-400">Ymax = y₀ + (v₀ᵧ)² / (2 · g)</div>
              <div className="text-sky-400 font-bold">
                = {y0} + ({results.voy.toFixed(2)})² / (2 · {g})
              </div>
              <div className="text-base font-bold text-white pt-1 border-t border-slate-800">
                = {results.maxHeight.toFixed(3)} metros
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Ocurre en el instante de subida t = v₀ᵧ / g = {(results.timeAscent).toFixed(2)}s, cuando la componente vertical de la velocidad se anula transitoriamente.
            </p>
          </div>

          {/* Card 3: Tiempo de Vuelo y Alcance */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-400">
              <span>3. ALCANCE HORIZONTAL (Xmax)</span>
              <span>y(t) = 0</span>
            </div>
            <div className="space-y-2 text-xs font-mono bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 text-slate-200">
              <div className="text-slate-400">t_vuelo = [v₀ᵧ + √(v₀ᵧ² + 2gy₀)] / g</div>
              <div className="text-cyan-400 font-bold">
                t_total = {results.timeTotal.toFixed(3)} s
              </div>
              <div className="text-slate-400 pt-1 border-t border-slate-800">
                Xmax = v₀ₓ · t_vuelo
              </div>
              <div className="text-base font-bold text-amber-400">
                = {results.vox.toFixed(2)} · {results.timeTotal.toFixed(2)} = {results.maxRange.toFixed(3)} m
              </div>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Para ángulo óptimo de 45° en terreno plano (y₀ = 0), el alcance máximo alcanza el valor teórico v₀² / g = {((v0 * v0) / g).toFixed(2)}m.
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Ecuación de la Trayectoria */}
      {activeTab === 'trayectoria' && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-200 font-mono">
              Ecuación Explícita de la Parábola y = f(x)
            </h4>
            <span className="text-xs text-orange-400 font-mono font-bold">Eliminación del Parámetro Tiempo (t)</span>
          </div>

          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 font-mono text-sm space-y-3">
            <div className="text-slate-400 text-xs">
              De x = v₀ · cos(α) · t  ⟹  <strong className="text-white">t = x / (v₀ · cos(α))</strong>
            </div>
            <div className="text-slate-400 text-xs">
              Sustituyendo t en y(t) = y₀ + v₀ · sin(α) · t - 0.5 · g · t²:
            </div>
            <div className="text-base font-bold text-amber-400 bg-slate-950 p-3 rounded-lg border border-amber-500/30">
              y(x) = y₀ + x · tan(α) - [ g / (2 · v₀² · cos²(α)) ] · x²
            </div>
            <div className="text-xs text-slate-300 pt-2 border-t border-slate-800">
              Con tus datos actuales (v₀ = {v0} m/s, α = {theta}°, g = {g} m/s²):
              <div className="font-bold text-cyan-400 text-sm mt-1">
                y(x) = {y0.toFixed(2)} + {Math.tan(degToRad(theta)).toFixed(3)} · x - {(g / (2 * v0 * v0 * Math.pow(Math.cos(degToRad(theta)), 2))).toFixed(5)} · x²
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Energía y Momento */}
      {activeTab === 'energia' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-mono font-bold text-orange-400">
              CONSERVACIÓN DE ENERGÍA MECÁNICA
            </h4>
            <div className="space-y-2 text-xs font-mono bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 text-slate-200">
              <div>
                <span className="text-slate-400">Energía Cinética Inicial (Ek0):</span>
                <div className="text-orange-400 font-bold">
                  Ek0 = 0.5 · m · v₀² = 0.5 · {m.toFixed(4)}kg · ({v0})² = {results.initialKineticEnergy.toFixed(4)} Joules
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <span className="text-slate-400">Energía Potencial en la Cumbre (Ep_max):</span>
                <div className="text-sky-400 font-bold">
                  Ep = m · g · Ymax = {m.toFixed(4)} · {g} · {results.maxHeight.toFixed(2)} = {(m * g * results.maxHeight).toFixed(4)} Joules
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-mono font-bold text-emerald-400">
              CANTIDAD DE MOVIMIENTO (MOMENTO LINEAL)
            </h4>
            <div className="space-y-2 text-xs font-mono bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 text-slate-200">
              <div>
                <span className="text-slate-400">Momento Inicial (p = m · v):</span>
                <div className="text-emerald-400 font-bold">
                  p₀ = {m.toFixed(4)} kg · {v0} m/s = {(m * v0).toFixed(4)} kg·m/s
                </div>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <span className="text-slate-400">Fuerza Media de Impulso del Cañón (Δt ≈ 0.05s):</span>
                <div className="text-white font-bold">
                  F_media = Δp / Δt = {(m * v0).toFixed(4)} / 0.05 ≈ {((m * v0) / 0.05).toFixed(2)} Newtons
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
