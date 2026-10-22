import React, { useState } from 'react';
import { PhysicsParams, PhysicsInstant } from '../types/physics';
import { generateGraphData } from '../utils/physics';
import { 
  Trophy, Star, RotateCcw, Sliders, BarChart2, 
  X, CheckCircle, Zap, Flame, Award, ChevronRight, ChevronLeft,
  Activity, TrendingUp, Layers, Target
} from 'lucide-react';
import { sound } from '../utils/audio';

interface VictoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: PhysicsParams;
  finalPhysics: PhysicsInstant;
  onRestart: () => void;
  onOpenConfig: () => void;
  onViewCharts: () => void;
  onNextExperiment?: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  onClose,
  params,
  finalPhysics,
  onRestart,
  onOpenConfig,
  onViewCharts,
  onNextExperiment,
}) => {
  const [activeSlide, setActiveSlide] = useState<'stats' | 'charts'>('stats');

  if (!isOpen) return null;

  const {
    velocity: finalVelocity,
    acceleration,
    force,
    workDone,
    kineticEnergy,
  } = finalPhysics;

  const initialVelocity = params.initialVelocity || 0;
  const kmh = (finalVelocity * 3.6).toFixed(1);

  // Score computation
  const baseScore = Math.round(10000 / Math.max(0.5, params.totalTime));
  const dynamicBonus = Math.round(kineticEnergy * 2);
  const totalScore = Math.min(99999, baseScore + dynamicBonus);

  // Sample data for embedded charts
  const points = generateGraphData(params, 40);

  const handleNextSlide = () => {
    sound.playClick();
    setActiveSlide('charts');
  };

  const handlePrevSlide = () => {
    sound.playClick();
    setActiveSlide('stats');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div 
        className="relative w-full max-w-2xl my-4 sm:my-6 bg-gradient-to-b from-[#0f172a] to-[#070b14] border-2 border-yellow-500/40 rounded-3xl shadow-[0_0_50px_rgba(234,179,8,0.25)] overflow-hidden text-white transition-all flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Gold Banner */}
        <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 py-2.5 px-6 text-center text-slate-950 font-black text-xs uppercase tracking-widest flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Award className="w-4 h-4 fill-current" />
            <span>¡Misión Cumplida · Meta Alcanzada!</span>
          </div>

          {/* Lateral Slide Switcher Indicator */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSlide('stats')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-all ${
                activeSlide === 'stats'
                  ? 'bg-slate-950 text-yellow-300'
                  : 'bg-slate-950/40 text-slate-900 hover:text-white'
              }`}
            >
              1. Datos
            </button>
            <button
              type="button"
              onClick={() => setActiveSlide('charts')}
              className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-all ${
                activeSlide === 'charts'
                  ? 'bg-slate-950 text-yellow-300'
                  : 'bg-slate-950/40 text-slate-900 hover:text-white'
              }`}
            >
              2. Gráficas ➔
            </button>
          </div>
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-3.5 right-3.5 p-2 text-slate-400 hover:text-white rounded-full bg-slate-900/80 hover:bg-slate-800 transition-colors z-20"
          title="Cerrar cuadro"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Lateral Slide Container */}
        <div className="relative overflow-hidden w-full">
          <div 
            className="flex w-[200%] transition-transform duration-500 ease-out"
            style={{ transform: activeSlide === 'stats' ? 'translateX(0%)' : 'translateX(-50%)' }}
          >
            {/* =========================================================================
                SLIDE 1: PUNTUACIÓN & DATOS FÍSICOS NUMÉRICOS
               ========================================================================= */}
            <div className="w-1/2 p-6 sm:p-7 flex flex-col justify-between shrink-0">
              {/* Header & Stars */}
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 mb-2 shadow-inner">
                  <Trophy className="w-7 h-7 fill-yellow-400" />
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
                  Resultados de la Prueba
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Registro cinemático y dinámico completo del recorrido
                </p>

                <div className="flex items-center justify-center gap-1.5 mt-2">
                  {[1, 2, 3].map((star) => (
                    <Star 
                      key={star} 
                      className="w-5 h-5 fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] animate-pulse" 
                    />
                  ))}
                </div>

                <div className="mt-2.5 inline-block bg-slate-950/80 border border-yellow-500/30 rounded-xl px-5 py-1.5">
                  <div className="text-[9px] font-mono text-yellow-400 uppercase tracking-widest font-bold">
                    Puntaje de Rendimiento
                  </div>
                  <div className="text-xl sm:text-2xl font-black font-mono text-yellow-300 tabular-nums">
                    {totalScore.toLocaleString()} <span className="text-xs font-normal text-slate-400">PTS</span>
                  </div>
                </div>
              </div>

              {/* Numerical Matrix */}
              <div className="space-y-2 mb-4">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between border-b border-slate-800 pb-1">
                  <span>Parámetro Físico</span>
                  <span>Valor Medido</span>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">v₀:</span>
                    <span className="font-bold text-slate-200 tabular-nums">{initialVelocity.toFixed(2)} m/s</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
                    <span className="text-emerald-300 font-medium">v_final:</span>
                    <span className="font-bold text-emerald-400 tabular-nums">{finalVelocity.toFixed(2)} m/s ({kmh} km/h)</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center justify-between">
                    <span className="text-amber-300 font-medium">a:</span>
                    <span className="font-bold text-amber-400 tabular-nums">{acceleration.toFixed(2)} m/s²</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/40 flex items-center justify-between">
                    <span className="text-purple-300 font-medium">F_neta:</span>
                    <span className="font-bold text-purple-400 tabular-nums">{force.toFixed(2)} N</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Masa (m):</span>
                    <span className="font-bold text-slate-200 tabular-nums">{params.mass} kg</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Distancia (d):</span>
                    <span className="font-bold text-cyan-400 tabular-nums">{params.distance} m</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Tiempo (t):</span>
                    <span className="font-bold text-cyan-400 tabular-nums">{params.totalTime} s</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Energía (Ek):</span>
                    <span className="font-bold text-slate-200 tabular-nums">{kineticEnergy.toFixed(1)} J</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons & Lateral Next Arrow */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      onRestart();
                      onClose();
                    }}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs bg-yellow-400 hover:bg-yellow-300 text-slate-950 transition-all shadow-md active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Repetir</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      onOpenConfig();
                      onClose();
                    }}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all active:scale-95 cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Configurar</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {onNextExperiment && (
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        onClose();
                        onNextExperiment();
                      }}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl font-black text-xs bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 shadow-lg shadow-orange-500/25 transition-all active:scale-95 cursor-pointer"
                      title="Pasar al Experimento de Tiro Parabólico"
                    >
                      <Target className="w-3.5 h-3.5" />
                      <span>Siguiente Experimento ➔</span>
                    </button>
                  )}

                  {/* Lateral Arrow to Slide to Charts */}
                  <button
                    type="button"
                    onClick={handleNextSlide}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer"
                  >
                    <span>Ver Gráficos</span>
                    <ChevronRight className="w-4 h-4 animate-pulse" />
                  </button>
                </div>
              </div>
            </div>

            {/* =========================================================================
                SLIDE 2: ANÁLISIS GRÁFICO (DESPLAZAMIENTO LATERAL / CAROUSEL)
               ========================================================================= */}
            <div className="w-1/2 p-6 sm:p-7 flex flex-col justify-between shrink-0 bg-[#080d19]">
              <div>
                {/* Header with Back Arrow */}
                <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                  <button
                    type="button"
                    onClick={handlePrevSlide}
                    className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-950/60 border border-cyan-800/40 px-3 py-1 rounded-xl transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Volver a Datos</span>
                  </button>

                  <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span>Curvas Cinemáticas del Recorrido</span>
                  </span>
                </div>

                {/* 4 Clean SVG Graphic Plots */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Graph 1: v(t) */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5">
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className="text-slate-400">v(t) = a · t</span>
                      <span className="font-bold text-emerald-400">{finalVelocity.toFixed(1)} m/s</span>
                    </div>
                    <svg viewBox="0 0 140 50" className="w-full h-14 overflow-visible">
                      <line x1="15" y1="5" x2="15" y2="45" stroke="#334155" strokeWidth="1" />
                      <line x1="15" y1="45" x2="135" y2="45" stroke="#334155" strokeWidth="1" />
                      {/* Linear curve */}
                      <line x1="15" y1="45" x2="135" y2="10" stroke="#10b981" strokeWidth="2.5" />
                      <circle cx="135" cy="10" r="3.5" fill="#10b981" />
                    </svg>
                    <div className="text-[9px] text-slate-500 font-mono text-center">Velocidad Lineal</div>
                  </div>

                  {/* Graph 2: a(t) */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5">
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className="text-slate-400">a(t) = cte</span>
                      <span className="font-bold text-amber-400">{acceleration.toFixed(1)} m/s²</span>
                    </div>
                    <svg viewBox="0 0 140 50" className="w-full h-14 overflow-visible">
                      <line x1="15" y1="5" x2="15" y2="45" stroke="#334155" strokeWidth="1" />
                      <line x1="15" y1="45" x2="135" y2="45" stroke="#334155" strokeWidth="1" />
                      {/* Constant horizontal line */}
                      <line x1="15" y1="22" x2="135" y2="22" stroke="#f59e0b" strokeWidth="2.5" />
                      <circle cx="135" cy="22" r="3.5" fill="#f59e0b" />
                    </svg>
                    <div className="text-[9px] text-slate-500 font-mono text-center">Aceleración Constante</div>
                  </div>

                  {/* Graph 3: F(t) */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5">
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className="text-slate-400">F(t) = m · a</span>
                      <span className="font-bold text-purple-400">{force.toFixed(1)} N</span>
                    </div>
                    <svg viewBox="0 0 140 50" className="w-full h-14 overflow-visible">
                      <line x1="15" y1="5" x2="15" y2="45" stroke="#334155" strokeWidth="1" />
                      <line x1="15" y1="45" x2="135" y2="45" stroke="#334155" strokeWidth="1" />
                      {/* Constant Force line */}
                      <line x1="15" y1="20" x2="135" y2="20" stroke="#c084fc" strokeWidth="2.5" />
                      <circle cx="135" cy="20" r="3.5" fill="#c084fc" />
                    </svg>
                    <div className="text-[9px] text-slate-500 font-mono text-center">Fuerza Neta Constante</div>
                  </div>

                  {/* Graph 4: x(t) */}
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5">
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className="text-slate-400">x(t) = ½ · a · t²</span>
                      <span className="font-bold text-blue-400">{params.distance} m</span>
                    </div>
                    <svg viewBox="0 0 140 50" className="w-full h-14 overflow-visible">
                      <line x1="15" y1="5" x2="15" y2="45" stroke="#334155" strokeWidth="1" />
                      <line x1="15" y1="45" x2="135" y2="45" stroke="#334155" strokeWidth="1" />
                      {/* Quadratic parabolic curve */}
                      <path d="M 15 45 Q 75 42 135 10" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                      <circle cx="135" cy="10" r="3.5" fill="#38bdf8" />
                    </svg>
                    <div className="text-[9px] text-slate-500 font-mono text-center">Desplazamiento Parabólico</div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions for Slide 2 */}
              <div className="flex items-center justify-between gap-3 pt-3 mt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handlePrevSlide}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 rounded-xl transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Volver a Datos</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onViewCharts();
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl shadow-md transition-all active:scale-95"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>Abrir Gráficas Interactivas D3</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
