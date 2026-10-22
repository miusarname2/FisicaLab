import React, { useState, useEffect, useRef } from 'react';
import { PhysicsParams } from '../types/physics';
import { ParabolicParams, ParabolicResults } from '../types/parabolic';
import { calculateAcceleration, getPhysicsAtTime } from '../utils/physics';
import { calculateParabolicResults, degToRad } from '../utils/parabolic';
import { sound } from '../utils/audio';
import { triggerFinishCelebration } from '../utils/confetti';
import { Simulation2D } from './Simulation2D';
import { ParabolicSimulation2D } from './ParabolicSimulation2D';
import { 
  Target, Car, Calculator, Sparkles, Star, 
  CheckCircle2, XCircle, AlertTriangle, ArrowRight, 
  RotateCcw, Play, Award, HelpCircle, BookOpen, Flame,
  X, Trophy, FastForward, Check, ExternalLink, RefreshCw
} from 'lucide-react';

interface MRUVPredictions {
  acceleration: string;
  finalVelocity: string;
  force: string;
  work: string;
}

interface ParabolicPredictions {
  vox: string;
  voy: string;
  maxHeight: string;
  maxRange: string;
  timeTotal: string;
}

export const ChallengeMode: React.FC = () => {
  // Selected Sub-experiment: 'mruv' | 'parabolic'
  const [challengeType, setChallengeType] = useState<'mruv' | 'parabolic'>('parabolic');

  // MRUV Given Initial Data
  const [mruvGiven, setMruvGiven] = useState({
    mass: 2.0,      // kg
    distance: 18.0,  // meters
    totalTime: 3.0, // seconds
  });

  // MRUV User Prediction Inputs
  const [mruvInput, setMruvInput] = useState<MRUVPredictions>({
    acceleration: '',
    finalVelocity: '',
    force: '',
    work: '',
  });

  // Parabolic Given Initial Data
  const [parabolicGiven, setParabolicGiven] = useState({
    initialVelocity: 20.0, // m/s
    angleDeg: 45,          // degrees
    gravity: 9.8,          // m/s^2
    projectileMass: 2.7,   // grams
  });

  // Parabolic User Prediction Inputs
  const [parabolicInput, setParabolicInput] = useState<ParabolicPredictions>({
    vox: '',
    voy: '',
    maxHeight: '',
    maxRange: '',
    timeTotal: '',
  });

  // Simulation & Evaluation State
  const [isTesting, setIsTesting] = useState(false);
  const [testProgress, setTestProgress] = useState(0);
  const [hasEvaluated, setHasEvaluated] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<{
    stars: number;
    globalAccuracy: number;
    items: {
      label: string;
      symbol: string;
      unit: string;
      userVal: number;
      realVal: number;
      accuracy: number;
      isAccepted: boolean;
      formula: string;
    }[];
  } | null>(null);

  // Experiment Modal & Live Stage State
  const [isExperimentModalOpen, setIsExperimentModalOpen] = useState(false);
  const [modalPhase, setModalPhase] = useState<'simulation' | 'victory'>('simulation');
  const [modalSimFinished, setModalSimFinished] = useState(false);

  // Modal MRUV Stage State
  const [modalMruvParams, setModalMruvParams] = useState<PhysicsParams>({
    mass: 2.0,
    distance: 18.0,
    totalTime: 3.0,
    initialVelocity: 0,
  });
  const [modalMruvTime, setModalMruvTime] = useState(0);
  const [modalMruvPlaying, setModalMruvPlaying] = useState(false);
  const [modalMruvArcade, setModalMruvArcade] = useState(true);

  // Modal Parabolic Stage State
  const [modalParabolicParams, setModalParabolicParams] = useState<ParabolicParams>({
    initialVelocity: 20.0,
    angleDeg: 45,
    initialHeight: 0,
    gravity: 9.8,
    projectileMass: 2.7,
    projectileId: 'pingpong',
    targetDistance: 20,
    targetHeight: 0,
    targetRadius: 1.2,
  });

  // Generate random university quiz problem
  const handleRandomize = () => {
    sound.playClick();
    setHasEvaluated(false);
    setIsTesting(false);
    setEvaluationResult(null);

    if (challengeType === 'mruv') {
      const distances = [12, 16, 20, 24, 30, 40];
      const times = [2.0, 2.5, 3.0, 4.0, 5.0];
      const masses = [1.5, 2.0, 3.0, 5.0, 10.0];
      const d = distances[Math.floor(Math.random() * distances.length)];
      const t = times[Math.floor(Math.random() * times.length)];
      const m = masses[Math.floor(Math.random() * masses.length)];
      setMruvGiven({ distance: d, totalTime: t, mass: m });
      setMruvInput({ acceleration: '', finalVelocity: '', force: '', work: '' });
    } else {
      const speeds = [12, 15, 18, 20, 25, 30];
      const angles = [30, 45, 53, 60];
      const v = speeds[Math.floor(Math.random() * speeds.length)];
      const a = angles[Math.floor(Math.random() * angles.length)];
      setParabolicGiven(prev => ({ ...prev, initialVelocity: v, angleDeg: a }));
      setParabolicInput({ vox: '', voy: '', maxHeight: '', maxRange: '', timeTotal: '' });
    }
  };

  // Animation Loop for MRUV when inside the experiment modal
  useEffect(() => {
    if (!isExperimentModalOpen || modalPhase !== 'simulation' || challengeType !== 'mruv' || !modalMruvPlaying) {
      return;
    }

    let animId: number;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      setModalMruvTime((prev) => {
        const next = prev + dt;
        if (next >= modalMruvParams.totalTime) {
          setModalMruvPlaying(false);
          setModalSimFinished(true);
          sound.playTargetHit();
          if (evaluationResult && evaluationResult.stars >= 2) {
            triggerFinishCelebration();
          }
          return modalMruvParams.totalTime;
        }
        return next;
      });

      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isExperimentModalOpen, modalPhase, challengeType, modalMruvPlaying, modalMruvParams.totalTime, evaluationResult]);

  // Handle parabolic simulation completion inside modal
  const handleParabolicLaunchCompleted = (_results: ParabolicResults) => {
    setModalSimFinished(true);
    sound.playTargetHit();
    if (evaluationResult && evaluationResult.stars >= 2) {
      triggerFinishCelebration();
    }
  };

  // Run the test simulation and open Experiment Modal
  const handleRunTest = () => {
    sound.playClick();
    setIsTesting(false);

    // Compute ground truth physical results
    if (challengeType === 'mruv') {
      const p: PhysicsParams = {
        mass: mruvGiven.mass,
        distance: mruvGiven.distance,
        totalTime: mruvGiven.totalTime,
        initialVelocity: 0,
      };
      const realAcc = calculateAcceleration(p);
      const realVf = realAcc * p.totalTime;
      const realF = p.mass * realAcc;
      const realW = realF * p.distance;

      const userAcc = parseFloat(mruvInput.acceleration) || 0;
      const userVf = parseFloat(mruvInput.finalVelocity) || 0;
      const userF = parseFloat(mruvInput.force) || 0;
      const userW = parseFloat(mruvInput.work) || 0;

      const calcAccuracy = (user: number, real: number) => {
        if (real === 0) return user === 0 ? 100 : 0;
        const err = (Math.abs(user - real) / real) * 100;
        return Math.max(0, Math.min(100, 100 - err));
      };

      const accAcc = calcAccuracy(userAcc, realAcc);
      const accVf = calcAccuracy(userVf, realVf);
      const accF = calcAccuracy(userF, realF);
      const accW = calcAccuracy(userW, realW);

      const items = [
        {
          label: 'Aceleración',
          symbol: 'a',
          unit: 'm/s²',
          userVal: userAcc,
          realVal: realAcc,
          accuracy: accAcc,
          isAccepted: accAcc >= 85,
          formula: `a = 2d / t² = 2(${p.distance}) / (${p.totalTime})² = ${realAcc.toFixed(2)} m/s²`,
        },
        {
          label: 'Velocidad Final',
          symbol: 'vf',
          unit: 'm/s',
          userVal: userVf,
          realVal: realVf,
          accuracy: accVf,
          isAccepted: accVf >= 85,
          formula: `vf = a · t = ${realAcc.toFixed(2)} · ${p.totalTime} = ${realVf.toFixed(2)} m/s`,
        },
        {
          label: 'Fuerza Neta',
          symbol: 'F',
          unit: 'N',
          userVal: userF,
          realVal: realF,
          accuracy: accF,
          isAccepted: accF >= 85,
          formula: `F = m · a = ${p.mass} · ${realAcc.toFixed(2)} = ${realF.toFixed(2)} N`,
        },
        {
          label: 'Trabajo Mecánico / Energía',
          symbol: 'W',
          unit: 'J',
          userVal: userW,
          realVal: realW,
          accuracy: accW,
          isAccepted: accW >= 85,
          formula: `W = F · d = ${realF.toFixed(2)} · ${p.distance} = ${realW.toFixed(2)} J`,
        },
      ];

      const globalAccuracy = items.reduce((sum, it) => sum + it.accuracy, 0) / items.length;
      let stars = 0;
      if (globalAccuracy >= 85) stars = 3;
      else if (globalAccuracy >= 75) stars = 2;
      else if (globalAccuracy >= 60) stars = 1;

      // Configure Modal MRUV Stage
      setModalMruvParams(p);
      setModalMruvTime(0);
      setModalMruvPlaying(true);
      setModalSimFinished(false);
      setModalPhase('simulation');
      setEvaluationResult({ stars, globalAccuracy, items });
      setHasEvaluated(true);
      setIsExperimentModalOpen(true);
      sound.playBrumm(0.85);

    } else {
      // Parabolic calculations
      const p: ParabolicParams = {
        initialVelocity: parabolicGiven.initialVelocity,
        angleDeg: parabolicGiven.angleDeg,
        initialHeight: 0,
        gravity: parabolicGiven.gravity,
        projectileMass: parabolicGiven.projectileMass,
        projectileId: 'pingpong',
        targetDistance: 20,
        targetHeight: 0,
        targetRadius: 1.2,
      };

      const real = calculateParabolicResults(p);

      const userVox = parseFloat(parabolicInput.vox) || 0;
      const userVoy = parseFloat(parabolicInput.voy) || 0;
      const userHmax = parseFloat(parabolicInput.maxHeight) || 0;
      const userRmax = parseFloat(parabolicInput.maxRange) || 0;
      const userTtotal = parseFloat(parabolicInput.timeTotal) || 0;

      const calcAccuracy = (user: number, truth: number) => {
        if (truth === 0) return user === 0 ? 100 : 0;
        const err = (Math.abs(user - truth) / truth) * 100;
        return Math.max(0, Math.min(100, 100 - err));
      };

      const items = [
        {
          label: 'Componente Horizontal',
          symbol: 'v₀ₓ',
          unit: 'm/s',
          userVal: userVox,
          realVal: real.vox,
          accuracy: calcAccuracy(userVox, real.vox),
          isAccepted: calcAccuracy(userVox, real.vox) >= 85,
          formula: `v₀ₓ = v₀ · cos(α) = ${p.initialVelocity} · cos(${p.angleDeg}°) = ${real.vox.toFixed(2)} m/s`,
        },
        {
          label: 'Componente Vertical',
          symbol: 'v₀ᵧ',
          unit: 'm/s',
          userVal: userVoy,
          realVal: real.voy,
          accuracy: calcAccuracy(userVoy, real.voy),
          isAccepted: calcAccuracy(userVoy, real.voy) >= 85,
          formula: `v₀ᵧ = v₀ · sin(α) = ${p.initialVelocity} · sin(${p.angleDeg}°) = ${real.voy.toFixed(2)} m/s`,
        },
        {
          label: 'Altura Máxima',
          symbol: 'Ymax',
          unit: 'm',
          userVal: userHmax,
          realVal: real.maxHeight,
          accuracy: calcAccuracy(userHmax, real.maxHeight),
          isAccepted: calcAccuracy(userHmax, real.maxHeight) >= 85,
          formula: `Ymax = (v₀ᵧ)² / (2g) = (${real.voy.toFixed(2)})² / (2 · ${p.gravity}) = ${real.maxHeight.toFixed(2)} m`,
        },
        {
          label: 'Alcance Horizontal Máximo',
          symbol: 'Xmax',
          unit: 'm',
          userVal: userRmax,
          realVal: real.maxRange,
          accuracy: calcAccuracy(userRmax, real.maxRange),
          isAccepted: calcAccuracy(userRmax, real.maxRange) >= 85,
          formula: `Xmax = v₀ₓ · t_vuelo = ${real.vox.toFixed(2)} · ${real.timeTotal.toFixed(2)} = ${real.maxRange.toFixed(2)} m`,
        },
        {
          label: 'Tiempo Total de Vuelo',
          symbol: 't_vuelo',
          unit: 's',
          userVal: userTtotal,
          realVal: real.timeTotal,
          accuracy: calcAccuracy(userTtotal, real.timeTotal),
          isAccepted: calcAccuracy(userTtotal, real.timeTotal) >= 85,
          formula: `t_vuelo = 2 · v₀ᵧ / g = 2 · ${real.voy.toFixed(2)} / ${p.gravity} = ${real.timeTotal.toFixed(2)} s`,
        },
      ];

      const globalAccuracy = items.reduce((sum, it) => sum + it.accuracy, 0) / items.length;
      let stars = 0;
      if (globalAccuracy >= 85) stars = 3;
      else if (globalAccuracy >= 75) stars = 2;
      else if (globalAccuracy >= 60) stars = 1;

      // Configure Modal Parabolic Stage
      setModalParabolicParams(p);
      setModalSimFinished(false);
      setModalPhase('simulation');
      setEvaluationResult({ stars, globalAccuracy, items });
      setHasEvaluated(true);
      setIsExperimentModalOpen(true);
      sound.playCannonFire();
    }
  };

  return (
    <div className="w-full bg-slate-900/95 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold mb-2">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>MODO EVALUACIÓN: ¡INTÉNTALO TÚ MISMO!</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            Comprueba tus Cálculos con el Simulador
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Ingresa o genera datos iniciales, calcula a mano tus predicciones teóricas (aceleración, velocidad, alcance o altura máxima) y pon a prueba tus resultados. Si tu precisión está entre el <strong>85% y 90%</strong> o superior, obtendrás las <strong>3 Estrellas de Excelencia Física</strong>.
          </p>
        </div>

        {/* Experiment Selector Tabs */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 self-start md:self-auto">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setChallengeType('parabolic');
              setHasEvaluated(false);
              setEvaluationResult(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              challengeType === 'parabolic'
                ? 'bg-orange-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Tiro Parabólico</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setChallengeType('mruv');
              setHasEvaluated(false);
              setEvaluationResult(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              challengeType === 'mruv'
                ? 'bg-cyan-400 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Cinemática MRUV</span>
          </button>
        </div>
      </div>

      {/* Main Dual Stage: Left (Given Data) & Right (User Predictions) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Given Data (Paso 1) */}
        <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800/90 rounded-2xl p-5 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">1</span>
              DATOS INICIALES DEL PROBLEMA
            </span>

            <button
              type="button"
              onClick={handleRandomize}
              className="text-[11px] font-mono font-bold text-amber-400 hover:text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>🎲 Problema Aleatorio</span>
            </button>
          </div>

          {challengeType === 'mruv' ? (
            <div className="space-y-4 text-xs font-mono">
              <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-400 block text-[10px]">DISTANCIA A RECORRER (d):</span>
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    value={mruvGiven.distance}
                    onChange={(e) => setMruvGiven({ ...mruvGiven, distance: parseFloat(e.target.value) || 1 })}
                    className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold"
                  />
                  <span className="text-blue-400 font-bold text-sm">metros (m)</span>
                </div>
              </div>

              <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-400 block text-[10px]">TIEMPO MEDIDO EN RECORRIDO (t):</span>
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="number"
                    min="0.5"
                    max="20"
                    step="0.5"
                    value={mruvGiven.totalTime}
                    onChange={(e) => setMruvGiven({ ...mruvGiven, totalTime: parseFloat(e.target.value) || 1 })}
                    className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold"
                  />
                  <span className="text-cyan-400 font-bold text-sm">segundos (s)</span>
                </div>
              </div>

              <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-400 block text-[10px]">MASA DEL VEHÍCULO / MÓVIL (m):</span>
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="number"
                    min="0.1"
                    max="100"
                    step="0.5"
                    value={mruvGiven.mass}
                    onChange={(e) => setMruvGiven({ ...mruvGiven, mass: parseFloat(e.target.value) || 1 })}
                    className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold"
                  />
                  <span className="text-purple-400 font-bold text-sm">kilogramos (kg)</span>
                </div>
              </div>

              <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                💡 <em>Nota:</em> Se asume partida desde el reposo absoluto ($v_0 = 0$ m/s).
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs font-mono">
              <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-400 block text-[10px]">VELOCIDAD INICIAL DE DISPARO (v₀):</span>
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="number"
                    min="5"
                    max="50"
                    step="1"
                    value={parabolicGiven.initialVelocity}
                    onChange={(e) => setParabolicGiven({ ...parabolicGiven, initialVelocity: parseFloat(e.target.value) || 5 })}
                    className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold"
                  />
                  <span className="text-amber-400 font-bold text-sm">m/s</span>
                </div>
              </div>

              <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-400 block text-[10px]">ÁNGULO DE ELEVACIÓN DEL CAÑÓN (α):</span>
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="number"
                    min="10"
                    max="85"
                    step="1"
                    value={parabolicGiven.angleDeg}
                    onChange={(e) => setParabolicGiven({ ...parabolicGiven, angleDeg: parseInt(e.target.value) || 10 })}
                    className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold"
                  />
                  <span className="text-purple-400 font-bold text-sm">grados (°)</span>
                </div>
              </div>

              <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-400 block text-[10px]">ACELERACIÓN GRAVITATORIA (g):</span>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-slate-200">{parabolicGiven.gravity}</span>
                  <span className="text-cyan-400 font-bold text-sm">m/s² (Tierra)</span>
                </div>
              </div>

              <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-400 block text-[10px]">PROYECTIL:</span>
                <span className="font-bold text-orange-400">Pelota de Ping Pong Oficial (2.7g)</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: User Predictions Form (Paso 2) */}
        <div className="lg:col-span-7 bg-slate-950/80 border border-slate-800/90 rounded-2xl p-5 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">2</span>
              ESCRIBE TUS CÁLCULOS ESPERADOS (PREDICCIONES)
            </span>
            <span className="text-[11px] font-mono text-slate-500">Precisión requerida: 85-90%</span>
          </div>

          {challengeType === 'mruv' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-1.5">
                <label className="text-slate-400 text-[11px]">Aceleración calculada (a):</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ej: 4.00"
                    value={mruvInput.acceleration}
                    onChange={(e) => setMruvInput({ ...mruvInput, acceleration: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold text-sm focus:border-cyan-400 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-500 text-xs">m/s²</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-[11px]">Velocidad Final calculada (vf):</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ej: 12.00"
                    value={mruvInput.finalVelocity}
                    onChange={(e) => setMruvInput({ ...mruvInput, finalVelocity: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold text-sm focus:border-cyan-400 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-500 text-xs">m/s</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-[11px]">Fuerza Neta requerida (F):</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ej: 8.00"
                    value={mruvInput.force}
                    onChange={(e) => setMruvInput({ ...mruvInput, force: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold text-sm focus:border-cyan-400 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-500 text-xs">N</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-[11px]">Trabajo mecánico (W = F · d):</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ej: 144.00"
                    value={mruvInput.work}
                    onChange={(e) => setMruvInput({ ...mruvInput, work: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold text-sm focus:border-cyan-400 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-500 text-xs">Joules</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-1.5">
                <label className="text-slate-400 text-[11px]">Componente horizontal (v₀ₓ):</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="v₀ · cos(α)"
                    value={parabolicInput.vox}
                    onChange={(e) => setParabolicInput({ ...parabolicInput, vox: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold text-sm focus:border-orange-400 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-500 text-xs">m/s</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-[11px]">Componente vertical (v₀ᵧ):</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="v₀ · sin(α)"
                    value={parabolicInput.voy}
                    onChange={(e) => setParabolicInput({ ...parabolicInput, voy: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold text-sm focus:border-orange-400 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-500 text-xs">m/s</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-[11px]">Altura máxima calculada (Ymax):</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="(v₀ᵧ)² / 2g"
                    value={parabolicInput.maxHeight}
                    onChange={(e) => setParabolicInput({ ...parabolicInput, maxHeight: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold text-sm focus:border-orange-400 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-500 text-xs">m</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-[11px]">Alcance máximo calculado (Xmax):</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="v₀ₓ · t_vuelo"
                    value={parabolicInput.maxRange}
                    onChange={(e) => setParabolicInput({ ...parabolicInput, maxRange: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold text-sm focus:border-orange-400 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-500 text-xs">m</span>
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-slate-400 text-[11px]">Tiempo total de vuelo esperado (t_total):</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="2 · v₀ᵧ / g"
                    value={parabolicInput.timeTotal}
                    onChange={(e) => setParabolicInput({ ...parabolicInput, timeTotal: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold text-sm focus:border-orange-400 focus:outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-500 text-xs">segundos</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Button: ¡VAMOS A PROBAR! */}
          <div className="pt-2 space-y-2.5">
            <button
              type="button"
              onClick={handleRunTest}
              className={`w-full py-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xl active:scale-98 ${
                challengeType === 'parabolic'
                  ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 shadow-orange-500/30'
                  : 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-cyan-500/30'
              }`}
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>🚀 ¡VAMOS A PROBAR! (FASE DE EXPERIMENTACIÓN EN VIVO)</span>
            </button>

            {hasEvaluated && (
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setModalPhase('victory');
                  setIsExperimentModalOpen(true);
                  if (evaluationResult && evaluationResult.stars >= 2) {
                    triggerFinishCelebration();
                  }
                }}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span>Ver Modal de la Victoria y Puntuación</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL DE FASE DE EXPERIMENTACIÓN & VICTORIA (User Request) */}
      {/* ============================================================ */}
      {isExperimentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-5xl bg-slate-900 border-2 border-slate-700/80 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Top Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${challengeType === 'mruv' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-orange-500/20 text-orange-400'}`}>
                  {challengeType === 'mruv' ? <Car className="w-5 h-5" /> : <Target className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    {challengeType === 'mruv' ? 'Experimento 1: Cinemática MRUV en Riel' : 'Experimento 2: Tiro Parabólico de Artillería'}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
                      {modalPhase === 'simulation' ? 'Fase de Experimentación' : 'Modal de la Victoria'}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {modalPhase === 'simulation'
                      ? 'Simulando en vivo las condiciones físicas del reto para comprobar tus predicciones'
                      : 'Contraste matemático, precisión de predicciones y puntuación'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Switcher between Simulation and Victory */}
                <div className="hidden sm:flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setModalPhase('simulation');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      modalPhase === 'simulation'
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    1. Fase de Experimentación
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setModalPhase('victory');
                      if (evaluationResult && evaluationResult.stars >= 2) {
                        triggerFinishCelebration();
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      modalPhase === 'victory'
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    2. Modal de Victoria
                  </button>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setIsExperimentModalOpen(false);
                  }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                  title="Cerrar modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto p-4 sm:p-6 space-y-5 flex-1">
              {modalPhase === 'simulation' ? (
                /* FASE DE EXPERIMENTACIÓN */
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs text-slate-300 font-mono">
                      <span className="text-amber-400 font-bold">🔬 FASE DE EXPERIMENTACIÓN ACTIVA: </span>
                      {challengeType === 'mruv'
                        ? `Riel configurado a ${mruvGiven.distance}m, tiempo ${mruvGiven.totalTime}s y masa ${mruvGiven.mass}kg.`
                        : `Cañón configurado a v₀=${parabolicGiven.initialVelocity}m/s, ángulo ${parabolicGiven.angleDeg}° y gravedad ${parabolicGiven.gravity}m/s².`}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {modalSimFinished ? (
                        <button
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            setModalPhase('victory');
                            if (evaluationResult && evaluationResult.stars >= 2) {
                              triggerFinishCelebration();
                            }
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 animate-pulse cursor-pointer"
                        >
                          <Trophy className="w-4 h-4" />
                          <span>¡VER PUNTUACIÓN DE VICTORIA!</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            sound.playClick();
                            setModalPhase('victory');
                            if (evaluationResult && evaluationResult.stars >= 2) {
                              triggerFinishCelebration();
                            }
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <FastForward className="w-3.5 h-3.5" />
                          <span>Saltar a Puntuación</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Render Simulation Stage */}
                  {challengeType === 'mruv' ? (
                    <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                      <Simulation2D
                        params={modalMruvParams}
                        onParamsChange={setModalMruvParams}
                        currentTime={modalMruvTime}
                        onTimeChange={setModalMruvTime}
                        isPlaying={modalMruvPlaying}
                        onTogglePlay={() => {
                          if (modalMruvTime >= modalMruvParams.totalTime) {
                            setModalMruvTime(0);
                            setModalSimFinished(false);
                          }
                          setModalMruvPlaying(!modalMruvPlaying);
                          if (!modalMruvPlaying) sound.playBrumm(0.85);
                        }}
                        onReset={() => {
                          setModalMruvTime(0);
                          setModalMruvPlaying(false);
                          setModalSimFinished(false);
                        }}
                        isArcadeMode={modalMruvArcade}
                        onToggleArcadeMode={() => setModalMruvArcade(!modalMruvArcade)}
                      />
                    </div>
                  ) : (
                    <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                      <ParabolicSimulation2D
                        params={modalParabolicParams}
                        onParamsChange={setModalParabolicParams}
                        onLaunchCompleted={handleParabolicLaunchCompleted}
                      />
                    </div>
                  )}

                  {/* Notification Bar if finished */}
                  {modalSimFinished && (
                    <div className="bg-emerald-950/60 border border-emerald-500/50 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left animate-fade-in">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                        <div>
                          <div className="text-sm font-black text-emerald-300">
                            {challengeType === 'mruv'
                              ? '¡El móvil ha cruzado la meta exitosamente!'
                              : '¡El proyectil ha completado su trayectoria parabólica!'}
                          </div>
                          <div className="text-xs text-slate-300 font-mono">
                            Los datos empíricos ya fueron contrastados con tus predicciones teóricas.
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setModalPhase('victory');
                          if (evaluationResult && evaluationResult.stars >= 2) {
                            triggerFinishCelebration();
                          }
                        }}
                        className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Trophy className="w-4 h-4" />
                        <span>Ver Cuadro de Victoria y Puntuación</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* MODAL DE LA VICTORIA Y PUNTUACIÓN */
                <div className="space-y-6 animate-fade-in">
                  {/* Big Celebratory Header */}
                  <div className="bg-slate-950/90 border-2 border-amber-500/50 rounded-2xl p-6 text-center space-y-3 shadow-[0_0_35px_rgba(245,158,11,0.25)]">
                    {/* Stars */}
                    <div className="inline-flex items-center justify-center gap-3">
                      {[1, 2, 3].map((star) => (
                        <Star
                          key={star}
                          className={`w-12 h-12 transition-all duration-300 ${
                            evaluationResult && star <= evaluationResult.stars
                              ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_16px_rgba(250,204,21,0.9)] scale-110 animate-bounce'
                              : 'text-slate-700'
                          }`}
                        />
                      ))}
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-black text-white">
                      {evaluationResult?.stars === 3 && '¡EXCELENCIA FÍSICA! 🎯 3 ESTRELLAS'}
                      {evaluationResult?.stars === 2 && '¡MUY BUEN CÁLCULO! ⭐⭐ 2 ESTRELLAS'}
                      {evaluationResult?.stars === 1 && 'ACEPTABLE - PEQUEÑO AJUSTE ⭐ 1 ESTRELLA'}
                      {evaluationResult?.stars === 0 && 'REVISA TUS FÓRMULAS ⚠️ 0 ESTRELLAS'}
                    </h3>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold">
                        Puntuación: +{evaluationResult ? Math.round(evaluationResult.globalAccuracy * 10) : 1000} Pts
                      </span>
                      <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold">
                        Precisión Global: {evaluationResult?.globalAccuracy.toFixed(1)}%
                      </span>
                      {evaluationResult && evaluationResult.globalAccuracy >= 85 && (
                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold">
                          ✓ Rango del 85-90%+ Alcanzado
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400 max-w-xl mx-auto">
                      {evaluationResult?.stars === 3
                        ? '¡Excelente cálculo científico! Todos los datos predichos coinciden con los resultados empíricos del simulador dentro del margen de excelencia exigido.'
                        : 'Revisa en la siguiente tabla la contrastación entre tus predicciones y los valores arrojados por el simulador para perfeccionar tus deducciones.'}
                    </p>
                  </div>

                  {/* Audit Comparison Table */}
                  {evaluationResult && (
                    <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-4 overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                            <th className="py-2 px-3">VARIABLE FÍSICA</th>
                            <th className="py-2 px-3">TU PREDICCIÓN</th>
                            <th className="py-2 px-3">VALOR REAL SIMULADO</th>
                            <th className="py-2 px-3">PRECISIÓN</th>
                            <th className="py-2 px-3">ESTADO</th>
                            <th className="py-2 px-3">DEDUCCIÓN / FÓRMULA</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-850">
                          {evaluationResult.items.map((it, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                              <td className="py-3 px-3 font-bold text-slate-200">
                                {it.label} ({it.symbol})
                              </td>
                              <td className="py-3 px-3 text-amber-400 font-bold">
                                {it.userVal} {it.unit}
                              </td>
                              <td className="py-3 px-3 text-emerald-400 font-bold">
                                {it.realVal.toFixed(2)} {it.unit}
                              </td>
                              <td className="py-3 px-3 font-bold">
                                <span className={it.accuracy >= 85 ? 'text-emerald-400' : it.accuracy >= 60 ? 'text-amber-400' : 'text-rose-400'}>
                                  {it.accuracy.toFixed(1)}%
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                {it.isAccepted ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-bold">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>¡Acertado!</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-rose-400 text-[11px] font-bold">
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Desviado</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-slate-400 text-[11px]">
                                {it.formula}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Actions in Victory Modal */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setModalPhase('simulation');
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold font-mono flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Ver Simulación Nuevamente</span>
                    </button>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => {
                          handleRandomize();
                          setIsExperimentModalOpen(false);
                        }}
                        className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-750 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Intentar Otro Problema</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setIsExperimentModalOpen(false);
                        }}
                        className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Cerrar Modal</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* On-page summary card retained for reference */}
      {hasEvaluated && evaluationResult && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-850">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    className={`w-5 h-5 ${
                      s <= evaluationResult.stars ? 'text-yellow-400 fill-yellow-400' : 'text-slate-700'
                    }`}
                  />
                ))}
              </div>
              <span className="font-bold text-white text-sm">
                Última Evaluación: {evaluationResult.globalAccuracy.toFixed(1)}% de Precisión
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setModalPhase('victory');
                setIsExperimentModalOpen(true);
              }}
              className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir Modal Completo</span>
            </button>
          </div>

          <div className="text-xs text-slate-400">
            Prueba física registrada. Puedes abrir el modal interactivo en cualquier momento para ver la fase de experimentación en vivo o la auditoría de victoria.
          </div>
        </div>
      )}
    </div>
  );
};
