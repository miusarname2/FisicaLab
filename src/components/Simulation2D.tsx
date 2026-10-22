import React, { useRef, useState, useEffect, useCallback } from 'react';
import { PhysicsParams, PhysicsInstant } from '../types/physics';
import { getPhysicsAtTime, getTimeFromPosition } from '../utils/physics';
import { sound } from '../utils/audio';
import { 
  Play, Pause, RotateCcw, Eye, ArrowRight,
  Plus, Minus, MoveHorizontal, Compass, 
  Gamepad2, Gauge, Zap, Sparkles, Award, Star,
  Maximize2, Minimize2
} from 'lucide-react';

interface Simulation2DProps {
  params: PhysicsParams;
  onParamsChange: (newParams: PhysicsParams) => void;
  currentTime: number;
  onTimeChange: (time: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  isArcadeMode?: boolean;
  onToggleArcadeMode?: () => void;
}

// 3 Ring checkpoints placed along the track
const TRACK_RINGS = [
  { id: 0, ratio: 0.25, label: 'Aro #1' },
  { id: 1, ratio: 0.55, label: 'Aro #2' },
  { id: 2, ratio: 0.85, label: 'Aro #3' },
];

export const Simulation2D: React.FC<Simulation2DProps> = ({
  params,
  onParamsChange,
  currentTime,
  onTimeChange,
  isPlaying,
  onTogglePlay,
  onReset,
  isArcadeMode = true,
  onToggleArcadeMode,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDraggingCart, setIsDraggingCart] = useState(false);
  const [showVectors, setShowVectors] = useState(true);
  const [showFBD, setShowFBD] = useState(false); // Free Body Diagram
  const [isHoldingGas, setIsHoldingGas] = useState(false);
  const gasIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Compute physics at current time
  const currentPhysics = getPhysicsAtTime(params, currentTime);
  const { position, velocity, acceleration, force, progress } = currentPhysics;

  // Track collected rings status: [ring0, ring1, ring2]
  const [collectedRings, setCollectedRings] = useState<boolean[]>([false, false, false]);
  const [activePopupIndex, setActivePopupIndex] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ESC key listener to exit fullscreen
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      }
      setIsFullscreen(true);
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Continuous Car Engine Sound
  useEffect(() => {
    const isMoving = isPlaying || isHoldingGas || isDraggingCart;
    const maxVel = Math.max(0.1, (params.initialVelocity || 0) + acceleration * params.totalTime);
    const speedRatio = Math.min(1, Math.max(0, velocity / maxVel));

    if (isMoving && currentTime < params.totalTime && velocity > 0.05) {
      sound.updateCarEngine(speedRatio, isHoldingGas);
    } else {
      sound.stopCarEngine();
    }

    return () => {
      sound.stopCarEngine();
    };
  }, [isPlaying, isHoldingGas, isDraggingCart, velocity, acceleration, params.totalTime, params.initialVelocity, currentTime]);

  // Robust Ring Collision System: Detects forward passage and allows clean reset on rewind
  useEffect(() => {
    TRACK_RINGS.forEach((ring, idx) => {
      // If car reached or passed the ring position (accounting for front bumper)
      if (progress >= ring.ratio - 0.02 && !collectedRings[idx]) {
        setCollectedRings(prev => {
          if (prev[idx]) return prev;
          const next = [...prev];
          next[idx] = true;
          return next;
        });

        // Trigger ring chime
        sound.playCollect();

        // Show score popup animation
        setActivePopupIndex(idx);
        setTimeout(() => {
          setActivePopupIndex(current => (current === idx ? null : current));
        }, 1200);
      } else if (progress < ring.ratio - 0.06 && collectedRings[idx]) {
        // Re-arm ring if user scrubs/drags back before the ring
        setCollectedRings(prev => {
          if (!prev[idx]) return prev;
          const next = [...prev];
          next[idx] = false;
          return next;
        });
      }
    });
  }, [progress, collectedRings]);

  // Full reset when currentTime goes back to zero
  useEffect(() => {
    if (currentTime <= 0.01) {
      setCollectedRings([false, false, false]);
      setActivePopupIndex(null);
    }
  }, [currentTime]);

  // Wheel rotation angle in degrees: distance / radius
  const wheelRotationDeg = (position / (params.distance || 1)) * 360 * 3;

  // Keyboard shortcut: hold Space or ArrowRight to accelerate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'ArrowRight') {
        if (e.target instanceof HTMLInputElement) return;
        e.preventDefault();
        if (!isHoldingGas && currentTime < params.totalTime) {
          setIsHoldingGas(true);
          sound.playBrumm(0.85);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'ArrowRight') {
        setIsHoldingGas(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isHoldingGas, currentTime, params.totalTime]);

  // Gas pedal acceleration loop with car engine revving
  useEffect(() => {
    if (isHoldingGas && currentTime < params.totalTime) {
      gasIntervalRef.current = setInterval(() => {
        onTimeChange(Math.min(params.totalTime, currentTime + 0.05));
      }, 35);
    } else {
      if (gasIntervalRef.current) clearInterval(gasIntervalRef.current);
    }
    return () => {
      if (gasIntervalRef.current) clearInterval(gasIntervalRef.current);
    };
  }, [isHoldingGas, currentTime, params.totalTime, onTimeChange]);

  // Handle direct cart dragging
  const handlePointerDownCart = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDraggingCart(true);
    sound.playClick();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingCart || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const trackPadding = 48; // padding on left and right for wheels
    const trackWidth = rect.width - trackPadding * 2;
    if (trackWidth <= 0) return;

    const pointerX = e.clientX - rect.left - trackPadding;
    const clampedProgress = Math.max(0, Math.min(1, pointerX / trackWidth));
    const targetX = clampedProgress * params.distance;
    const newTime = getTimeFromPosition(params, targetX);
    onTimeChange(newTime);
  }, [isDraggingCart, params, onTimeChange]);

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingCart) {
      setIsDraggingCart(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe ignore
      }
    }
  };

  // Generate tick marks along the track (matching user image e.g. 0 m, 0.8 m, 1.5 m, 2.3 m, 3 m)
  const tickCount = 5;
  const tickMarks = Array.from({ length: tickCount }, (_, i) => {
    const val = (params.distance * (i / (tickCount - 1)));
    const percent = (i / (tickCount - 1)) * 100;
    return { val: Number(val.toFixed(2)), percent };
  });

  // Calculate dynamic vector arrow pixel lengths
  const maxVectorPx = 110;
  const maxVelExpected = Math.max(0.1, (params.initialVelocity || 0) + acceleration * params.totalTime);
  const velArrowLength = Math.max(16, (velocity / maxVelExpected) * maxVectorPx);
  const accArrowLength = Math.max(20, Math.min(maxVectorPx * 0.85, acceleration * 12));
  const forceArrowLength = Math.max(20, Math.min(maxVectorPx, (force / Math.max(0.1, params.mass * acceleration || 1)) * maxVectorPx));

  const totalBonusPoints = collectedRings.filter(Boolean).length * 100;

  return (
    <div 
      ref={containerRef}
      className={`w-full bg-[#0c101c] border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-0 h-screen overflow-y-auto p-4 md:p-8' : 'overflow-hidden'
      }`}
    >
      {/* Background subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Top Title & Direction matching user image */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 relative z-10">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-cyan-400 tracking-tight flex items-center gap-2.5">
            Movimiento
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40 text-cyan-300 font-normal">
              2D Interactivo
            </span>
            {isArcadeMode && (
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-yellow-950/80 border border-yellow-500/50 text-yellow-300 font-bold flex items-center gap-1 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                <Sparkles className="w-3 h-3 text-yellow-400" />
                Desafío de Aros (+100 PTS)
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isArcadeMode 
              ? 'Atraviesa los aros de energía en la pista para sumar 100 puntos en cada uno con sonido de motor.'
              : 'Arrastra el carrito directamente con el cursor o usa los controles para explorar el tiempo.'}
          </p>
        </div>

        {/* Vector Visibility & Display Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          {onToggleArcadeMode && (
            <button
              type="button"
              onClick={onToggleArcadeMode}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                isArcadeMode
                  ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50 shadow-[0_0_12px_rgba(234,179,8,0.2)]'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>{isArcadeMode ? 'Aros Activos' : 'Activar Aros'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowVectors(!showVectors)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
              showVectors
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Vectores: {showVectors ? 'Visibles' : 'Ocultos'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowFBD(!showFBD)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
              showFBD
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Diagrama de Cuerpo Libre (DCL: Normal, Peso, Fuerza)"
          >
            <span>DCL (Fuerzas)</span>
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all cursor-pointer shadow-lg"
            title={isFullscreen ? 'Salir de pantalla completa (ESC)' : 'Pantalla Completa'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-cyan-400" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Primary HUD Bar replicating exact format from user image:
          t = 0 s   x = 0 m   v = 0 m/s   dirección 0°
      */}
      <div className="w-full bg-[#111625] border border-slate-800/90 rounded-2xl px-5 py-3.5 mb-6 relative z-10 flex flex-wrap items-center justify-between gap-y-2 gap-x-6 text-sm">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono font-medium text-slate-200">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">t =</span>
            <span className="font-bold text-cyan-400 tabular-nums text-base">{currentTime.toFixed(2)}</span>
            <span className="text-slate-400 text-xs">s</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">x =</span>
            <span className="font-bold text-blue-400 tabular-nums text-base">{position.toFixed(2)}</span>
            <span className="text-slate-400 text-xs">m</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">v =</span>
            <span className="font-bold text-emerald-400 tabular-nums text-base">{velocity.toFixed(2)}</span>
            <span className="text-slate-400 text-xs">m/s</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">dirección</span>
            <span className="font-bold text-amber-300 tabular-nums">0°</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-400 inline" />
          </div>
        </div>

        {/* Secondary physics telemetry & rings bonus score */}
        <div className="flex items-center gap-4 text-xs font-mono text-slate-400 border-l border-slate-800 pl-4">
          {isArcadeMode && (
            <div className="flex items-center gap-1.5 text-yellow-400 font-bold bg-yellow-950/40 px-2 py-1 rounded-lg border border-yellow-500/30">
              <Star className="w-3.5 h-3.5 fill-yellow-400" />
              <span>Aros: {collectedRings.filter(Boolean).length}/3</span>
              <span className="text-yellow-300 font-extrabold">({totalBonusPoints} pts)</span>
            </div>
          )}
          <div>
            a: <span className="text-amber-400 font-bold tabular-nums">{acceleration.toFixed(2)}</span> m/s²
          </div>
          <div>
            F: <span className="text-purple-400 font-bold tabular-nums">{force.toFixed(2)}</span> N
          </div>
          <div>
            m: <span className="text-slate-200 font-bold tabular-nums">{params.mass}</span> kg
          </div>
        </div>
      </div>

      {/* Interactive Simulation Stage & Track Canvas */}
      <div 
        ref={trackRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full h-72 sm:h-80 bg-gradient-to-b from-[#0e1322] to-[#090d18] border border-slate-800/80 rounded-2xl relative select-none overflow-hidden"
      >
        {/* Sky / Space background subtle details */}
        <div className="absolute top-4 left-6 text-[11px] font-mono text-slate-400 flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>Eje +X Horizontal (0°)</span>
        </div>

        {/* GLOWING AROS (RINGS) CHECKPOINTS ON TRACK */}
        {isArcadeMode && TRACK_RINGS.map((ring, idx) => {
          const isCollected = collectedRings[idx];
          const isShowingPopup = activePopupIndex === idx;

          return (
            <div
              key={ring.id}
              className="absolute bottom-16 flex flex-col items-center pointer-events-none z-10 transition-transform"
              style={{
                left: `calc(48px + (100% - 96px) * ${ring.ratio})`,
                transform: 'translate(-50%, 0)',
              }}
            >
              {/* Floating +100 PTS banner when passing through */}
              {isShowingPopup && (
                <div className="absolute -top-16 px-2.5 py-1 rounded-full bg-yellow-400 text-slate-950 font-black font-mono text-xs shadow-[0_0_20px_rgba(250,204,21,1)] animate-bounce flex items-center gap-1 z-30">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>+100 PTS</span>
                </div>
              )}

              {/* Tag above ring */}
              <div className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold mb-1 transition-all ${
                isCollected 
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50' 
                  : 'bg-yellow-950/80 text-yellow-300 border border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.3)]'
              }`}>
                {isCollected ? '✓ +100' : '100 PTS'}
              </div>

              {/* The Physical Glowing Ring / Aro (SVG with arch depth) */}
              <svg 
                width="64" 
                height="115" 
                viewBox="0 0 64 115" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className={`transition-all duration-300 ${
                  isCollected 
                    ? 'opacity-40 grayscale-[40%]' 
                    : 'drop-shadow-[0_0_12px_rgba(250,204,21,0.85)] animate-pulse'
                }`}
              >
                {/* Outer Ring Border */}
                <ellipse 
                  cx="32" 
                  cy="50" 
                  rx="26" 
                  ry="46" 
                  stroke={isCollected ? '#10b981' : '#facc15'} 
                  strokeWidth="5" 
                />
                {/* Inner Ring Opening */}
                <ellipse 
                  cx="32" 
                  cy="50" 
                  rx="20" 
                  ry="38" 
                  stroke={isCollected ? '#34d399' : '#fef08a'} 
                  strokeWidth="2.5" 
                  strokeDasharray="6 3" 
                />

                {/* Ring Stand Base on Ground */}
                <path 
                  d="M18 96 L24 112 M46 96 L40 112" 
                  stroke={isCollected ? '#065f46' : '#854d0e'} 
                  strokeWidth="3.5" 
                  strokeLinecap="round" 
                />
                <rect 
                  x="18" 
                  y="110" 
                  width="28" 
                  height="4" 
                  rx="2" 
                  fill={isCollected ? '#10b981' : '#eab308'} 
                />
              </svg>
            </div>
          );
        })}

        {/* Finish Line Banner at right side */}
        <div 
          className="absolute bottom-16 right-10 flex flex-col items-center pointer-events-none opacity-80"
          style={{ right: '48px' }}
        >
          <div className="px-2 py-0.5 rounded bg-cyan-900/60 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 mb-1">
            Meta: {params.distance} m
          </div>
          <div className="w-0.5 h-32 border-r-2 border-dashed border-cyan-500/50" />
        </div>

        {/* Ground track line */}
        <div className="absolute bottom-16 left-12 right-12 h-1 bg-slate-800 rounded-full" />

        {/* Track meter markings matching user image (0m, 0.8m, 1.5m, etc.) */}
        <div className="absolute bottom-6 left-12 right-12 flex justify-between pointer-events-none">
          {tickMarks.map((tick, idx) => (
            <div 
              key={idx} 
              className="flex flex-col items-center -translate-x-1/2"
              style={{ left: `${tick.percent}%`, position: 'absolute' }}
            >
              <div className="w-0.5 h-2 bg-slate-700 mb-1" />
              <span className="text-xs font-mono text-slate-400 tabular-nums">
                {tick.val} m
              </span>
            </div>
          ))}
        </div>

        {/* THE CAR / ROVER: Positioned along the track */}
        <div
          onPointerDown={handlePointerDownCart}
          className={`absolute bottom-16 cursor-grab active:cursor-grabbing transition-transform duration-75 z-20 ${
            isDraggingCart ? 'scale-[1.03]' : ''
          }`}
          style={{
            // Map progress (0 to 1) between left: 48px and right: 48px
            left: `calc(48px + (100% - 96px) * ${progress})`,
            transform: 'translate(-50%, 0)',
            touchAction: 'none',
          }}
        >
          {/* Shadow beneath cart matching user image */}
          <div className="w-40 h-5 bg-black/60 rounded-[100%] mx-auto blur-[3px] -mb-2" />

          {/* SVG Robotic Cart matching exact image visual design */}
          <div className="relative">
            <svg 
              width="170" 
              height="110" 
              viewBox="0 0 170 110" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-lg"
            >
              {/* Electronics Top Module */}
              <rect x="52" y="16" width="66" height="14" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
              
              {/* Header Pins (golden yellow) */}
              {Array.from({ length: 9 }).map((_, i) => (
                <rect key={i} x={56 + i * 6.5} y="12" width="2.5" height="5" fill="#f59e0b" rx="0.5" />
              ))}

              {/* Jumper Wires: White & Red curved wires */}
              <path 
                d="M 98 16 C 98 6, 118 6, 118 30" 
                stroke="#ef4444" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                fill="none" 
              />
              <path 
                d="M 90 16 C 90 8, 108 8, 110 30" 
                stroke="#ffffff" 
                strokeWidth="2" 
                strokeLinecap="round" 
                fill="none" 
              />

              {/* White Rover Chassis with rounded corners */}
              <rect 
                x="20" 
                y="28" 
                width="130" 
                height="46" 
                rx="14" 
                fill="#f8fafc" 
                stroke="#e2e8f0" 
                strokeWidth="2" 
              />

              {/* Central Red Sensor / Button */}
              <circle cx="85" cy="51" r="11" fill="#dc2626" />
              <circle cx="85" cy="51" r="8" fill="#ef4444" />
              <circle cx="82" cy="48" r="2.5" fill="#fca5a5" />

              {/* Left Wheel (Mecanum Spoke Pattern) */}
              <g transform={`translate(42, 68) rotate(${wheelRotationDeg})`}>
                <circle cx="0" cy="0" r="24" fill="#0f172a" stroke="#1e293b" strokeWidth="2" />
                {Array.from({ length: 8 }).map((_, i) => (
                  <g key={i} transform={`rotate(${i * 45})`}>
                    <rect 
                      x="-4" 
                      y="-25" 
                      width="8" 
                      height="8" 
                      rx="2" 
                      fill="#eab308" 
                      stroke="#ca8a04" 
                      strokeWidth="1" 
                    />
                  </g>
                ))}
                <circle cx="0" cy="0" r="13" fill="#eab308" />
                <circle cx="0" cy="0" r="9" fill="#0f172a" />
                <circle cx="0" cy="0" r="4" fill="#f8fafc" />
              </g>

              {/* Right Wheel (Mecanum Spoke Pattern) */}
              <g transform={`translate(128, 68) rotate(${wheelRotationDeg})`}>
                <circle cx="0" cy="0" r="24" fill="#0f172a" stroke="#1e293b" strokeWidth="2" />
                {Array.from({ length: 8 }).map((_, i) => (
                  <g key={i} transform={`rotate(${i * 45})`}>
                    <rect 
                      x="-4" 
                      y="-25" 
                      width="8" 
                      height="8" 
                      rx="2" 
                      fill="#eab308" 
                      stroke="#ca8a04" 
                      strokeWidth="1" 
                    />
                  </g>
                ))}
                <circle cx="0" cy="0" r="13" fill="#eab308" />
                <circle cx="0" cy="0" r="9" fill="#0f172a" />
                <circle cx="0" cy="0" r="4" fill="#f8fafc" />
              </g>
            </svg>

            {/* Drag Handle Indicator Pill */}
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-[10px] font-mono text-cyan-300 flex items-center gap-1 shadow whitespace-nowrap">
              <MoveHorizontal className="w-2.5 h-2.5" />
              <span>Arrastrar</span>
            </div>

            {/* Overlaid Physical Vectors */}
            {showVectors && (
              <div className="absolute top-1/2 left-[85px] pointer-events-none -translate-y-1/2">
                {/* Velocity Vector (Emerald Green / Cyan) */}
                <div 
                  className="absolute left-0 top-0 flex items-center transition-all duration-75 origin-left"
                  style={{ width: `${velArrowLength}px` }}
                >
                  <div className="h-1 bg-emerald-400 flex-1 relative shadow-[0_0_8px_rgba(52,211,153,0.8)]">
                    <div className="absolute -right-2 -top-1.5 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[10px] border-l-emerald-400" />
                  </div>
                  <div className="absolute -top-5 left-2 px-1.5 py-0.2 rounded bg-slate-900/90 border border-emerald-500/50 text-[10px] font-mono font-bold text-emerald-300 whitespace-nowrap">
                    v: {velocity.toFixed(1)} m/s
                  </div>
                </div>

                {/* Acceleration Vector (Amber / Orange) */}
                <div 
                  className="absolute left-0 top-6 flex items-center transition-all duration-75 origin-left"
                  style={{ width: `${accArrowLength}px` }}
                >
                  <div className="h-1 bg-amber-400 flex-1 relative shadow-[0_0_8px_rgba(251,191,36,0.8)]">
                    <div className="absolute -right-2 -top-1.5 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[10px] border-l-amber-400" />
                  </div>
                  <div className="absolute top-2 left-2 px-1.5 py-0.2 rounded bg-slate-900/90 border border-amber-500/50 text-[10px] font-mono font-bold text-amber-300 whitespace-nowrap">
                    a: {acceleration.toFixed(1)} m/s²
                  </div>
                </div>

                {/* Force Vector (Purple / Magenta) */}
                <div 
                  className="absolute left-0 -top-6 flex items-center transition-all duration-75 origin-left"
                  style={{ width: `${forceArrowLength}px` }}
                >
                  <div className="h-1 bg-purple-400 flex-1 relative shadow-[0_0_8px_rgba(192,132,252,0.8)]">
                    <div className="absolute -right-2 -top-1.5 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[10px] border-l-purple-400" />
                  </div>
                  <div className="absolute -top-5 left-2 px-1.5 py-0.2 rounded bg-slate-900/90 border border-purple-500/50 text-[10px] font-mono font-bold text-purple-300 whitespace-nowrap">
                    F: {force.toFixed(1)} N
                  </div>
                </div>

                {/* Free Body Diagram Overlay (Normal & Weight) */}
                {showFBD && (
                  <>
                    <div className="absolute left-0 bottom-6 flex flex-col items-center origin-bottom -translate-x-1/2">
                      <div className="px-1.5 py-0.2 rounded bg-slate-900/90 border border-sky-500/50 text-[10px] font-mono text-sky-300 mb-1 whitespace-nowrap">
                        N = {(params.mass * 9.8).toFixed(1)} N
                      </div>
                      <div className="w-0.5 h-12 bg-sky-400 relative">
                        <div className="absolute -top-1.5 -left-1 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-sky-400" />
                      </div>
                    </div>

                    <div className="absolute left-0 top-6 flex flex-col items-center origin-top -translate-x-1/2">
                      <div className="w-0.5 h-12 bg-rose-400 relative">
                        <div className="absolute -bottom-1.5 -left-1 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[8px] border-t-rose-400" />
                      </div>
                      <div className="px-1.5 py-0.2 rounded bg-slate-900/90 border border-rose-500/50 text-[10px] font-mono text-rose-300 mt-1 whitespace-nowrap">
                        P = {(params.mass * 9.8).toFixed(1)} N
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Control Deck for Playback and Interactive Dragging */}
      <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Playback Buttons & Arcade Pedal */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isArcadeMode ? (
            /* Arcade Gas Pedal button with engine roar */
            <button
              type="button"
              onMouseDown={() => {
                setIsHoldingGas(true);
                sound.playBrumm(0.85);
              }}
              onMouseUp={() => {
                setIsHoldingGas(false);
              }}
              onMouseLeave={() => {
                setIsHoldingGas(false);
              }}
              onTouchStart={() => {
                setIsHoldingGas(true);
                sound.playBrumm(0.85);
              }}
              onTouchEnd={() => {
                setIsHoldingGas(false);
              }}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black text-xs transition-all shadow-xl active:scale-90 select-none ${
                isHoldingGas 
                  ? 'bg-yellow-400 text-slate-950 ring-4 ring-yellow-400/50 shadow-yellow-500/50 scale-95' 
                  : 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 shadow-yellow-500/20'
              }`}
            >
              <Zap className="w-4 h-4 fill-current animate-pulse" />
              <span>{isHoldingGas ? '¡BRUMMM! ACELERANDO' : 'PISAR GAS (ESPACIO)'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                if (!isPlaying) {
                  sound.playBrumm(0.75);
                }
                onTogglePlay();
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95 ${
                isPlaying
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                  : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>Pausar</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>{currentTime >= params.totalTime ? 'Repetir' : 'Iniciar'}</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              sound.stopCarEngine();
              onReset();
            }}
            title="Reiniciar móvil al inicio (t = 0)"
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* High-Resolution Time Scrubber Slider */}
        <div className="flex-1 w-full max-w-xl flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400 tabular-nums shrink-0">
            0 s
          </span>
          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min="0"
              max={params.totalTime}
              step="0.01"
              value={currentTime}
              onChange={(e) => onTimeChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
            />
            <div 
              className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500 text-[10px] font-mono text-cyan-300 pointer-events-none"
              style={{ left: `${progress * 100}%` }}
            >
              t = {currentTime.toFixed(2)} s
            </div>
          </div>
          <span className="text-xs font-mono text-cyan-400 font-bold tabular-nums shrink-0">
            {params.totalTime.toFixed(1)} s
          </span>
        </div>

        {/* Dynamic Mass Quick Tweaker */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono">
            <span className="text-slate-400">Masa:</span>
            <button 
              type="button" 
              onClick={() => {
                sound.playClick();
                onParamsChange({ ...params, mass: Math.max(0.5, +(params.mass - 0.5).toFixed(1)) });
              }}
              className="p-0.5 rounded hover:bg-slate-800 text-slate-300"
              title="Reducir masa"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="font-bold text-white tabular-nums px-1">{params.mass} kg</span>
            <button 
              type="button" 
              onClick={() => {
                sound.playClick();
                onParamsChange({ ...params, mass: +(params.mass + 0.5).toFixed(1) });
              }}
              className="p-0.5 rounded hover:bg-slate-800 text-slate-300"
              title="Aumentar masa"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
