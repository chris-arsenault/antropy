import { useEffect, useRef } from "react";
import { clearChart, drawSeriesLine, formatValue } from "./draw";
import { CHART } from "./palette";
import { extentOf, type TimeSeries } from "./timeSeries";

interface SparklineProps {
  label: string;
  series: TimeSeries;
  /** Redraw trigger. */
  version: number;
}

const HEIGHT = 26;

function drawSpark(canvas: HTMLCanvasElement, series: TimeSeries): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  const l = {
    width: canvas.width,
    height: canvas.height,
    left: 2,
    right: 2,
    top: 2,
    bottom: 2,
  };
  clearChart(ctx, l);
  const { min, max } = extentOf([series]);
  const tickStart = series.ticks[0] ?? 0;
  const tickEnd = series.ticks[series.ticks.length - 1] ?? 1;
  drawSeriesLine(ctx, l, series, CHART.series[0], min, max, tickStart, tickEnd);
}

/** One gene-track tile: mean over time plus the current value (spec §11.4). */
export function Sparkline({ label, series, version }: SparklineProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    canvas.width = canvas.clientWidth;
    canvas.height = HEIGHT;
    drawSpark(canvas, series);
  }, [series, version]);

  const current = series.values[series.values.length - 1];

  return (
    <div className="sparkline">
      <span className="sparkline-label">{label}</span>
      <canvas ref={canvasRef} className="sparkline-canvas" />
      <span className="sparkline-value">{current === undefined ? "—" : formatValue(current)}</span>
    </div>
  );
}
