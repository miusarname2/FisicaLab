import React, { useState, useEffect, useRef } from 'react';
import { PhysicsParams, ViewMode } from './types/physics';
import { ParabolicParams, ParabolicResults } from './types/parabolic';
import { PRESETS, getPhysicsAtTime } from './utils/physics';
import { DEFAULT_PARABOLIC_PARAMS, calculateParabolicResults } from './utils/parabolic';
import { Header } from './components/Header';
import { WelcomeModal } from './components/WelcomeModal';
import { VictoryModal } from './components/VictoryModal';
import { IntroCredits } from './components/IntroCredits';
import { Simulation2D } from './components/Simulation2D';
import { Simulation3D } from './components/Simulation3D';
import { ChartsD3 } from './components/ChartsD3';
import { VectorVisualizer } from './components/VectorVisualizer';
import { ControlDeck } from './components/ControlDeck';

// Parabolic Experiment Components
import { ParabolicSimulation2D } from './components/ParabolicSimulation2D';
import { ParabolicSimulation3D } from './components/ParabolicSimulation3D';
import { ParabolicControlDeck } from './components/ParabolicControlDeck';
import { ParabolicChartsD3 } from './components/ParabolicChartsD3';
import { ParabolicEquations } from './components/ParabolicEquations';
import { ParabolicResultsModal } from './components/ParabolicResultsModal';
import { ChallengeMode } from './components/ChallengeMode';

import { triggerFinishCelebration } from './utils/confetti';
import { sound } from './utils/audio';
import { 
  ArrowRight, ArrowLeft, Target, Sparkles, 
  Car, Layers, Box, Trophy, BookOpen, ChevronDown, Award
} from 'lucide-react';

export default function App() {
  const defaultPreset = PRESETS[0];

  // Active Experiment Tab: 'mruv' | 'parabolic' | 'challenge'
  const [activeExperiment, setActiveExperiment] = useState<'mruv' | 'parabolic' | 'challenge'>('mruv');

  // MRUV State
  const [params, setParams] = useState<PhysicsParams>(defaultPreset.params);
  const [viewMode, setViewMode] = useState<ViewMode>('2D');
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [isVictoryOpen, setIsVictoryOpen] = useState(false);
  const [showIntroCredits, setShowIntroCredits] = useState(true);
  const [isArcadeMode, setIsArcadeMode] = useState(true);
  
  // MRUV Animation state
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const chartsRef = useRef<HTMLDivElement>(null);
  const parabolicChartsRef = useRef<HTMLDivElement>(null);
  const hasTriggeredGoal = useRef(false);

  // Parabolic State
  const [parabolicParams, setParabolicParams] = useState<ParabolicParams>(DEFAULT_PARABOLIC_PARAMS);
  const [isParabolicResultsOpen, setIsParabolicResultsOpen] = useState(false);
  const [latestParabolicResults, setLatestParabolicResults] = useState<ParabolicResults>(
    calculateParabolicResults(DEFAULT_PARABOLIC_PARAMS)
  );

  // Goal Crossing Check (MRUV)
  useEffect(() => {
    const isAtGoal = currentTime >= params.totalTime - 0.005;

    if (isAtGoal && !hasTriggeredGoal.current) {
      hasTriggeredGoal.current = true;
      setIsPlaying(false);
      sound.stopCarEngine();

      triggerFinishCelebration();

      const timer = setTimeout(() => {
        setIsVictoryOpen(true);
      }, 700);

      return () => clearTimeout(timer);
    } else if (currentTime < params.totalTime - 0.05) {
      hasTriggeredGoal.current = false;
    }
  }, [currentTime, params.totalTime]);

  // Main animation loop (MRUV)
  useEffect(() => {
    if (!isPlaying) return;

    let lastTimestamp: number | null = null;
    let animId: number;

    const tick = (timestamp: number) => {
      if (lastTimestamp === null) {
        lastTimestamp = timestamp;
      }
      const deltaSec = ((timestamp - lastTimestamp) / 1000) * playbackSpeed;
      lastTimestamp = timestamp;

      setCurrentTime((prev) => {
        const next = prev + deltaSec;
        if (next >= params.totalTime) {
          setIsPlaying(false);
          sound.stopCarEngine();
          return params.totalTime;
        }
        return next;
      });

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, params.totalTime, playbackSpeed]);

  // Handle Play/Pause MRUV
  const handleTogglePlay = () => {
    if (currentTime >= params.totalTime) {
      setCurrentTime(0);
      hasTriggeredGoal.current = false;
      setIsVictoryOpen(false);
      setIsPlaying(true);
    } else {
      if (isPlaying) {
        sound.stopCarEngine();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle Reset MRUV
  const handleReset = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    hasTriggeredGoal.current = false;
    setIsVictoryOpen(false);
    sound.stopCarEngine();
  };

  // Scroll to Charts smoothly
  const handleScrollToCharts = () => {
    chartsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScrollToParabolicCharts = () => {
    parabolicChartsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSwitchToParabolic = () => {
    sound.playClick();
    setActiveExperiment('parabolic');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const finalPhysics = getPhysicsAtTime(params, params.totalTime);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Scroll-Driven Academic Intro Credits (UCC - Oscar M Alvarez G - Física) */}
      {showIntroCredits && (
        <IntroCredits 
          onComplete={() => {
            setShowIntroCredits(false);
            setIsWelcomeOpen(true);
          }} 
        />
      )}

      {/* Top Header */}
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenConfig={() => setIsWelcomeOpen(true)}
        onReset={handleReset}
        isArcadeMode={isArcadeMode}
        onToggleArcadeMode={() => setIsArcadeMode(!isArcadeMode)}
        onShowCredits={() => setShowIntroCredits(true)}
        activeExperiment={activeExperiment}
        onExperimentChange={(exp) => {
          setActiveExperiment(exp);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* =========================================================================
            EXPERIMENTO 1: CINEMÁTICA Y DINÁMICA MRUV (CARRERA DEL MÓVIL)
           ========================================================================= */}
        {activeExperiment === 'mruv' && (
          <div className="space-y-8 animate-fade-in">
            {/* Simulation Stage (2D or 3D) */}
            <section aria-label="Escena de Simulación Cinemática">
              {viewMode === '2D' ? (
                <Simulation2D
                  params={params}
                  onParamsChange={(newP) => {
                    setParams(newP);
                    if (currentTime > newP.totalTime) setCurrentTime(newP.totalTime);
                  }}
                  currentTime={currentTime}
                  onTimeChange={(t) => {
                    setIsPlaying(false);
                    setCurrentTime(t);
                  }}
                  isPlaying={isPlaying}
                  onTogglePlay={handleTogglePlay}
                  onReset={handleReset}
                  isArcadeMode={isArcadeMode}
                  onToggleArcadeMode={() => setIsArcadeMode(!isArcadeMode)}
                />
              ) : (
                <Simulation3D
                  params={params}
                  currentTime={currentTime}
                  onTimeChange={(t) => {
                    setIsPlaying(false);
                    setCurrentTime(t);
                  }}
                  isPlaying={isPlaying}
                  onTogglePlay={handleTogglePlay}
                  onReset={handleReset}
                  onScrollToCharts={handleScrollToCharts}
                  isArcadeMode={isArcadeMode}
                  onToggleArcadeMode={() => setIsArcadeMode(!isArcadeMode)}
                />
              )}
            </section>

            {/* Dynamic Parameter Adjustment Deck */}
            <section aria-label="Variables Físicas">
              <ControlDeck
                params={params}
                onParamsChange={(newP) => {
                  setParams(newP);
                  if (currentTime > newP.totalTime) setCurrentTime(newP.totalTime);
                }}
              />
            </section>

            {/* D3.js Interactive Charts */}
            <section ref={chartsRef} aria-label="Gráficas Cinemáticas D3.js">
              <ChartsD3
                params={params}
                currentTime={currentTime}
                onTimeChange={(t) => {
                  setIsPlaying(false);
                  setCurrentTime(t);
                }}
              />
            </section>

            {/* Vector Laboratory & Free Body Diagram */}
            <section aria-label="Laboratorio de Vectores">
              <VectorVisualizer
                params={params}
                currentTime={currentTime}
              />
            </section>

            {/* Prominent Call-to-Action to Experiment 2 (Directly below Equilibrium Section as requested) */}
            <section aria-label="Navegación al Siguiente Experimento" className="pt-2">
              <div className="bg-gradient-to-r from-orange-950/40 via-slate-900 to-amber-950/40 border-2 border-orange-500/50 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-[0_0_35px_rgba(249,115,22,0.18)]">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-950/80 border border-orange-500/40 text-orange-400 text-xs font-mono font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>SIGUIENTE EXPERIMENTO DISPONIBLE</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-white">
                  ¿Listo para el siguiente experimento de Física?
                </h3>

                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
                  Pasa ahora al <strong>Experimento de Tiro Parabólico & Balística</strong>. Dispara con el <strong>tanque artillero</strong> personalizado, apunta en modo <em>Angry Birds</em> con pelota de ping pong, ajusta masa, ángulo de elevación, gravedad ambiental y encesta en la diana.
                </p>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSwitchToParabolic}
                    className="px-8 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-3 mx-auto shadow-[0_0_30px_rgba(249,115,22,0.4)] transition-all cursor-pointer hover:scale-105 active:scale-95"
                  >
                    <Target className="w-5 h-5 text-slate-950" />
                    <span>👉 Siguiente Experimento: Tiro Parabólico</span>
                    <ArrowRight className="w-5 h-5 animate-pulse" />
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* =========================================================================
            EXPERIMENTO 2: TIRO PARABÓLICO & BALÍSTICA (TANQUE & PING PONG)
           ========================================================================= */}
        {activeExperiment === 'parabolic' && (
          <div className="space-y-8 animate-fade-in">
            {/* Top Navigation Back to MRUV */}
            <div className="flex items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setActiveExperiment('mruv');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-cyan-400" />
                <span>Volver a Experimento 1: MRUV & Cinemática Lineal</span>
              </button>

              <div className="text-xs font-mono text-orange-400 font-bold hidden sm:block">
                Experimento 2 de 2: Balística Parabólica
              </div>
            </div>

            {/* Parabolic Simulation Arena (2D or 3D) */}
            <section aria-label="Escena de Simulación Tiro Parabólico">
              {viewMode === '2D' ? (
                <ParabolicSimulation2D
                  params={parabolicParams}
                  onParamsChange={setParabolicParams}
                  onLaunchCompleted={(res) => {
                    setLatestParabolicResults(res);
                    const timer = setTimeout(() => {
                      setIsParabolicResultsOpen(true);
                    }, 650);
                    return () => clearTimeout(timer);
                  }}
                />
              ) : (
                <ParabolicSimulation3D
                  params={parabolicParams}
                  onParamsChange={setParabolicParams}
                  onLaunchCompleted={(res) => {
                    setLatestParabolicResults(res);
                    const timer = setTimeout(() => {
                      setIsParabolicResultsOpen(true);
                    }, 650);
                    return () => clearTimeout(timer);
                  }}
                />
              )}
            </section>

            {/* Parabolic Controls Deck */}
            <section aria-label="Parámetros de Tiro Parabólico">
              <ParabolicControlDeck
                params={parabolicParams}
                onParamsChange={setParabolicParams}
              />
            </section>

            {/* Parabolic D3.js Charts */}
            <section ref={parabolicChartsRef} aria-label="Gráficas D3 de Tiro Parabólico">
              <ParabolicChartsD3
                params={parabolicParams}
                currentTime={0}
                onTimeChange={() => {}}
              />
            </section>

            {/* Parabolic Mathematical Model & Equations */}
            <section aria-label="Ecuaciones y Demostración">
              <ParabolicEquations params={parabolicParams} />
            </section>

            {/* Call-to-action to Experiment 3: Challenge Mode */}
            <section aria-label="Navegación a Inténtalo Tú Mismo" className="pt-2">
              <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-orange-950/40 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-[0_0_35px_rgba(245,158,11,0.18)]">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-400 text-xs font-mono font-bold">
                  <Award className="w-3.5 h-3.5" />
                  <span>TERCER ESCENARIO DISPONIBLE</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-white">
                  ¿Quieres comprobar tus propios cálculos?
                </h3>

                <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
                  Pasa al escenario <strong>¡Inténtalo Tú Mismo!</strong>. Elige entre el Carrito o el Tanque, ingresa tus predicciones teóricas escritas a mano, y el simulador verificará tus cálculos otorgándote hasta <strong>3 Estrellas de Excelencia</strong> si alcanzas entre 85% y 90% de precisión.
                </p>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setActiveExperiment('challenge');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-3 mx-auto shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all cursor-pointer hover:scale-105 active:scale-95"
                  >
                    <Award className="w-5 h-5 text-slate-950" />
                    <span>👉 Ir a Exp 3: ¡Inténtalo Tú Mismo!</span>
                    <ArrowRight className="w-5 h-5 animate-pulse" />
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* =========================================================================
            EXPERIMENTO 3: ¡INTÉNTALO TÚ MISMO! (EVALUACIÓN Y VERIFICACIÓN)
           ========================================================================= */}
        {activeExperiment === 'challenge' && (
          <div className="space-y-8 animate-fade-in">
            {/* Top Navigation */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setActiveExperiment('mruv');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  <Car className="w-4 h-4 text-cyan-400" />
                  <span>Exp 1: MRUV</span>
                </button>

                <span className="text-slate-700">|</span>

                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setActiveExperiment('parabolic');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-orange-400 transition-colors cursor-pointer"
                >
                  <Target className="w-4 h-4 text-orange-400" />
                  <span>Exp 2: Parabólico</span>
                </button>
              </div>

              <div className="text-xs font-mono text-amber-400 font-bold">
                Experimento 3: Evaluación de Predicciones Físicas (85-90% Precisión)
              </div>
            </div>

            {/* Challenge Mode Main Component */}
            <ChallengeMode />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">FísicaLab</span>
            <span aria-hidden="true">·</span>
            <span>Universidad Cooperativa de Colombia (UCC)</span>
            <span aria-hidden="true">·</span>
            <span>Oscar M Alvarez G</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Materia: Física Mecánica</span>
            <span>MRUV & Tiro Parabólico</span>
            <button 
              type="button" 
              onClick={() => setShowIntroCredits(true)}
              className="text-cyan-400 hover:underline cursor-pointer"
            >
              Ver Créditos
            </button>
          </div>
        </div>
      </footer>

      {/* Welcome & Configuration Modal (MRUV) */}
      <WelcomeModal
        isOpen={isWelcomeOpen}
        onClose={() => setIsWelcomeOpen(false)}
        params={params}
        currentMode={viewMode}
        onConfirm={(newParams, newMode) => {
          setParams(newParams);
          setViewMode(newMode);
          handleReset();
        }}
      />

      {/* Video Game Victory Scoreboard Modal (MRUV) */}
      <VictoryModal
        isOpen={isVictoryOpen}
        onClose={() => setIsVictoryOpen(false)}
        params={params}
        finalPhysics={finalPhysics}
        onRestart={handleReset}
        onOpenConfig={() => setIsWelcomeOpen(true)}
        onViewCharts={handleScrollToCharts}
        onNextExperiment={handleSwitchToParabolic}
      />

      {/* Video Game Results Modal (Tiro Parabólico) */}
      <ParabolicResultsModal
        isOpen={isParabolicResultsOpen}
        onClose={() => setIsParabolicResultsOpen(false)}
        params={parabolicParams}
        results={latestParabolicResults}
        onRestart={() => {
          setIsParabolicResultsOpen(false);
        }}
        onViewCharts={handleScrollToParabolicCharts}
      />
    </div>
  );
}
