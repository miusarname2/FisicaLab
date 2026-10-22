import React, { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, BookOpen, User, Sparkles, ChevronDown, 
  ArrowRight, Play, Rocket, ShieldCheck 
} from 'lucide-react';
import { sound } from '../utils/audio';

interface IntroCreditsProps {
  onComplete: () => void;
}

export const IntroCredits: React.FC<IntroCreditsProps> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Track scroll inside the credits container
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const maxScroll = target.scrollHeight - target.clientHeight;
    if (maxScroll <= 0) return;
    const progress = Math.min(1, Math.max(0, target.scrollTop / maxScroll));
    setScrollProgress(progress);

    if (progress >= 0.98) {
      // Near bottom
    }
  };

  const handleEnterApp = () => {
    sound.playClick();
    onComplete();
  };

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="fixed inset-0 z-50 bg-[#050811] text-white overflow-y-auto overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200"
    >
      {/* Background Starfield / Particle Glow */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: 'radial-gradient(#38bdf8 1.5px, transparent 1.5px), radial-gradient(#818cf8 1px, transparent 1px)',
            backgroundSize: '48px 48px, 24px 24px',
            backgroundPosition: '0 0, 24px 24px'
          }}
        />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px]" />
      </div>

      {/* Persistent Top Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between backdrop-blur-md bg-slate-950/60 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-cyan-400">
            Presentación Académica · UCC
          </span>
        </div>

        <button
          type="button"
          onClick={handleEnterApp}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-all shadow-lg shadow-cyan-500/20 active:scale-95"
        >
          <span>Ir directo al Simulador</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Scroll indicator bar on right */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 hidden md:flex flex-col items-center gap-3 z-40">
        <span className="text-[10px] font-mono text-slate-500 rotate-90 mb-4 tracking-wider uppercase">
          Scroll
        </span>
        <div className="w-1.5 h-36 bg-slate-800 rounded-full overflow-hidden p-0.5">
          <div 
            className="w-full bg-gradient-to-b from-cyan-400 to-indigo-500 rounded-full transition-all duration-150"
            style={{ height: `${Math.max(8, scrollProgress * 100)}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-cyan-400 tabular-nums">
          {Math.round(scrollProgress * 100)}%
        </span>
      </div>

      {/* SCROLLABLE SECTIONS: 4 Cinematic acts */}
      <div className="w-full max-w-4xl mx-auto px-6 pt-24 pb-32 space-y-48">
        {/* ACT 1: Universidad Cooperativa de Colombia (UCC) */}
        <section className="min-h-[75vh] flex flex-col justify-center items-center text-center relative">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs font-medium text-cyan-300 mb-6 shadow-xl backdrop-blur">
            <GraduationCap className="w-4 h-4 text-cyan-400" />
            <span>Institución de Educación Superior</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white mb-4 leading-tight">
            Universidad Cooperativa <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
              de Colombia
            </span>
          </h1>

          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-300 mb-6 tracking-wide">
            ( UCC )
          </div>

          <p className="max-w-xl text-slate-400 text-sm sm:text-base leading-relaxed mb-8">
            Facultad de Ingeniería · Proyecto Académico de Investigación & Simulación Interactiva
          </p>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 animate-bounce">
            <ChevronDown className="w-4 h-4 text-cyan-400" />
            <span>Desliza para continuar los créditos</span>
          </div>
        </section>

        {/* ACT 2: Materia: Física */}
        <section className="min-h-[75vh] flex flex-col justify-center items-center text-center relative">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs font-medium text-amber-300 mb-6 shadow-xl backdrop-blur">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Asignatura Académica</span>
          </div>

          <div className="text-sm font-mono uppercase tracking-widest text-slate-400 mb-2">
            Materia
          </div>

          <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-white mb-6">
            Física
            <span className="text-amber-400 ml-2">Mecánica</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full text-left font-mono text-xs">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur">
              <div className="text-slate-400 text-[11px] mb-1">Eje Temático 1</div>
              <div className="font-bold text-white text-sm">Cinemática MRUV</div>
              <div className="text-slate-400 text-[10px] mt-1 font-mono">x(t) · v(t) · a(t)</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur">
              <div className="text-slate-400 text-[11px] mb-1">Eje Temático 2</div>
              <div className="font-bold text-white text-sm">2ª Ley de Newton</div>
              <div className="text-slate-400 text-[10px] mt-1 font-mono">Σ F⃗ = m · a⃗</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur">
              <div className="text-slate-400 text-[11px] mb-1">Eje Temático 3</div>
              <div className="font-bold text-white text-sm">Dinámica & Energía</div>
              <div className="text-slate-400 text-[10px] mt-1 font-mono">W = F · d · Ek = ½mv²</div>
            </div>
          </div>
        </section>

        {/* ACT 3: Creador: Oscar M Alvarez G */}
        <section className="min-h-[75vh] flex flex-col justify-center items-center text-center relative">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs font-medium text-emerald-300 mb-6 shadow-xl backdrop-blur">
            <User className="w-4 h-4 text-emerald-400" />
            <span>Autor & Desarrollador</span>
          </div>

          <div className="text-sm font-mono uppercase tracking-widest text-slate-400 mb-2">
            Creado y Presentado por
          </div>

          <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-white mb-4">
            Oscar M Alvarez G
          </h2>

          <div className="inline-block px-4 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-mono text-sm mb-6">
            Estudiante de Ingeniería · UCC
          </div>

          <p className="max-w-md text-slate-400 text-sm leading-relaxed mb-8">
            Desarrollo de entorno interactivo 2D, 2.5D y 3D con cálculos analíticos en tiempo real, gráficas dinámicas D3.js y gamificación para experimentación física.
          </p>

          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 max-w-lg w-full text-center space-y-4 shadow-2xl">
            <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
              ¡Todo listo para la sustentación!
            </div>
            <button
              type="button"
              onClick={handleEnterApp}
              className="w-full flex items-center justify-center gap-3 px-8 py-4 text-base font-extrabold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-2xl transition-all shadow-xl shadow-cyan-500/25 active:scale-95"
            >
              <Rocket className="w-5 h-5 fill-current" />
              <span>Entrar al Laboratorio & Iniciar Simulador</span>
            </button>
            <div className="text-[11px] text-slate-500 font-mono">
              Presiona para abrir la interfaz con modo científico y modo juego arcade
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
