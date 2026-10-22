import React from 'react';
import { PhysicsParams } from '../types/physics';
import { calculateAcceleration } from '../utils/physics';
import { Sliders, Weight, Ruler, Clock, Zap, Info } from 'lucide-react';

interface ControlDeckProps {
  params: PhysicsParams;
  onParamsChange: (newParams: PhysicsParams) => void;
}

export const ControlDeck: React.FC<ControlDeckProps> = ({
  params,
  onParamsChange,
}) => {
  const acceleration = calculateAcceleration(params);
  const finalVel = acceleration * params.totalTime;
  const force = params.mass * acceleration;

  const updateField = (field: keyof PhysicsParams, value: number) => {
    onParamsChange({
      ...params,
      [field]: Math.max(0.1, value),
    });
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Panel de Variables Dinámicas (Manipulación en Tiempo Real)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Ajusta la masa, distancia o tiempo deslizando para observar inmediatamente el cambio en las fuerzas y aceleración.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Masa (m) */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Weight className="w-4 h-4 text-cyan-400" />
              <label className="text-xs font-bold text-slate-200">Masa del Móvil (m)</label>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400 tabular-nums">
              {params.mass} kg
            </span>
          </div>

          <input
            type="range"
            min="0.2"
            max="100"
            step="0.1"
            value={params.mass}
            onChange={(e) => updateField('mass', parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 mb-3"
          />

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>0.2 kg (Ligero)</span>
            <span>100 kg (Pesado)</span>
          </div>

          <p className="text-[11px] text-slate-400 mt-2 bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
            💡 <strong>Inercia:</strong> A mayor masa, se requiere mayor fuerza <code className="text-purple-300">F = m · a</code> para la misma aceleración.
          </p>
        </div>

        {/* Distancia (d) */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-blue-400" />
              <label className="text-xs font-bold text-slate-200">Distancia Total (d)</label>
            </div>
            <span className="text-xs font-mono font-bold text-blue-400 tabular-nums">
              {params.distance} m
            </span>
          </div>

          <input
            type="range"
            min="1"
            max="100"
            step="0.5"
            value={params.distance}
            onChange={(e) => updateField('distance', parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-400 mb-3"
          />

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>1 m (Riel corto)</span>
            <span>100 m (Pista larga)</span>
          </div>

          <p className="text-[11px] text-slate-400 mt-2 bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
            💡 <strong>Desplazamiento:</strong> Para recorrer más distancia en el mismo tiempo, la aceleración debe aumentar proporcionalmente.
          </p>
        </div>

        {/* Tiempo (t) */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <label className="text-xs font-bold text-slate-200">Tiempo de Recorrido (t)</label>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 tabular-nums">
              {params.totalTime} s
            </span>
          </div>

          <input
            type="range"
            min="0.5"
            max="30"
            step="0.1"
            value={params.totalTime}
            onChange={(e) => updateField('totalTime', parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400 mb-3"
          />

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>0.5 s (Rápido)</span>
            <span>30 s (Lento)</span>
          </div>

          <p className="text-[11px] text-slate-400 mt-2 bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
            💡 <strong>Tiempo cuadrático:</strong> La aceleración depende inversamente de <code className="text-amber-300">t²</code> (<code className="text-amber-300">a = 2d / t²</code>).
          </p>
        </div>
      </div>
    </div>
  );
};
