import React from 'react';
import { ParabolicParams, ParabolicResults } from '../types/parabolic';
import { sound } from '../utils/audio';
import { 
  Trophy, Star, RotateCcw, Sliders, LineChart, 
  X, CheckCircle, Zap, Flame, Award, Target
} from 'lucide-react';

interface ParabolicResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: ParabolicParams;
  results: ParabolicResults;
  onRestart: () => void;
  onViewCharts: () => void;
}

export const ParabolicResultsModal: React.FC<ParabolicResultsModalProps> = ({
  isOpen,
  onClose,
  params,
  results,
  onRestart,
  onViewCharts,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border-2 border-orange-500/60 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(249,115,22,0.3)] text-slate-100 flex flex-col gap-6">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Video Game Header Banner */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-950/80 border border-orange-500/50 text-orange-400 text-xs font-mono font-bold">
            <Target className="w-3.5 h-3.5" />
            <span>RESULTADOS DE BALÍSTICA & TIRO PARABÓLICO</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-amber-200">
            {results.hitTarget ? '¡EN EL BLANCO! 🎯' : '¡TIRO COMPLETADO! 🏓'}
          </h2>

          {/* Stars */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {[1, 2, 3].map((star) => {
              const active = results.hitTarget || (star <= 2 && results.targetErrorMeters < 3);
              return (
                <Star
                  key={star}
                  className={`w-6 h-6 transition-all ${
                    active ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]' : 'text-slate-700'
                  }`}
                />
              );
            })}
          </div>

          <div className="text-2xl font-black font-mono text-yellow-400 mt-2">
            +{results.score} PUNTOS
          </div>
        </div>

        {/* Stats Grid */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 grid grid-cols-2 gap-3 sm:gap-4 text-xs font-mono">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 text-[10px] block">VELOCIDAD INICIAL (v₀)</span>
            <span className="text-base font-bold text-amber-400">{params.initialVelocity} m/s</span>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 text-[10px] block">ÁNGULO DE DISPARO (α)</span>
            <span className="text-base font-bold text-purple-400">{params.angleDeg}°</span>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 text-[10px] block">V0x (HORIZONTAL MRU)</span>
            <span className="text-base font-bold text-emerald-400">{results.vox.toFixed(2)} m/s</span>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 text-[10px] block">V0y (VERTICAL INICIAL)</span>
            <span className="text-base font-bold text-purple-400">{results.voy.toFixed(2)} m/s</span>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 text-[10px] block">ALTURA MÁXIMA (Ymax)</span>
            <span className="text-base font-bold text-sky-400">{results.maxHeight.toFixed(2)} m</span>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 text-[10px] block">ALCANCE TOTAL (Xmax)</span>
            <span className="text-base font-bold text-orange-400">{results.maxRange.toFixed(2)} m</span>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 text-[10px] block">TIEMPO TOTAL DE VUELO</span>
            <span className="text-base font-bold text-cyan-400">{results.timeTotal.toFixed(2)} s</span>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
            <span className="text-slate-400 text-[10px] block">PRESIÓN DE ACIERTO</span>
            <span className={`text-base font-bold ${results.hitTarget ? 'text-emerald-400' : 'text-slate-300'}`}>
              {results.hitTarget ? '🎯 ¡Dentro de canasta!' : `Error: ${results.targetErrorMeters.toFixed(1)}m`}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onRestart();
              onClose();
            }}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>DISPARAR DE NUEVO</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
              onViewCharts();
            }}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all cursor-pointer"
          >
            <LineChart className="w-4 h-4 text-cyan-400" />
            <span>VER GRÁFICAS D3</span>
          </button>
        </div>
      </div>
    </div>
  );
};
