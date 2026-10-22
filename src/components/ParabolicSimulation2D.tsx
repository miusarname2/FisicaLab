import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  ParabolicParams, 
  ParabolicInstant, 
  ParabolicResults,
  ProjectilePreset 
} from '../types/parabolic';
import { 
  calculateParabolicResults, 
  getParabolicAtTime, 
  generateTrajectoryPath, 
  degToRad,
  PROJECTILE_PRESETS
} from '../utils/parabolic';
import { sound } from '../utils/audio';
import { triggerFinishCelebration } from '../utils/confetti';
import { 
  Play, Pause, RotateCcw, Target, Sparkles, 
  Eye, Compass, Maximize2, Minimize2, Crosshair, 
  Zap, Trophy, Flame, Volume2, Plus, Minus
} from 'lucide-react';

interface ParabolicSimulation2DProps {
  params: ParabolicParams;
  onParamsChange: (newParams: ParabolicParams) => void;
  onLaunchCompleted?: (results: ParabolicResults) => void;
}

export const ParabolicSimulation2D: React.FC<ParabolicSimulation2DProps> = ({
  params,
  onParamsChange,
  onLaunchCompleted,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Simulation playback state
  const [currentTime, setCurrentTime] = useState(0);
  const [isFlying, setIsFlying] = useState(false);
  const [showVectors, setShowVectors] = useState(true);
  const [showTrajectoryArc, setShowTrajectoryArc] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Slingshot / Aim Drag State (Angry-Birds style)
  const [isAimDragging, setIsAimDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  // Bounce simulation state
  const [bounceCount, setBounceCount] = useState(0);
  const [scorePopup, setScorePopup] = useState<{ text: string; score: number } | null>(null);

  const results = calculateParabolicResults(params);
  const currentInstant = getParabolicAtTime(params, currentTime);
  const selectedPreset = PROJECTILE_PRESETS.find(p => p.id === params.projectileId) || PROJECTILE_PRESETS[0];

  // Helper to adjust elevation angle smoothly
  const handleSetAngle = (newAngle: number) => {
    sound.playClick();
    const clamped = Math.max(10, Math.min(90, Math.round(newAngle)));
    onParamsChange({ ...params, angleDeg: clamped });
  };

  // World coordinates mapping
  const worldWidth = Math.max(30, Math.max(results.maxRange, params.targetDistance) + 8);
  const worldHeight = Math.max(12, results.maxHeight + 4);

  // SVG dimensions
  const viewWidth = 1000;
  const viewHeight = 450;
  const groundY = viewHeight - 70;
  const startX = 110;

  // Scale factors
  const scaleX = (viewWidth - startX - 80) / worldWidth;
  const scaleY = (groundY - 60) / worldHeight;

  // Coordinate transforms
  const toSvgX = (worldX: number) => startX + worldX * scaleX;
  const toSvgY = (worldY: number) => groundY - worldY * scaleY;

  // Tank & Cannon origin point
  const cannonBaseX = toSvgX(0);
  const cannonBaseY = toSvgY(params.initialHeight);
  const barrelLength = 52;
  const angleRad = degToRad(params.angleDeg);
  const barrelTipX = cannonBaseX + Math.cos(angleRad) * barrelLength;
  const barrelTipY = cannonBaseY - Math.sin(angleRad) * barrelLength;

  // Trajectory points
  const trajectoryPoints = generateTrajectoryPath(params, 80);
  const trajectoryPathData = trajectoryPoints.map((p, idx) => {
    const sx = toSvgX(p.x);
    const sy = toSvgY(p.y);
    return `${idx === 0 ? 'M' : 'L'} ${sx.toFixed(1)} ${sy.toFixed(1)}`;
  }).join(' ');

  // Ball current position
  const ballSvgX = toSvgX(currentInstant.x);
  const ballSvgY = toSvgY(currentInstant.y);

  // Target Basket position
  const targetSvgX = toSvgX(params.targetDistance);
  const targetSvgY = toSvgY(params.targetHeight);
  const targetRadiusSvg = params.targetRadius * scaleX;

  // Flight Animation loop
  useEffect(() => {
    if (!isFlying) return;

    let animId: number;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      setCurrentTime((prev) => {
        const nextTime = prev + dt;
        if (nextTime >= results.timeTotal) {
          setIsFlying(false);
          sound.playPingPongBounce(0.9);

          if (results.hitTarget) {
            sound.playTargetHit();
            triggerFinishCelebration();
            setScorePopup({ text: '¡EN EL BLANCO!', score: results.score });
          } else {
            setScorePopup({ 
              text: results.targetErrorMeters < 3 ? '¡Casi!' : 'Fuera del Blanco', 
              score: results.score 
            });
          }

          if (onLaunchCompleted) {
            onLaunchCompleted(results);
          }
          return results.timeTotal;
        }
        return nextTime;
      });

      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isFlying, results, onLaunchCompleted]);

  // Handle Launch Fire
  const handleFire = () => {
    setCurrentTime(0);
    setBounceCount(0);
    setScorePopup(null);
    setIsFlying(true);
    sound.playCannonFire();
  };

  // Reset ball to cannon
  const handleReset = () => {
    setIsFlying(false);
    setCurrentTime(0);
    setBounceCount(0);
    setScorePopup(null);
  };

  // Slingshot drag interaction (Angry Birds style)
  const handlePointerDownSling = (e: React.PointerEvent) => {
    e.preventDefault();
    if (isFlying) return;
    setIsAimDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    sound.playSlingshotTension(params.initialVelocity / 40);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveSling = (e: React.PointerEvent) => {
    if (!isAimDragging || !dragStart) return;

    const dx = dragStart.x - e.clientX; // Pulling back gives positive dx
    const dy = e.clientY - dragStart.y; // Pulling down gives positive dy

    // Drag distance controls velocity (5 to 40 m/s)
    const dragDistance = Math.sqrt(dx * dx + dy * dy);
    const newSpeed = Math.min(40, Math.max(6, 10 + dragDistance * 0.18));

    // Drag direction controls launch angle (10° to 90°)
    let newAngle = params.angleDeg;
    if (dragDistance > 10) {
      const angle = (Math.atan2(dx, -dy) * 180) / Math.PI;
      const clampedAngle = Math.max(10, Math.min(90, Math.abs(angle)));
      newAngle = Math.round(clampedAngle);
    }

    onParamsChange({
      ...params,
      initialVelocity: parseFloat(newSpeed.toFixed(1)),
      angleDeg: newAngle,
    });
  };

  const handlePointerUpSling = (e: React.PointerEvent) => {
    if (!isAimDragging) return;
    setIsAimDragging(false);
    setDragStart(null);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
    handleFire();
  };

  // Fullscreen Handler
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

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullscreen]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl transition-all flex flex-col overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-0 h-screen overflow-y-auto p-4 md:p-6' : 'p-4 sm:p-6'
      }`}
    >
      {/* Top Header & Telemetry */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-cyan-400 tracking-tight flex items-center gap-2">
              Tiro Parabólico 2D
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-950/80 border border-orange-500/50 text-orange-300 font-bold flex items-center gap-1 shadow-[0_0_10px_rgba(251,146,60,0.25)]">
                <Flame className="w-3 h-3 text-orange-400" />
                Angry Ping-Pong Tank
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Arrastra el cañón hacia atrás tipo <strong className="text-orange-400">Angry Birds</strong> o ajusta los grados con los controles en pantalla.
          </p>
        </div>

        {/* Action Controls & Protractor Degree Indicator */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* INTERACTIVE 2D ANGLE DEGREE INDICATOR & STEPPER */}
          <div className="bg-slate-900/90 border border-orange-500/50 px-3 py-1.5 rounded-xl shadow-[0_0_15px_rgba(249,115,22,0.2)] flex items-center gap-2">
            <Compass className="w-4 h-4 text-orange-400" />
            <span className="text-[10px] font-mono text-slate-400 font-bold">ÁNGULO:</span>
            <span className="text-sm font-mono font-black text-orange-400 tabular-nums">
              {params.angleDeg}°
            </span>

            {/* Steppers */}
            <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
              <button
                type="button"
                onClick={() => handleSetAngle(params.angleDeg - 5)}
                className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:text-white text-[10px] font-mono cursor-pointer"
                title="-5°"
              >
                -5°
              </button>
              <button
                type="button"
                onClick={() => handleSetAngle(params.angleDeg - 1)}
                className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:text-white text-xs cursor-pointer"
                title="-1°"
              >
                <Minus className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleSetAngle(params.angleDeg + 1)}
                className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:text-white text-xs cursor-pointer"
                title="+1°"
              >
                <Plus className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleSetAngle(params.angleDeg + 5)}
                className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:text-white text-[10px] font-mono cursor-pointer"
                title="+5°"
              >
                +5°
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowVectors(!showVectors)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
              showVectors 
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50' 
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Vectores: {showVectors ? 'ON' : 'OFF'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowTrajectoryArc(!showTrajectoryArc)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
              showTrajectoryArc 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' 
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Trayectoria: {showTrajectoryArc ? 'ON' : 'OFF'}</span>
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-all cursor-pointer shadow-lg"
            title={isFullscreen ? 'Salir de pantalla completa (ESC)' : 'Pantalla Completa'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-cyan-400" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Physics Real-Time HUD */}
      <div className="w-full bg-[#101422] border border-slate-800 rounded-2xl p-4 mb-4 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 text-xs font-mono">
        <div className="flex flex-col">
          <span className="text-slate-400 text-[10px]">TIEMPO (t)</span>
          <span className="font-bold text-cyan-400 text-sm tabular-nums">{currentInstant.time.toFixed(2)} s</span>
          <span className="text-[10px] text-slate-500">Total: {results.timeTotal.toFixed(2)}s</span>
        </div>

        <div className="flex flex-col">
          <span className="text-slate-400 text-[10px]">DISTANCIA (x)</span>
          <span className="font-bold text-blue-400 text-sm tabular-nums">{currentInstant.x.toFixed(2)} m</span>
          <span className="text-[10px] text-slate-500">Max: {results.maxRange.toFixed(1)}m</span>
        </div>

        <div className="flex flex-col">
          <span className="text-slate-400 text-[10px]">ALTURA (y)</span>
          <span className="font-bold text-emerald-400 text-sm tabular-nums">{currentInstant.y.toFixed(2)} m</span>
          <span className="text-[10px] text-slate-500">Ymax: {results.maxHeight.toFixed(2)}m</span>
        </div>

        <div className="flex flex-col">
          <span className="text-slate-400 text-[10px]">VELOCIDAD TOTAL (v)</span>
          <span className="font-bold text-amber-400 text-sm tabular-nums">{currentInstant.velocity.toFixed(2)} m/s</span>
          <span className="text-[10px] text-slate-500">v0: {params.initialVelocity} m/s</span>
        </div>

        <div className="flex flex-col">
          <span className="text-slate-400 text-[10px]">COMPONENTE Vx</span>
          <span className="font-bold text-emerald-400 text-sm tabular-nums">{currentInstant.vx.toFixed(2)} m/s</span>
          <span className="text-[10px] text-slate-500">Constante (MRU)</span>
        </div>

        <div className="flex flex-col">
          <span className="text-slate-400 text-[10px]">COMPONENTE Vy</span>
          <span className="font-bold text-purple-400 text-sm tabular-nums">{currentInstant.vy.toFixed(2)} m/s</span>
          <span className="text-[10px] text-slate-500">g = {params.gravity} m/s²</span>
        </div>

        <div className="flex flex-col bg-slate-900/80 px-2 py-1 rounded-xl border border-slate-800">
          <span className="text-slate-400 text-[10px]">DIANA / CANASTA</span>
          <span className="font-bold text-orange-400 text-sm tabular-nums">{params.targetDistance} m</span>
          <span className={`text-[10px] font-bold ${results.hitTarget ? 'text-emerald-400' : 'text-slate-400'}`}>
            {results.hitTarget ? '🎯 ¡ACIERTO!' : `Δ ${results.targetErrorMeters.toFixed(1)}m`}
          </span>
        </div>
      </div>

      {/* Main SVG Interactive Simulation Arena */}
      <div className="relative w-full h-[400px] sm:h-[480px] bg-gradient-to-b from-slate-900 via-[#0b101e] to-[#080b14] rounded-2xl border border-slate-800 overflow-hidden shadow-inner select-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${viewWidth} ${viewHeight}`}
          className="w-full h-full block"
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="parabolicGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.7" opacity="0.4" />
            </pattern>

            {/* Glowing Trajectory Gradient */}
            <linearGradient id="trajectoryGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#fb923c" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.8" />
            </linearGradient>

            {/* Ping-Pong Ball Radial Gradient */}
            <radialGradient id="pingPongSphere" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#fb923c" />
              <stop offset="90%" stopColor="#c2410c" />
              <stop offset="100%" stopColor="#7c2d12" />
            </radialGradient>

            {/* Vector Arrow Markers */}
            <marker id="arrowVx" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M 0 0 L 6 3 L 0 6 z" fill="#10b981" />
            </marker>
            <marker id="arrowVy" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M 0 0 L 6 3 L 0 6 z" fill="#c084fc" />
            </marker>
            <marker id="arrowVTotal" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M 0 0 L 6 3 L 0 6 z" fill="#facc15" />
            </marker>
            <marker id="arrowG" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M 0 0 L 6 3 L 0 6 z" fill="#f43f5e" />
            </marker>
          </defs>

          {/* Background Grid */}
          <rect width="100%" height="100%" fill="url(#parabolicGrid)" />

          {/* Ground Platform */}
          <rect 
            x="0" 
            y={groundY} 
            width={viewWidth} 
            height={viewHeight - groundY} 
            fill="#090d16" 
          />
          <line 
            x1="0" 
            y1={groundY} 
            x2={viewWidth} 
            y2={groundY} 
            stroke="#0284c7" 
            strokeWidth="3" 
            strokeDasharray="8 4" 
          />

          {/* Metric Distance Marks along the ground */}
          {Array.from({ length: 11 }).map((_, i) => {
            const meter = Math.round((worldWidth / 10) * i);
            const mx = toSvgX(meter);
            if (mx < startX || mx > viewWidth - 20) return null;
            return (
              <g key={meter}>
                <line x1={mx} y1={groundY} x2={mx} y2={groundY + 10} stroke="#334155" strokeWidth="1.5" />
                <text x={mx} y={groundY + 22} textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="monospace">
                  {meter}m
                </text>
              </g>
            );
          })}

          {/* Target Basket / Hoop */}
          <g transform={`translate(${targetSvgX}, ${targetSvgY})`}>
            {/* Target Support Pole */}
            <line x1="0" y1="0" x2="0" y2={groundY - targetSvgY} stroke="#475569" strokeWidth="4" />
            
            {/* Target Basket Hoop / Backboard */}
            <circle cx="0" cy="0" r={targetRadiusSvg} fill="none" stroke="#ea580c" strokeWidth="3" strokeDasharray="4 2" />
            <circle cx="0" cy="0" r="6" fill="#f97316" />
            
            {/* Target Net */}
            <path d={`M ${-targetRadiusSvg} 0 Q 0 ${targetRadiusSvg * 1.4} ${targetRadiusSvg} 0`} fill="none" stroke="#fba76b" strokeWidth="1.5" opacity="0.7" />
            
            {/* Target Distance Flag */}
            <g transform="translate(0, -28)">
              <rect x="-30" y="-14" width="60" height="20" rx="5" fill="#1e293b" stroke="#f97316" strokeWidth="1.5" />
              <text x="0" y="0" textAnchor="middle" fill="#fdba74" fontSize="10" fontWeight="bold" fontFamily="monospace">
                🎯 {params.targetDistance}m
              </text>
            </g>
          </g>

          {/* Theoretical Trajectory Curve */}
          {showTrajectoryArc && (
            <g>
              <path
                d={trajectoryPathData}
                fill="none"
                stroke="url(#trajectoryGlow)"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                className="opacity-80"
              />
              {/* Peak Height Indicator */}
              <circle
                cx={toSvgX(results.vox * results.timeAscent)}
                cy={toSvgY(results.maxHeight)}
                r="4"
                fill="#38bdf8"
                stroke="#0284c7"
                strokeWidth="2"
              />
              <text
                x={toSvgX(results.vox * results.timeAscent)}
                y={toSvgY(results.maxHeight) - 10}
                textAnchor="middle"
                fill="#38bdf8"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
              >
                Ymax: {results.maxHeight.toFixed(2)}m
              </text>
            </g>
          )}

          {/* ROBOTIC TANK LAUNCHER */}
          <g transform={`translate(${cannonBaseX}, ${groundY})`}>
            {/* Tank Shadow */}
            <ellipse cx="0" cy="2" rx="46" ry="8" fill="#000000" opacity="0.6" />

            {/* Tank Tread / Mechanum Wheels Base */}
            <rect x="-42" y="-18" width="84" height="18" rx="7" fill="#0f172a" stroke="#00f0ff" strokeWidth="1.5" />
            
            {/* Mechanum Rollers on Wheels */}
            {[-30, -10, 10, 30].map((wx, idx) => (
              <g key={idx} transform={`translate(${wx}, -9)`}>
                <circle cx="0" cy="0" r="7" fill="#1e293b" stroke="#eab308" strokeWidth="1.5" />
                <line x1="-5" y1="-5" x2="5" y2="5" stroke="#facc15" strokeWidth="1.2" />
              </g>
            ))}

            {/* Tank Upper Armored Hull */}
            <path d="M -36 -18 L -24 -36 L 24 -36 L 36 -18 Z" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
            <rect x="-20" y="-34" width="40" height="8" rx="3" fill="#0ea5e9" opacity="0.3" />

            {/* Rotating Turret Center */}
            <circle cx="0" cy="-36" r="14" fill="#0f172a" stroke="#00f0ff" strokeWidth="2" />
            <circle cx="0" cy="-36" r="6" fill="#0284c7" />

            {/* Elevation Actuator Cylinder */}
            <line x1="0" y1="-36" x2={Math.cos(angleRad) * 16} y2={-36 - Math.sin(angleRad) * 16} stroke="#f59e0b" strokeWidth="4" />

            {/* CANNON BARREL pointing at angleDeg */}
            <g transform={`translate(0, -36) rotate(${-params.angleDeg})`}>
              <rect x="0" y="-7" width={barrelLength} height="14" rx="3" fill="#334155" stroke="#64748b" strokeWidth="1.5" />
              <rect x={barrelLength - 6} y="-9" width="8" height="18" rx="2" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
              {!isFlying && currentTime === 0 && (
                <circle cx={barrelLength + 6} cy="0" r="7" fill="url(#pingPongSphere)" stroke="#ea580c" strokeWidth="1" />
              )}
            </g>

            {/* Ping-Pong Magazine Loader on top of tank */}
            <g transform="translate(-16, -50)">
              <rect x="0" y="0" width="12" height="18" rx="4" fill="#0f172a" stroke="#f97316" strokeWidth="1.2" />
              <circle cx="6" cy="6" r="4" fill="#fb923c" />
              <circle cx="6" cy="13" r="4" fill="#fb923c" />
            </g>

            {/* High-Visibility Protractor Arc on Tank */}
            <path
              d={`M 26 -36 A 26 26 0 0 0 ${Math.cos(angleRad) * 26} ${-36 - Math.sin(angleRad) * 26}`}
              fill="none"
              stroke="#fb923c"
              strokeWidth="2.5"
            />
            {/* Glowing Angle Readout directly beside barrel */}
            <g transform={`translate(${Math.cos(angleRad) * 36 + 10}, ${-36 - Math.sin(angleRad) * 36 - 6})`}>
              <rect x="-4" y="-12" width="40" height="18" rx="4" fill="#0f172a" stroke="#fb923c" strokeWidth="1.5" />
              <text x="16" y="1" textAnchor="middle" fill="#fb923c" fontSize="11" fontWeight="bold" fontFamily="monospace">
                {params.angleDeg}°
              </text>
            </g>
          </g>

          {/* ANGRY BIRDS INTERACTIVE SLINGSHOT CONTROLLER */}
          {!isFlying && (
            <g
              transform={`translate(${barrelTipX}, ${barrelTipY})`}
              className="cursor-grab active:cursor-grabbing"
              onPointerDown={handlePointerDownSling}
              onPointerMove={handlePointerMoveSling}
              onPointerUp={handlePointerUpSling}
            >
              <circle cx="0" cy="0" r="18" fill="#f97316" fillOpacity="0.25" stroke="#fb923c" strokeWidth="2" strokeDasharray="3 3" className="animate-spin" />
              <circle cx="0" cy="0" r="9" fill="#fb923c" stroke="#ffffff" strokeWidth="2" />
              
              {/* Pull-to-Aim Hint & Live Angle Display */}
              <g transform="translate(24, -14)">
                <rect x="0" y="0" width="160" height="26" rx="6" fill="#090d16" stroke="#fb923c" strokeWidth="1.5" opacity="0.95" />
                <text x="8" y="17" fill="#fef08a" fontSize="11" fontWeight="bold" fontFamily="monospace">
                  🎯 {params.angleDeg}° | {params.initialVelocity} m/s
                </text>
              </g>
            </g>
          )}

          {/* FLYING PING-PONG BALL */}
          {(isFlying || currentTime > 0) && (
            <g transform={`translate(${ballSvgX}, ${ballSvgY})`}>
              {/* Ball Shadow on Ground */}
              <ellipse 
                cx="0" 
                cy={groundY - ballSvgY} 
                rx={Math.max(3, 10 - (currentInstant.y * 0.4))} 
                ry={Math.max(1.5, 4 - (currentInstant.y * 0.15))} 
                fill="#000000" 
                opacity={Math.max(0.1, 0.6 - (currentInstant.y * 0.03))} 
              />

              {/* Ping Pong Ball */}
              <circle
                cx="0"
                cy="0"
                r={Math.max(6, selectedPreset.radius * 35)}
                fill="url(#pingPongSphere)"
                stroke="#c2410c"
                strokeWidth="1.2"
                className="filter drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]"
              />

              {/* Dynamic Vector Arrows on Ball in 2D */}
              {showVectors && (
                <g>
                  {/* Vx Vector (horizontal green arrow) */}
                  <line
                    x1="0"
                    y1="0"
                    x2={currentInstant.vx * 2.2}
                    y2="0"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    markerEnd="url(#arrowVx)"
                  />
                  <text x={currentInstant.vx * 2.2 + 8} y="4" fill="#10b981" fontSize="9" fontWeight="bold" fontFamily="monospace">
                    vx: {currentInstant.vx.toFixed(1)}
                  </text>

                  {/* Vy Vector (vertical purple arrow) */}
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2={-currentInstant.vy * 2.2}
                    stroke="#c084fc"
                    strokeWidth="2.5"
                    markerEnd="url(#arrowVy)"
                  />
                  <text x="6" y={-currentInstant.vy * 2.2} fill="#c084fc" fontSize="9" fontWeight="bold" fontFamily="monospace">
                    vy: {currentInstant.vy.toFixed(1)}
                  </text>

                  {/* V Resultant Vector (yellow diagonal arrow) */}
                  <line
                    x1="0"
                    y1="0"
                    x2={currentInstant.vx * 2.2}
                    y2={-currentInstant.vy * 2.2}
                    stroke="#facc15"
                    strokeWidth="2"
                    strokeDasharray="2 2"
                    markerEnd="url(#arrowVTotal)"
                  />

                  {/* Gravity Vector (red arrow down) */}
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="22"
                    stroke="#f43f5e"
                    strokeWidth="1.8"
                    markerEnd="url(#arrowG)"
                  />
                  <text x="-24" y="24" fill="#f43f5e" fontSize="8" fontWeight="bold" fontFamily="monospace">
                    g: 9.8
                  </text>
                </g>
              )}
            </g>
          )}
        </svg>

        {/* Score / Target Pop-up */}
        {scorePopup && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-slate-900/95 border-2 border-orange-500 rounded-2xl px-6 py-3 shadow-[0_0_30px_rgba(249,115,22,0.4)] flex items-center gap-4 animate-bounce">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <div>
              <div className="text-sm font-black text-white uppercase">{scorePopup.text}</div>
              <div className="text-xl font-mono font-bold text-yellow-400">+{scorePopup.score} Pts</div>
            </div>
            <button
              type="button"
              onClick={handleFire}
              className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Floating Quick Action Fire & Angle Bar */}
        <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/85 backdrop-blur-md border border-slate-800 p-2.5 rounded-2xl">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFire}
              disabled={isFlying}
              className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(249,115,22,0.4)] disabled:opacity-50 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>¡DISPARAR CAÑÓN! ({params.angleDeg}°)</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Reiniciar Tiro"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Angle Slider in 2D Bar */}
          <div className="flex items-center gap-2 font-mono text-xs text-slate-400 flex-1 max-w-xs">
            <span className="text-[11px] whitespace-nowrap">Ángulo α:</span>
            <input
              type="range"
              min="10"
              max="90"
              step="1"
              value={params.angleDeg}
              onChange={(e) => handleSetAngle(parseInt(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer"
            />
            <span className="font-bold text-orange-400 text-xs tabular-nums w-8">
              {params.angleDeg}°
            </span>
          </div>

          {/* Time Scrubber */}
          <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
            <span>t:</span>
            <input
              type="range"
              min="0"
              max={results.timeTotal || 1}
              step="0.02"
              value={currentTime}
              onChange={(e) => {
                setIsFlying(false);
                setCurrentTime(parseFloat(e.target.value));
              }}
              className="w-24 accent-cyan-500 cursor-pointer"
            />
            <span className="tabular-nums text-cyan-400">{currentTime.toFixed(2)}s</span>
          </div>
        </div>
      </div>
    </div>
  );
};
