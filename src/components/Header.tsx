import React, { useState } from 'react';
import { ViewMode } from '../types/physics';
import { sound } from '../utils/audio';
import { 
  Sliders, RotateCcw, Box, Layers, Volume2, VolumeX, 
  Gamepad2, GraduationCap, Sparkles, Music, Music2,
  Target, Car, Award
} from 'lucide-react';

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenConfig: () => void;
  onReset: () => void;
  isArcadeMode: boolean;
  onToggleArcadeMode: () => void;
  onShowCredits: () => void;
  activeExperiment: 'mruv' | 'parabolic' | 'challenge';
  onExperimentChange: (exp: 'mruv' | 'parabolic' | 'challenge') => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onViewModeChange,
  onOpenConfig,
  onReset,
  isArcadeMode,
  onToggleArcadeMode,
  onShowCredits,
  activeExperiment,
  onExperimentChange,
}) => {
  const [isAudioEnabled, setIsAudioEnabled] = useState(sound.enabled);
  const [isMusicPlaying, setIsMusicPlaying] = useState(sound.musicEnabled);

  const toggleAudio = () => {
    sound.enabled = !isAudioEnabled;
    setIsAudioEnabled(!isAudioEnabled);
    if (!isAudioEnabled) sound.playClick();
  };

  const toggleMusic = () => {
    const active = sound.toggleMusic();
    setIsMusicPlaying(active);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onShowCredits}
            title="Ver Créditos Académicos (UCC - Oscar M Alvarez G)"
            className="text-lg font-extrabold tracking-tight text-white flex items-center gap-2 hover:text-cyan-400 transition-colors"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            FísicaLab
          </button>
          
          <button
            type="button"
            onClick={onShowCredits}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-300 hover:border-cyan-500/50 transition-all"
            title="Ver carátula y créditos de presentación"
          >
            <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
            <span>UCC · Oscar M Alvarez G</span>
          </button>
        </div>

        {/* Zone 2: Mode Toggle & Navigation */}
        <div className="flex items-center gap-2">
          {/* Experiment Switcher (MRUV Móvil vs Tiro Parabólico Tanque) */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onExperimentChange('mruv');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeExperiment === 'mruv'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Exp 1: MRUV</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onExperimentChange('parabolic');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeExperiment === 'parabolic'
                  ? 'bg-orange-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Exp 2: Parabólico</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onExperimentChange('challenge');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeExperiment === 'challenge'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="¡Inténtalo tú mismo! Comprueba tus cálculos frente al simulador"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Exp 3: ¡Inténtalo!</span>
            </button>
          </div>

          {/* 2D vs 3D */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onViewModeChange('2D');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                viewMode === '2D'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2D</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onViewModeChange('3D');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                viewMode === '3D'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D</span>
            </button>
          </div>

          {/* Arcade / Game mode toggle */}
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onToggleArcadeMode();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all whitespace-nowrap ${
              isArcadeMode 
                ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.2)]' 
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title="Alternar entre modo juego arcade y modo científico tradicional"
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{isArcadeMode ? 'Modo Juego' : 'Modo Lab'}</span>
          </button>
        </div>

        {/* Zone 3: Primary actions & Audio & Music */}
        <div className="flex items-center gap-2">
          {/* Background Music Toggle */}
          <button
            type="button"
            onClick={toggleMusic}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all ${
              isMusicPlaying
                ? 'bg-indigo-950/80 text-indigo-300 border-indigo-500/60 shadow-[0_0_12px_rgba(99,102,241,0.3)] animate-pulse'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title={isMusicPlaying ? 'Pausar Música de Fondo' : 'Reproducir Música Arcade de Fondo'}
          >
            <Music className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden lg:inline">{isMusicPlaying ? 'Música: ON' : 'Música'}</span>
          </button>

          {/* SFX Sound Toggle */}
          <button
            type="button"
            onClick={toggleAudio}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title={isAudioEnabled ? 'Silenciar Efectos de Sonido' : 'Activar Sonido'}
          >
            {isAudioEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onReset();
            }}
            title="Reiniciar móvil al tiempo 0 s"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Reiniciar</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onOpenConfig();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-sm whitespace-nowrap"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Configurar (m, d, t)</span>
          </button>
        </div>
      </div>
    </header>
  );
};
