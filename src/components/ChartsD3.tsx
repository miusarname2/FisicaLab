import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { PhysicsParams, PhysicsInstant } from '../types/physics';
import { generateGraphData, getPhysicsAtTime } from '../utils/physics';
import { Activity, Gauge, Zap, TrendingUp, HelpCircle, MoveHorizontal } from 'lucide-react';

interface ChartsD3Props {
  params: PhysicsParams;
  currentTime: number;
  onTimeChange: (time: number) => void;
}

type ChartType = 'all' | 'velocity' | 'acceleration' | 'force' | 'position';

export const ChartsD3: React.FC<ChartsD3Props> = ({
  params,
  currentTime,
  onTimeChange,
}) => {
  const [selectedChart, setSelectedChart] = useState<ChartType>('all');
  const currentPhysics = getPhysicsAtTime(params, currentTime);

  // Generate data points
  const data = useMemo(() => generateGraphData(params, 80), [params]);

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>Gráficas Cinemáticas y Dinámicas en Función del Tiempo</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Arrastra la línea vertical sobre cualquier gráfica para modificar el tiempo y mover el móvil en sincronía.
          </p>
        </div>

        {/* Chart View Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedChart('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              selectedChart === 'all'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Ver Todas (2x2)
          </button>
          <button
            type="button"
            onClick={() => setSelectedChart('velocity')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              selectedChart === 'velocity'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Velocidad v(t)
          </button>
          <button
            type="button"
            onClick={() => setSelectedChart('acceleration')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              selectedChart === 'acceleration'
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Aceleración a(t)
          </button>
          <button
            type="button"
            onClick={() => setSelectedChart('force')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              selectedChart === 'force'
                ? 'bg-purple-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Fuerza F(t)
          </button>
          <button
            type="button"
            onClick={() => setSelectedChart('position')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              selectedChart === 'position'
                ? 'bg-blue-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Posición x(t)
          </button>
        </div>
      </div>

      {/* Grid of Charts */}
      <div className={`grid gap-5 ${
        selectedChart === 'all' 
          ? 'grid-cols-1 lg:grid-cols-2' 
          : 'grid-cols-1'
      }`}>
        {/* 1. Velocity vs Time */}
        {(selectedChart === 'all' || selectedChart === 'velocity') && (
          <SingleD3Chart
            title="Velocidad vs Tiempo: v(t) = a · t"
            subtitle="Comportamiento lineal: la pendiente representa la aceleración constante"
            data={data}
            xKey="time"
            yKey="velocity"
            currentT={currentTime}
            currentY={currentPhysics.velocity}
            xDomain={[0, params.totalTime]}
            yLabel="Velocidad (m/s)"
            xLabel="Tiempo (s)"
            strokeColor="#10b981"
            fillGradientId="grad-velocity"
            accentColorClass="text-emerald-400"
            unit="m/s"
            formula={`v = ${currentPhysics.acceleration.toFixed(2)} · t = ${currentPhysics.velocity.toFixed(2)} m/s`}
            onTimeChange={onTimeChange}
            height={selectedChart === 'all' ? 240 : 360}
          />
        )}

        {/* 2. Acceleration vs Time */}
        {(selectedChart === 'all' || selectedChart === 'acceleration') && (
          <SingleD3Chart
            title="Aceleración vs Tiempo: a(t) = constante"
            subtitle="En el MRUV la aceleración permanece invariable a lo largo del tiempo"
            data={data}
            xKey="time"
            yKey="acceleration"
            currentT={currentTime}
            currentY={currentPhysics.acceleration}
            xDomain={[0, params.totalTime]}
            yLabel="Aceleración (m/s²)"
            xLabel="Tiempo (s)"
            strokeColor="#f59e0b"
            fillGradientId="grad-acceleration"
            accentColorClass="text-amber-400"
            unit="m/s²"
            formula={`a = 2d / t² = ${currentPhysics.acceleration.toFixed(2)} m/s²`}
            onTimeChange={onTimeChange}
            height={selectedChart === 'all' ? 240 : 360}
          />
        )}

        {/* 3. Force vs Time */}
        {(selectedChart === 'all' || selectedChart === 'force') && (
          <SingleD3Chart
            title="Fuerza vs Tiempo: F(t) = m · a"
            subtitle="2ª Ley de Newton: la fuerza resultante es proporcional a la masa e inercia"
            data={data}
            xKey="time"
            yKey="force"
            currentT={currentTime}
            currentY={currentPhysics.force}
            xDomain={[0, params.totalTime]}
            yLabel="Fuerza Neta (N)"
            xLabel="Tiempo (s)"
            strokeColor="#c084fc"
            fillGradientId="grad-force"
            accentColorClass="text-purple-400"
            unit="N"
            formula={`F = ${params.mass} kg · ${currentPhysics.acceleration.toFixed(2)} m/s² = ${currentPhysics.force.toFixed(2)} N`}
            onTimeChange={onTimeChange}
            height={selectedChart === 'all' ? 240 : 360}
          />
        )}

        {/* 4. Position vs Time */}
        {(selectedChart === 'all' || selectedChart === 'position') && (
          <SingleD3Chart
            title="Posición vs Tiempo: x(t) = ½ · a · t²"
            subtitle="Curva parabólica cuadrática que refleja el desplazamiento acumulativo"
            data={data}
            xKey="time"
            yKey="position"
            currentT={currentTime}
            currentY={currentPhysics.position}
            xDomain={[0, params.totalTime]}
            yLabel="Posición (m)"
            xLabel="Tiempo (s)"
            strokeColor="#38bdf8"
            fillGradientId="grad-position"
            accentColorClass="text-blue-400"
            unit="m"
            formula={`x = ½ · ${currentPhysics.acceleration.toFixed(2)} · (${currentTime.toFixed(2)})² = ${currentPhysics.position.toFixed(2)} m`}
            onTimeChange={onTimeChange}
            height={selectedChart === 'all' ? 240 : 360}
          />
        )}
      </div>
    </div>
  );
};

interface SingleD3ChartProps {
  title: string;
  subtitle: string;
  data: PhysicsInstant[];
  xKey: keyof PhysicsInstant;
  yKey: keyof PhysicsInstant;
  currentT: number;
  currentY: number;
  xDomain: [number, number];
  yLabel: string;
  xLabel: string;
  strokeColor: string;
  fillGradientId: string;
  accentColorClass: string;
  unit: string;
  formula: string;
  onTimeChange: (time: number) => void;
  height: number;
}

const SingleD3Chart: React.FC<SingleD3ChartProps> = ({
  title,
  subtitle,
  data,
  yKey,
  currentT,
  currentY,
  xDomain,
  yLabel,
  xLabel,
  strokeColor,
  fillGradientId,
  accentColorClass,
  unit,
  formula,
  onTimeChange,
  height,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Compute maximum Y for pleasant scaling
  const maxY = Math.max(0.1, d3.max(data, d => d[yKey] as number) || 1);
  const yDomain: [number, number] = [0, maxY * 1.15];

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsScrubbing(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    handlePointerMove(e);
  };

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isScrubbing && e.buttons !== 1) return;
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const margin = { left: 55, right: 25 };
    const chartW = rect.width - margin.left - margin.right;
    if (chartW <= 0) return;

    const mouseX = e.clientX - rect.left - margin.left;
    const clampedProgress = Math.max(0, Math.min(1, mouseX / chartW));
    const targetTime = clampedProgress * xDomain[1];
    onTimeChange(targetTime);
  }, [isScrubbing, xDomain, onTimeChange]);

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsScrubbing(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // safe
    }
  };

  // Render D3 Path and Axes
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const margin = { top: 20, right: 25, bottom: 35, left: 55 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (innerWidth <= 0 || innerHeight <= 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Scales
    const xScale = d3.scaleLinear().domain(xDomain).range([0, innerWidth]);
    const yScale = d3.scaleLinear().domain(yDomain).range([innerHeight, 0]);

    // Gradient definitions
    const defs = svg.append('defs');
    const gradient = defs
      .append('linearGradient')
      .attr('id', fillGradientId)
      .attr('x1', '0')
      .attr('y1', '0')
      .attr('x2', '0')
      .attr('y2', '1');

    gradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', strokeColor)
      .attr('stop-opacity', 0.35);

    gradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', strokeColor)
      .attr('stop-opacity', 0.0);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(
        d3
          .axisLeft(yScale)
          .ticks(5)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      )
      .select('.domain')
      .remove();

    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${innerHeight})`)
      .attr('opacity', 0.1)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(6)
          .tickSize(-innerHeight)
          .tickFormat(() => '')
      )
      .select('.domain')
      .remove();

    // Area Generator
    const areaGen = d3
      .area<PhysicsInstant>()
      .x(d => xScale(d.time))
      .y0(innerHeight)
      .y1(d => yScale(d[yKey] as number))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', `url(#${fillGradientId})`)
      .attr('d', areaGen);

    // Line Generator
    const lineGen = d3
      .line<PhysicsInstant>()
      .x(d => xScale(d.time))
      .y(d => yScale(d[yKey] as number))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', strokeColor)
      .attr('stroke-width', 2.5)
      .attr('d', lineGen);

    // X Axis
    const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(d => `${d}s`);
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .attr('color', '#64748b')
      .selectAll('text')
      .attr('font-size', '10px')
      .attr('font-family', 'JetBrains Mono');

    // Y Axis
    const yAxis = d3.axisLeft(yScale).ticks(4);
    g.append('g')
      .call(yAxis)
      .attr('color', '#64748b')
      .selectAll('text')
      .attr('font-size', '10px')
      .attr('font-family', 'JetBrains Mono');

    // Interactive Vertical Scrubber Line
    const curX = xScale(currentT);
    const scrubber = g.append('g').attr('class', 'scrubber');

    // Vertical line
    scrubber
      .append('line')
      .attr('x1', curX)
      .attr('x2', curX)
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '3 3');

    // Current Value Dot on curve
    const curYClamped = yScale(currentY);
    scrubber
      .append('circle')
      .attr('cx', curX)
      .attr('cy', curYClamped)
      .attr('r', 6)
      .attr('fill', strokeColor)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    // Scrubber drag top handle
    scrubber
      .append('rect')
      .attr('x', curX - 16)
      .attr('y', -10)
      .attr('width', 32)
      .attr('height', 14)
      .attr('rx', 4)
      .attr('fill', '#0284c7');

    scrubber
      .append('text')
      .attr('x', curX)
      .attr('y', 0)
      .attr('text-anchor', 'middle')
      .attr('fill', '#ffffff')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'JetBrains Mono')
      .text(`${currentT.toFixed(1)}s`);

  }, [data, currentT, currentY, yKey, xDomain, yDomain, height, strokeColor, fillGradientId]);

  return (
    <div 
      ref={containerRef}
      className="bg-[#0b0f19] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors select-none"
    >
      {/* Top Title & Live Metric */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h4 className="text-sm font-bold text-slate-200">{title}</h4>
          <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
        </div>
        <div className="text-right">
          <div className={`text-base font-extrabold font-mono tabular-nums ${accentColorClass}`}>
            {currentY.toFixed(2)} <span className="text-xs font-normal text-slate-400">{unit}</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{formula}</div>
        </div>
      </div>

      {/* SVG Canvas with Interactive Dragging */}
      <div className="relative cursor-ew-resize">
        <svg
          ref={svgRef}
          width="100%"
          height={height}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="overflow-visible touch-none"
        />

        {/* Floating Scrubber Help */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] text-slate-400 pointer-events-none bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800 font-mono">
          <MoveHorizontal className="w-2.5 h-2.5 text-cyan-400" />
          <span>Arrastrar tiempo</span>
        </div>
      </div>
    </div>
  );
};
