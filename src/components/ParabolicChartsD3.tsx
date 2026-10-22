import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { ParabolicParams } from '../types/parabolic';
import { calculateParabolicResults, getParabolicAtTime } from '../utils/parabolic';
import { BarChart3, LineChart, Activity, Zap } from 'lucide-react';

interface ParabolicChartsD3Props {
  params: ParabolicParams;
  currentTime: number;
  onTimeChange: (time: number) => void;
}

export const ParabolicChartsD3: React.FC<ParabolicChartsD3Props> = ({
  params,
  currentTime,
  onTimeChange,
}) => {
  const trajRef = useRef<SVGSVGElement>(null);
  const yTimeRef = useRef<SVGSVGElement>(null);
  const vyTimeRef = useRef<SVGSVGElement>(null);
  const energyRef = useRef<SVGSVGElement>(null);

  const results = calculateParabolicResults(params);

  // Generate sample points
  const sampleCount = 60;
  const timeTotal = Math.max(0.1, results.timeTotal);
  const dt = timeTotal / sampleCount;

  const dataset = Array.from({ length: sampleCount + 1 }).map((_, i) => {
    const t = i * dt;
    return getParabolicAtTime(params, t);
  });

  // Current Instant
  const currentInst = getParabolicAtTime(params, currentTime);

  useEffect(() => {
    const margin = { top: 20, right: 25, bottom: 35, left: 45 };
    const width = 360 - margin.left - margin.right;
    const height = 180 - margin.top - margin.bottom;

    // Helper to draw each chart
    const renderChart = (
      svgEl: SVGSVGElement | null,
      xAccessor: (d: any) => number,
      yAccessor: (d: any) => number,
      xDomain: [number, number],
      yDomain: [number, number],
      xLabel: string,
      yLabel: string,
      strokeColor: string,
      currentX: number,
      currentY: number,
      fillGradientId: string
    ) => {
      if (!svgEl) return;
      const svg = d3.select(svgEl);
      svg.selectAll('*').remove();

      const g = svg
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const xScale = d3.scaleLinear().domain(xDomain).range([0, width]);
      const yScale = d3.scaleLinear().domain(yDomain).nice().range([height, 0]);

      // Grid lines
      g.append('g')
        .attr('class', 'grid')
        .attr('opacity', 0.15)
        .call(
          d3.axisLeft(yScale)
            .tickSize(-width)
            .tickFormat(() => '')
        );

      // Gradient fill
      const defs = svg.append('defs');
      const gradient = defs
        .append('linearGradient')
        .attr('id', fillGradientId)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');

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

      // Area
      const area = d3
        .area<any>()
        .x((d) => xScale(xAccessor(d)))
        .y0(height)
        .y1((d) => yScale(yAccessor(d)))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(dataset)
        .attr('fill', `url(#${fillGradientId})`)
        .attr('d', area);

      // Line
      const line = d3
        .line<any>()
        .x((d) => xScale(xAccessor(d)))
        .y((d) => yScale(yAccessor(d)))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(dataset)
        .attr('fill', 'none')
        .attr('stroke', strokeColor)
        .attr('stroke-width', 2.5)
        .attr('d', line);

      // X Axis
      g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale).ticks(5))
        .attr('color', '#64748b')
        .selectAll('text')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace');

      // Y Axis
      g.append('g')
        .call(d3.axisLeft(yScale).ticks(4))
        .attr('color', '#64748b')
        .selectAll('text')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace');

      // Axis Labels
      g.append('text')
        .attr('x', width)
        .attr('y', height + 28)
        .attr('text-anchor', 'end')
        .attr('fill', '#94a3b8')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .text(xLabel);

      g.append('text')
        .attr('x', -margin.left + 5)
        .attr('y', -6)
        .attr('text-anchor', 'start')
        .attr('fill', '#94a3b8')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .text(yLabel);

      // Current Value Indicator
      const cx = xScale(currentX);
      const cy = yScale(currentY);

      if (cx >= 0 && cx <= width && cy >= 0 && cy <= height) {
        // Vertical dashed scrubber line
        g.append('line')
          .attr('x1', cx)
          .attr('y1', 0)
          .attr('x2', cx)
          .attr('y2', height)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '3 3')
          .attr('opacity', 0.6);

        // Indicator dot
        g.append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', 5)
          .attr('fill', strokeColor)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 2);
      }
    };

    // 1. y(x) Trajectory Curve
    renderChart(
      trajRef.current,
      (d) => d.x,
      (d) => d.y,
      [0, Math.max(1, results.maxRange)],
      [0, Math.max(1, results.maxHeight * 1.15)],
      'Distancia x (m)',
      'Altura y (m)',
      '#38bdf8',
      currentInst.x,
      currentInst.y,
      'gradTraj'
    );

    // 2. y(t) Height vs Time
    renderChart(
      yTimeRef.current,
      (d) => d.time,
      (d) => d.y,
      [0, timeTotal],
      [0, Math.max(1, results.maxHeight * 1.15)],
      'Tiempo t (s)',
      'Altura y (m)',
      '#10b981',
      currentInst.time,
      currentInst.y,
      'gradYTime'
    );

    // 3. vy(t) Vertical Velocity vs Time
    renderChart(
      vyTimeRef.current,
      (d) => d.time,
      (d) => d.vy,
      [0, timeTotal],
      [Math.min(0, results.finalVy * 1.1), Math.max(1, results.voy * 1.1)],
      'Tiempo t (s)',
      'Vy (m/s)',
      '#c084fc',
      currentInst.time,
      currentInst.vy,
      'gradVyTime'
    );

    // 4. Energy vs Time (Ek and Ep)
    if (energyRef.current) {
      const svg = d3.select(energyRef.current);
      svg.selectAll('*').remove();

      const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
      const xScale = d3.scaleLinear().domain([0, timeTotal]).range([0, width]);
      const maxEnergy = Math.max(0.01, results.initialKineticEnergy * 1.15);
      const yScale = d3.scaleLinear().domain([0, maxEnergy]).nice().range([height, 0]);

      // Ek line (Orange)
      const lineEk = d3
        .line<any>()
        .x((d) => xScale(d.time))
        .y((d) => yScale(d.kineticEnergy))
        .curve(d3.curveMonotoneX);

      // Ep line (Cyan)
      const lineEp = d3
        .line<any>()
        .x((d) => xScale(d.time))
        .y((d) => yScale(d.potentialEnergy))
        .curve(d3.curveMonotoneX);

      g.append('path').datum(dataset).attr('fill', 'none').attr('stroke', '#f97316').attr('stroke-width', 2).attr('d', lineEk);
      g.append('path').datum(dataset).attr('fill', 'none').attr('stroke', '#06b6d4').attr('stroke-width', 2).attr('d', lineEp);

      // X/Y Axis
      g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale).ticks(5))
        .attr('color', '#64748b')
        .selectAll('text')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace');

      g.append('g')
        .call(d3.axisLeft(yScale).ticks(4))
        .attr('color', '#64748b')
        .selectAll('text')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace');

      // Legend
      g.append('text').attr('x', 0).attr('y', -6).attr('fill', '#f97316').attr('font-size', '9px').attr('font-weight', 'bold').text('Ek (Cinética)');
      g.append('text').attr('x', 75).attr('y', -6).attr('fill', '#06b6d4').attr('font-size', '9px').attr('font-weight', 'bold').text('Ep (Potencial)');
    }
  }, [params, currentTime, results, timeTotal, currentInst]);

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800/80">
        <div>
          <h3 className="text-lg sm:text-xl font-black text-slate-100 flex items-center gap-2">
            <LineChart className="w-5 h-5 text-cyan-400" />
            Gráficas Cinemáticas & Balística D3.js
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Comportamiento analítico interactivo de la trayectoria parabólica, altura temporal, velocidad y conservación de energía.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
          <span>Arrastra el tiempo:</span>
          <span className="font-bold text-orange-400 tabular-nums">{currentTime.toFixed(2)}s</span>
        </div>
      </div>

      {/* Grid of 4 Responsive Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Chart 1: y(x) Space Trajectory */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs font-mono mb-2">
            <span className="font-bold text-sky-400">1. Trayectoria y(x)</span>
            <span className="text-[10px] text-slate-500">Parábola Real</span>
          </div>
          <svg ref={trajRef} viewBox="0 0 360 180" className="w-full h-auto block" />
        </div>

        {/* Chart 2: y(t) Height vs Time */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs font-mono mb-2">
            <span className="font-bold text-emerald-400">2. Altura y(t)</span>
            <span className="text-[10px] text-slate-500">MRUV Gravitatorio</span>
          </div>
          <svg ref={yTimeRef} viewBox="0 0 360 180" className="w-full h-auto block" />
        </div>

        {/* Chart 3: vy(t) Vertical Velocity */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs font-mono mb-2">
            <span className="font-bold text-purple-400">3. Velocidad Vy(t)</span>
            <span className="text-[10px] text-slate-500">Pendiente -g</span>
          </div>
          <svg ref={vyTimeRef} viewBox="0 0 360 180" className="w-full h-auto block" />
        </div>

        {/* Chart 4: Energy vs Time */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-xs font-mono mb-2">
            <span className="font-bold text-orange-400">4. Energía Ek & Ep</span>
            <span className="text-[10px] text-slate-500">Conservación Mecánica</span>
          </div>
          <svg ref={energyRef} viewBox="0 0 360 180" className="w-full h-auto block" />
        </div>
      </div>
    </div>
  );
};
