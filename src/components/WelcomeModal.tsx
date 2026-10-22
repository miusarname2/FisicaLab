import React, { useState } from 'react';
import { PhysicsParams, ViewMode } from '../types/physics';
import { calculateAcceleration } from '../utils/physics';
import { sound } from '../utils/audio';
import { Car3DViewer } from './Car3DViewer';
import { 
  Play, Sparkles, ChevronRight, ChevronLeft, 
  Rotate3d, Layers, Ruler, Weight, Clock, Gauge,
  Zap, Flag, Trophy, CheckCircle2, Flame
} from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: PhysicsParams;
  onConfirm: (newParams: PhysicsParams, mode: ViewMode) => void;
  currentMode: ViewMode;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  params,
  onConfirm,
  currentMode,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [localParams, setLocalParams] = useState<PhysicsParams>(params);
  const [selectedMode, setSelectedMode] = useState<ViewMode>(currentMode);
  const [previewDimension, setPreviewDimension] = useState<'2D' | '3D'>('2D');

  if (!isOpen) return null;

  // Visual scale factor based on mass: scales up visually with heavier mass
  const massScale = Math.min(1.4, Math.max(0.85, 0.85 + Math.log10(Math.max(0.5, localParams.mass)) * 0.35));

  // Calculated physics stats
  const acceleration = calculateAcceleration(localParams);
  const finalVelocity = localParams.initialVelocity + acceleration * localParams.totalTime;
  const force = localParams.mass * acceleration;
  const kineticEnergy = 0.5 * localParams.mass * finalVelocity * finalVelocity;
  const kmh = finalVelocity * 3.6;

  const handleNextStep = () => {
    sound.playClick();
    if (step < 3) {
      setStep((step + 1) as 1 | 2 | 3);
    }
  };

  const handlePrevStep = () => {
    sound.playClick();
    if (step > 1) {
      setStep((step - 1) as 1 | 2 | 3);
    }
  };

  const handleStartSimulation = () => {
    sound.playBrumm(0.9);
    onConfirm(localParams, selectedMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="w-full max-w-2xl my-6 bg-slate-900 border-2 border-cyan-500/30 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden transition-all text-white flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Video Game Header & Step Indicator */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Configuración de Carrera · Paso {step} de 3</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5">
              {step === 1 && '1. Tu Móvil y su Masa (Inercia)'}
              {step === 2 && '2. Selecciona el largo de tu pista'}
              {step === 3 && '3. Tiempo de Carrera y Estadísticas'}
            </h2>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-3 h-3 rounded-full transition-all ${
                  step === s
                    ? 'bg-cyan-400 ring-4 ring-cyan-400/20 scale-110'
                    : s < step
                    ? 'bg-emerald-400'
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Modal Body: STEP CONTENT */}
        <div className="p-6 flex-1 flex flex-col justify-between">
          {/* =========================================================================
              STEP 1: EL MÓVIL Y SU MASA (GARAJE INTERACTIVO CON 2D/3D & ESCALA VISUAL)
             ========================================================================= */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              {/* Preview Mode Selector (2D vs 3D Orbit) */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">
                  Inspecciona tu móvil y ajusta su peso
                </span>
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setPreviewDimension('2D');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      previewDimension === '2D'
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Layers className="w-3 h-3" />
                    <span>2D</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setPreviewDimension('3D');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      previewDimension === '3D'
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Rotate3d className="w-3 h-3" />
                    <span>Inspeccionar 3D (360°)</span>
                  </button>
                </div>
              </div>

              {/* Showcase Center Stage */}
              <div className="w-full h-56 sm:h-64 bg-gradient-to-b from-slate-950 to-[#070b14] border border-slate-800 rounded-2xl flex items-center justify-center relative overflow-hidden shadow-inner">
                {previewDimension === '2D' ? (
                  /* 2D Robot Cart with dynamic visual mass growth */
                  <div 
                    className="flex flex-col items-center transition-transform duration-300 relative select-none"
                    style={{ transform: `scale(${massScale})` }}
                  >
                    {/* Shadow */}
                    <div className="w-36 h-4 bg-black/70 rounded-[100%] mx-auto blur-[3px] -mb-1" />

                    {/* Robot Cart SVG */}
                    <svg width="170" height="110" viewBox="0 0 170 110" fill="none" className="drop-shadow-xl">
                      {/* Top PCB Module */}
                      <rect x="52" y="16" width="66" height="14" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                      {Array.from({ length: 9 }).map((_, i) => (
                        <rect key={i} x={56 + i * 6.5} y="12" width="2.5" height="5" fill="#f59e0b" rx="0.5" />
                      ))}
                      {/* Jumper Wires */}
                      <path d="M 98 16 C 98 6, 118 6, 118 30" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                      <path d="M 90 16 C 90 8, 108 8, 110 30" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" fill="none" />
                      {/* White Rover Chassis */}
                      <rect x="20" y="28" width="130" height="46" rx="14" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
                      {/* Red Center Button / Sensor */}
                      <circle cx="85" cy="51" r="11" fill="#dc2626" />
                      <circle cx="85" cy="51" r="8" fill="#ef4444" />
                      <circle cx="82" cy="48" r="2.5" fill="#fca5a5" />
                      {/* Mecanum Wheels */}
                      <g transform="translate(42, 68)">
                        <circle cx="0" cy="0" r="24" fill="#0f172a" stroke="#1e293b" strokeWidth="2" />
                        {Array.from({ length: 8 }).map((_, i) => (
                          <g key={i} transform={`rotate(${i * 45})`}>
                            <rect x="-4" y="-25" width="8" height="8" rx="2" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
                          </g>
                        ))}
                        <circle cx="0" cy="0" r="13" fill="#eab308" />
                        <circle cx="0" cy="0" r="9" fill="#0f172a" />
                        <circle cx="0" cy="0" r="4" fill="#f8fafc" />
                      </g>
                      <g transform="translate(128, 68)">
                        <circle cx="0" cy="0" r="24" fill="#0f172a" stroke="#1e293b" strokeWidth="2" />
                        {Array.from({ length: 8 }).map((_, i) => (
                          <g key={i} transform={`rotate(${i * 45})`}>
                            <rect x="-4" y="-25" width="8" height="8" rx="2" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
                          </g>
                        ))}
                        <circle cx="0" cy="0" r="13" fill="#eab308" />
                        <circle cx="0" cy="0" r="9" fill="#0f172a" />
                        <circle cx="0" cy="0" r="4" fill="#f8fafc" />
                      </g>
                    </svg>

                    {/* Weight badge on vehicle */}
                    <div className="absolute -top-3 px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500 text-[10px] font-mono font-bold text-cyan-300 shadow">
                      {localParams.mass} kg
                    </div>
                  </div>
                ) : (
                  /* 3D Turntable Viewer */
                  <Car3DViewer massScale={massScale} />
                )}
              </div>

              {/* Mass Slider & Interactive Growth Bar */}
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Weight className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Masa del Móvil (m)
                    </span>
                  </div>
                  <span className="text-base font-black font-mono text-cyan-400 tabular-nums">
                    {localParams.mass} <span className="text-xs font-normal text-slate-400">kg</span>
                  </span>
                </div>

                <input
                  type="range"
                  min="0.5"
                  max="40"
                  step="0.5"
                  value={localParams.mass}
                  onChange={(e) => {
                    const newMass = parseFloat(e.target.value) || 0.5;
                    setLocalParams({ ...localParams, mass: newMass });
                  }}
                  className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />

                {/* Quick Presets for Mass */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[
                    { label: 'Ligero', val: 1.0 },
                    { label: 'Rover Lab', val: 2.5 },
                    { label: 'Pesado', val: 10.0 },
                    { label: 'Titán', val: 25.0 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setLocalParams({ ...localParams, mass: preset.val });
                      }}
                      className={`py-1.5 px-2 rounded-xl text-xs font-mono transition-all border ${
                        localParams.mass === preset.val
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {preset.label} ({preset.val}kg)
                    </button>
                  ))}
                </div>

                <p className="text-[11px] text-slate-400 text-center">
                  💡 A mayor masa, el carrito crece visualmente y requiere mayor fuerza para acelerar.
                </p>
              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 2: LA PISTA & DISTANCIA ("SELECCIONA EL LARGO DE TU PISTA EN METROS")
             ========================================================================= */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center">
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-bold">
                  Dimensión de la Prueba
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                  Selecciona el largo de tu pista en metros
                </h3>
              </div>

              {/* Visual Track Preview */}
              <div className="w-full h-44 bg-gradient-to-b from-slate-950 to-[#090d18] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between relative shadow-inner overflow-hidden">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span className="flex items-center gap-1 text-cyan-400">
                    <Flag className="w-3.5 h-3.5" /> Salida (0 m)
                  </span>
                  <span className="text-base font-bold text-white font-mono tabular-nums">
                    {localParams.distance} metros
                  </span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <Trophy className="w-3.5 h-3.5" /> Meta ({localParams.distance} m)
                  </span>
                </div>

                {/* Road Lane Graphic */}
                <div className="relative w-full h-12 bg-slate-900 border-y border-slate-800 flex items-center px-4 rounded-xl">
                  {/* Dashed center lane */}
                  <div className="w-full border-b border-dashed border-slate-700" />
                  {/* Start post */}
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-8 bg-cyan-400 rounded-sm shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                  {/* Checkered Finish Gate */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-9 bg-amber-400 rounded-sm shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
                </div>

                <div className="text-[11px] font-mono text-slate-400 text-center">
                  Desplaza la barra o selecciona una pista para configurar el desplazamiento $d$.
                </div>
              </div>

              {/* Distance Slider */}
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Distancia de Carrera (d)
                    </span>
                  </div>
                  <span className="text-base font-black font-mono text-blue-400 tabular-nums">
                    {localParams.distance} <span className="text-xs font-normal text-slate-400">metros</span>
                  </span>
                </div>

                <input
                  type="range"
                  min="1"
                  max="100"
                  step="0.5"
                  value={localParams.distance}
                  onChange={(e) => {
                    const newDist = parseFloat(e.target.value) || 1;
                    setLocalParams({ ...localParams, distance: newDist });
                  }}
                  className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-400"
                />

                {/* Preset Track Types */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {[
                    { label: 'Riel Lab', val: 2.0 },
                    { label: 'Pista Corta', val: 5.0 },
                    { label: 'Sprint', val: 15.0 },
                    { label: 'Dragster', val: 50.0 },
                  ].map((track) => (
                    <button
                      key={track.label}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setLocalParams({ ...localParams, distance: track.val });
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-mono transition-all border ${
                        localParams.distance === track.val
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {track.label} ({track.val}m)
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              STEP 3: TIEMPO DE CARRERA, STATS RESULTANTES & INICIAR SIMULACIÓN
             ========================================================================= */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="text-center">
                <span className="text-xs font-mono text-amber-400 uppercase tracking-widest font-bold">
                  Duración de la Prueba
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                  Selecciona el tiempo de la carrera
                </h3>
              </div>

              {/* Time Slider */}
              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Tiempo Total (t)
                    </span>
                  </div>
                  <span className="text-base font-black font-mono text-amber-400 tabular-nums">
                    {localParams.totalTime} <span className="text-xs font-normal text-slate-400">segundos</span>
                  </span>
                </div>

                <input
                  type="range"
                  min="0.5"
                  max="15"
                  step="0.1"
                  value={localParams.totalTime}
                  onChange={(e) => {
                    const newTime = parseFloat(e.target.value) || 0.5;
                    setLocalParams({ ...localParams, totalTime: newTime });
                  }}
                  className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />

                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[
                    { label: 'Turbo', val: 1.5 },
                    { label: 'Rápido', val: 3.0 },
                    { label: 'Estándar', val: 5.0 },
                    { label: 'Crucero', val: 8.0 },
                  ].map((timePreset) => (
                    <button
                      key={timePreset.label}
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setLocalParams({ ...localParams, totalTime: timePreset.val });
                      }}
                      className={`py-1.5 px-2 rounded-xl text-xs font-mono transition-all border ${
                        localParams.totalTime === timePreset.val
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {timePreset.label} ({timePreset.val}s)
                    </button>
                  ))}
                </div>
              </div>

              {/* Calculated Physical Stats Box (Valores Físicos Resultantes Calculados) */}
              <div className="bg-slate-950/90 border border-cyan-500/30 p-4 rounded-2xl shadow-lg">
                <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider mb-2.5 flex items-center justify-between">
                  <span>Valores Físicos Resultantes Calculados:</span>
                  <span className="text-slate-400 text-[10px] font-normal">MRUV & Dinámica</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Aceleración (a)</div>
                    <div className="text-base font-bold font-mono text-amber-400 mt-0.5 tabular-nums">
                      {acceleration.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">m/s²</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">a = 2d / t²</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Velocidad Final (v)</div>
                    <div className="text-base font-bold font-mono text-emerald-400 mt-0.5 tabular-nums">
                      {finalVelocity.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">m/s</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">{kmh.toFixed(1)} km/h</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Fuerza Neta (F)</div>
                    <div className="text-base font-bold font-mono text-purple-400 mt-0.5 tabular-nums">
                      {force.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">N</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">F = m · a</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Energía Cinética (Ek)</div>
                    <div className="text-base font-bold font-mono text-sky-400 mt-0.5 tabular-nums">
                      {kineticEnergy.toFixed(1)} <span className="text-[10px] font-normal text-slate-400">J</span>
                    </div>
                    <div className="text-[9px] text-slate-400 mt-0.5">½ m v²</div>
                  </div>
                </div>
              </div>

              {/* View Mode Choice (2D vs 3D) */}
              <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <div className="text-[11px] font-mono text-slate-400 uppercase font-semibold mb-2">
                  Modalidad de Visualización
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setSelectedMode('2D');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedMode === '2D'
                        ? 'border-cyan-500 bg-cyan-950/40 text-white ring-1 ring-cyan-500/50'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-xs text-cyan-300">2D Clásico Robótico</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Réplica del diagrama con aros y arrastre</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setSelectedMode('3D');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      selectedMode === '3D'
                        ? 'border-cyan-500 bg-cyan-950/40 text-white ring-1 ring-cyan-500/50'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-xs text-cyan-300">3D Hero Inmersivo</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Móvil 3D con scroll, cámaras y aros</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-5 mt-4 border-t border-slate-800">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Atrás</span>
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="flex items-center gap-2 px-6 py-3 text-xs font-extrabold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
              >
                <span>Siguiente: {step === 1 ? 'Elegir Pista' : 'Tiempo de Carrera'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartSimulation}
                className="flex items-center gap-2 px-8 py-3 text-sm font-black text-slate-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 hover:from-amber-300 hover:to-yellow-300 rounded-xl transition-all shadow-xl shadow-yellow-500/25 active:scale-95 animate-pulse"
              >
                <Flame className="w-4 h-4 fill-current" />
                <span>¡Iniciar Simulación!</span>
                <Play className="w-4 h-4 fill-current" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
