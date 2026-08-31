import { useEffect, useRef } from "react";
import { CHART } from "./palette";

interface DivergingBarsProps {
  title: string;
  labels: readonly string[];
  values: number[];
  /** Redraw trigger. */
  version: number;
  /** Symmetric axis limit. */
  limit?: number;
}

const ROW_HEIGHT = 14;
const LABEL_WIDTH = 44;
const VALUE_WIDTH = 34;

function drawBars(
  canvas: HTMLCanvasElement,
  labels: readonly string[],
  values: number[],
  limit: number
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  const width = canvas.width;
  ctx.fillStyle = CHART.surface;
  ctx.fillRect(0, 0, width, canvas.height);

  const plotLeft = LABEL_WIDTH;
  const plotRight = width - VALUE_WIDTH;
  const mid = (plotLeft + plotRight) / 2;
  const halfSpan = (plotRight - plotLeft) / 2;

  ctx.strokeStyle = CHART.baseline;
  ctx.beginPath();
  ctx.moveTo(mid, 2);
  ctx.lineTo(mid, canvas.height - 2);
  ctx.stroke();

  ctx.font = "10px system-ui, sans-serif";
  ctx.textBaseline = "middle";
  for (let i = 0; i < labels.length; i++) {
    const y = i * ROW_HEIGHT + ROW_HEIGHT / 2;
    const value = Math.max(-limit, Math.min(limit, values[i] ?? 0));
    const barWidth = (Math.abs(value) / limit) * halfSpan;

    ctx.fillStyle = CHART.inkMuted;
    ctx.textAlign = "left";
    ctx.fillText(labels[i], 2, y);

    ctx.fillStyle = value >= 0 ? CHART.divergingPositive : CHART.divergingNegative;
    const x = value >= 0 ? mid : mid - barWidth;
    ctx.fillRect(x, y - 4, Math.max(1, barWidth), 8);

    ctx.fillStyle = CHART.inkSecondary;
    ctx.textAlign = "right";
    ctx.fillText((values[i] ?? 0).toFixed(2), width - 2, y);
  }
}

/**
 * Live selection-differential readout (design spec §11.4): one diverging bar
 * per trait, blue for positive selection, red for negative.
 */
export function DivergingBars({ title, labels, values, version, limit = 1 }: DivergingBarsProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    canvas.width = canvas.clientWidth;
    canvas.height = labels.length * ROW_HEIGHT;
    drawBars(canvas, labels, values, limit);
  }, [labels, values, version, limit]);

  return (
    <figure className="chart">
      <figcaption className="chart-title">{title}</figcaption>
      <canvas ref={canvasRef} className="chart-canvas" />
    </figure>
  );
}
