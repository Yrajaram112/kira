/**
 * Waveform — canvas-based vertical-bar visualiser, 60fps.
 *
 * Bars decay smoothly when amplitude data goes stale. Colour comes from the
 * state palette: cyan for LISTENING, green for SPEAKING.
 */

import { useEffect, useRef } from 'react';

import { stateColor } from '../styles/theme.js';

const ACTIVE_STATES = new Set(['LISTENING', 'SPEAKING']);

export default function Waveform({ data, state }) {
  const canvasRef = useRef(null);
  const dataRef = useRef(data || []);
  const stateRef = useRef(state);

  useEffect(() => { dataRef.current = data || []; }, [data]);
  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const w = canvas.clientWidth || 320;
      const h = canvas.clientHeight || 56;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const BARS = 24;
    const decayed = new Array(BARS).fill(0);
    let raf = 0;

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      const active = ACTIVE_STATES.has(stateRef.current);
      const targets = dataRef.current.length === BARS
        ? dataRef.current
        : resampleToBars(dataRef.current, BARS);

      for (let i = 0; i < BARS; i += 1) {
        const target = active ? (targets[i] || 0) : 0;
        decayed[i] += (target - decayed[i]) * 0.35;
      }

      const color = stateColor(stateRef.current);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = active ? 8 : 0;

      const gap = 3;
      const barWidth = Math.max(2, (w - gap * (BARS - 1)) / BARS);
      for (let i = 0; i < BARS; i += 1) {
        const amplitude = clamp01(decayed[i]);
        const barHeight = Math.max(2, amplitude * h * 0.95);
        const x = i * (barWidth + gap);
        const y = (h - barHeight) / 2;
        ctx.globalAlpha = active ? 0.5 + amplitude * 0.5 : 0.15;
        roundRect(ctx, x, y, barWidth, barHeight, Math.min(barWidth / 2, 3));
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="waveform-wrap">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
}

function clamp01(v) { return Math.max(0, Math.min(1, v)); }

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
  ctx.fill();
}

function resampleToBars(arr, n) {
  if (!arr || arr.length === 0) return new Array(n).fill(0);
  if (arr.length === n) return arr;
  const out = new Array(n);
  const step = arr.length / n;
  for (let i = 0; i < n; i += 1) {
    out[i] = arr[Math.floor(i * step)] || 0;
  }
  return out;
}
