import React from 'react';
import { 
  ParabolicParams, 
  ProjectilePreset, 
  EnvironmentPreset 
} from '../types/parabolic';
import { 
  PROJECTILE_PRESETS, 
  ENVIRONMENT_PRESETS, 
  calculateParabolicResults 
} from '../utils/parabolic';
import { sound } from '../utils/audio';
import { 
  Sliders, Compass, Zap, Target, ArrowUpRight, 
  Scale, Globe, Sparkles, Activity, Layers
} from 'lucide-react';

interface ParabolicControlDeckProps {
  params: ParabolicParams;
  onParamsChange: (newParams: ParabolicParams) => void;
}

export const ParabolicControlDeck: React.FC<ParabolicControlDeckProps> = ({
  params,
  onParamsChange,
}) => {
  const results = calculateParabolicResults(params);

  const handleProjectileSelect = (preset: ProjectilePreset) => {
    sound.playClick();
    onParamsChange({
      ...params,
      projectileId: preset.id,
      projectileMass: preset.mass,
    });
  };

  const handleEnvironmentSelect = (env: EnvironmentPreset) => {
    sound.playClick();
    onParamsChange({
      ...params,
      gravity: env.gravity,
    });
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <h3 className="text-lg sm:text-xl font-black text-slate-100 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-orange-400" />
            Personalización de Balística & Parámetros
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Ajusta en tiempo real el proyectil, ángulo del cañón, velocidad inicial y gravedad ambiental.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            Ecuaciones de Cinemática 2D
          </span>
        </div>
      </div>

      {/* 1. Projectile Customizer (Pelota de Ping Pong, etc.) */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
          <Scale className="w-4 h-4 text-orange-400" />
          1. SELECCIONA EL PROYECTIL (MASA E INERCIA)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PROJECTILE_PRESETS.map((preset) => {
            const isSelected = params.projectileId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleProjectileSelect(preset)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'bg-orange-500/15 border-orange-500/60 shadow-[0_0_15px_rgba(249,115,22,0.2)]'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xl">{preset.icon}</span>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                    isSelected ? 'bg-orange-500/30 text-orange-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {preset.mass} g
                  </span>
                </div>
                <div className="font-bold text-slate-200 text-xs">{preset.name}</div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                  {preset.description}
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Mass fine-tuner */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-400">Ajuste fino de masa del proyectil:</span>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="1"
              max="200"
              step="0.5"
              value={params.projectileMass}
              onChange={(e) => onParamsChange({ ...params, projectileMass: parseFloat(e.target.value) })}
              className="w-36 accent-orange-500 cursor-pointer"
            />
            <span className="font-mono font-bold text-orange-400 tabular-nums">
              {params.projectileMass} gramos
            </span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Launch Angle (alpha) */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-purple-400" />
              Ángulo de Elevación (α)
            </span>
            <span className="text-sm font-mono font-bold text-purple-400 tabular-nums">
              {params.angleDeg}°
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="85"
            step="1"
            value={params.angleDeg}
            onChange={(e) => onParamsChange({ ...params, angleDeg: parseInt(e.target.value) })}
            className="w-full accent-purple-500 cursor-pointer"
          />
          <div className="flex items-center justify-between gap-1">
            {[15, 30, 45, 60, 75].map((ang) => (
              <button
                key={ang}
                type="button"
                onClick={() => {
                  sound.playClick();
                  onParamsChange({ ...params, angleDeg: ang });
                }}
                className={`px-2 py-1 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer ${
                  params.angleDeg === ang
                    ? 'bg-purple-500 text-slate-950'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {ang}°
              </button>
            ))}
          </div>
        </div>

        {/* Initial Velocity (v0) */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              Velocidad Inicial (v₀)
            </span>
            <span className="text-sm font-mono font-bold text-amber-400 tabular-nums">
              {params.initialVelocity} m/s
            </span>
          </div>
          <input
            type="range"
            min="6"
            max="35"
            step="0.5"
            value={params.initialVelocity}
            onChange={(e) => onParamsChange({ ...params, initialVelocity: parseFloat(e.target.value) })}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>6 m/s (Suave)</span>
            <span>20 m/s</span>
            <span>35 m/s (Potente)</span>
          </div>
        </div>

        {/* Target Distance (d) */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-orange-400" />
              Distancia a la Canasta (d)
            </span>
            <span className="text-sm font-mono font-bold text-orange-400 tabular-nums">
              {params.targetDistance} m
            </span>
          </div>
          <input
            type="range"
            min="8"
            max="45"
            step="1"
            value={params.targetDistance}
            onChange={(e) => onParamsChange({ ...params, targetDistance: parseInt(e.target.value) })}
            className="w-full accent-orange-500 cursor-pointer"
          />
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>8 m (Cerca)</span>
            <span>25 m</span>
            <span>45 m (Lejano)</span>
          </div>
        </div>
      </div>

      {/* 3. Environment & Gravity Selector */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-3">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          GRAVEDAD AMBIENTAL (g)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {ENVIRONMENT_PRESETS.map((env) => {
            const isSelected = Math.abs(params.gravity - env.gravity) < 0.1;
            return (
              <button
                key={env.id}
                type="button"
                onClick={() => handleEnvironmentSelect(env)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <span>{env.icon} {env.name}</span>
                  <span className="font-mono text-cyan-400">{env.gravity}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 truncate">{env.atmosphere}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Real-Time Theoretical Result Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
        <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-3">
          <span className="text-[10px] font-mono text-slate-400">V0x (HORIZONTAL)</span>
          <div className="text-base font-mono font-bold text-emerald-400 mt-0.5">
            {results.vox.toFixed(2)} <span className="text-xs font-normal text-slate-500">m/s</span>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-3">
          <span className="text-[10px] font-mono text-slate-400">V0y (VERTICAL)</span>
          <div className="text-base font-mono font-bold text-purple-400 mt-0.5">
            {results.voy.toFixed(2)} <span className="text-xs font-normal text-slate-500">m/s</span>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-3">
          <span className="text-[10px] font-mono text-slate-400">ALTURA MÁXIMA (Ymax)</span>
          <div className="text-base font-mono font-bold text-sky-400 mt-0.5">
            {results.maxHeight.toFixed(2)} <span className="text-xs font-normal text-slate-500">m</span>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-3">
          <span className="text-[10px] font-mono text-slate-400">ALCANCE MÁXIMO (Xmax)</span>
          <div className="text-base font-mono font-bold text-amber-400 mt-0.5">
            {results.maxRange.toFixed(2)} <span className="text-xs font-normal text-slate-500">m</span>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-3">
          <span className="text-[10px] font-mono text-slate-400">TIEMPO VUELO (tvuelo)</span>
          <div className="text-base font-mono font-bold text-cyan-400 mt-0.5">
            {results.timeTotal.toFixed(2)} <span className="text-xs font-normal text-slate-500">s</span>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-3">
          <span className="text-[10px] font-mono text-slate-400">ENERGÍA CINÉTICA (Ek0)</span>
          <div className="text-base font-mono font-bold text-orange-400 mt-0.5">
            {results.initialKineticEnergy.toFixed(3)} <span className="text-xs font-normal text-slate-500">J</span>
          </div>
        </div>
      </div>
    </div>
  );
};
