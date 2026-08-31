import { CHART } from "./palette";
import { extentOf, type TimeSeries } from "./timeSeries";

export interface ChartLayout {
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export function layoutFor(width: number, height: number): ChartLayout {
  return { width, height, left: 34, right: 8, top: 6, bottom: 14 };
}

function plotWidth(l: ChartLayout): number {
  return l.width - l.left - l.right;
}

function plotHeight(l: ChartLayout): number {
  return l.height - l.top - l.bottom;
}

export function clearChart(ctx: CanvasRenderingContext2D, l: ChartLayout): void {
  ctx.fillStyle = CHART.surface;
  ctx.fillRect(0, 0, l.width, l.height);
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  l: ChartLayout,
  min: number,
  max: number
): void {
  ctx.strokeStyle = CHART.gridline;
  ctx.fillStyle = CHART.inkMuted;
  ctx.lineWidth = 1;
  ctx.font = "9px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  const rows = 3;
  for (let i = 0; i <= rows; i++) {
    const value = min + ((max - min) * i) / rows;
    const y = l.top + plotHeight(l) * (1 - i / rows);
    ctx.beginPath();
    ctx.moveTo(l.left, y);
    ctx.lineTo(l.width - l.right, y);
    ctx.stroke();
    ctx.fillText(formatValue(value), l.left - 4, y);
  }
}

export function formatValue(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 10_000) {
    return `${(value / 1000).toFixed(0)}k`;
  }
  if (abs >= 100) {
    return value.toFixed(0);
  }
  if (abs >= 1) {
    return value.toFixed(1);
  }
  return value.toFixed(2);
}

export function drawSeriesLine(
  ctx: CanvasRenderingContext2D,
  l: ChartLayout,
  series: TimeSeries,
  color: string,
  min: number,
  max: number,
  tickStart: number,
  tickEnd: number
): void {
  if (series.values.length < 2) {
    return;
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.beginPath();
  const span = Math.max(1, tickEnd - tickStart);
  for (let i = 0; i < series.values.length; i++) {
    const x = l.left + (plotWidth(l) * (series.ticks[i] - tickStart)) / span;
    const y = l.top + plotHeight(l) * (1 - (series.values[i] - min) / (max - min));
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
}

export interface NamedSeries {
  name: string;
  series: TimeSeries;
  color: string;
}

/** Multi-series line chart body: grid, lines, and end-of-line direct labels. */
export function drawLineChart(
  ctx: CanvasRenderingContext2D,
  l: ChartLayout,
  seriesList: NamedSeries[]
): void {
  clearChart(ctx, l);
  const { min, max } = extentOf(seriesList.map((s) => s.series));
  drawGrid(ctx, l, min, max);

  let tickStart = Infinity;
  let tickEnd = -Infinity;
  for (const { series } of seriesList) {
    if (series.ticks.length > 0) {
      tickStart = Math.min(tickStart, series.ticks[0]);
      tickEnd = Math.max(tickEnd, series.ticks[series.ticks.length - 1]);
    }
  }
  if (tickStart === Infinity) {
    return;
  }
  for (const { series, color } of seriesList) {
    drawSeriesLine(ctx, l, series, color, min, max, tickStart, tickEnd);
  }

  ctx.font = "10px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  for (const { name, series, color } of seriesList) {
    const last = series.values[series.values.length - 1];
    if (last === undefined) {
      continue;
    }
    const y = l.top + plotHeight(l) * (1 - (last - min) / (max - min));
    ctx.fillStyle = color;
    ctx.fillRect(l.width - l.right - 3, y - 1.5, 3, 3);
    ctx.fillStyle = CHART.inkSecondary;
    ctx.fillText(name, l.width - l.right - 6, y - 2);
  }
}
