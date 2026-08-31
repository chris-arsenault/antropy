import { useEffect, useRef, useState } from "react";
import { drawLineChart, formatValue, layoutFor, type NamedSeries } from "./draw";
import { CHART, chipClass } from "./palette";

interface LineChartProps {
  title: string;
  series: NamedSeries[];
  /** Redraw trigger — the current sample count or tick. */
  version: number;
  height?: number;
}

interface HoverState {
  x: number;
  index: number;
}

function drawCrosshair(canvas: HTMLCanvasElement, series: NamedSeries[], hover: HoverState): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  const l = layoutFor(canvas.width, canvas.height);
  drawLineChart(ctx, l, series);
  ctx.strokeStyle = CHART.baseline;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(hover.x, l.top);
  ctx.lineTo(hover.x, l.height - l.bottom);
  ctx.stroke();

  ctx.font = "10px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  let row = 0;
  for (const { name, series: s, color } of series) {
    const value = s.values[hover.index];
    if (value === undefined) {
      continue;
    }
    const y = l.top + 2 + row * 12;
    ctx.fillStyle = color;
    ctx.fillRect(l.left + 4, y + 3, 6, 2);
    ctx.fillStyle = CHART.inkPrimary;
    ctx.fillText(`${name} ${formatValue(value)}`, l.left + 14, y);
    row += 1;
  }
}

export function LineChart({ title, series, version, height = 90 }: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hover, setHover] = useState<HoverState | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      return;
    }
    canvas.width = canvas.clientWidth;
    canvas.height = height;
    if (hover) {
      drawCrosshair(canvas, series, hover);
    } else {
      drawLineChart(ctx, layoutFor(canvas.width, canvas.height), series);
    }
  }, [series, version, height, hover]);

  const onMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const first = series[0]?.series;
    if (!canvas || !first || first.ticks.length === 0) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const l = layoutFor(canvas.width, canvas.height);
    const fraction = (x - l.left) / Math.max(1, canvas.width - l.left - l.right);
    const index = Math.round(fraction * (first.ticks.length - 1));
    if (index >= 0 && index < first.ticks.length) {
      setHover({ x, index });
    }
  };

  return (
    <figure className="chart">
      <figcaption className="chart-title">{title}</figcaption>
      <canvas
        ref={canvasRef}
        className="chart-canvas"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      />
      {series.length >= 2 && (
        <div className="chart-legend">
          {series.map(({ name, color }) => (
            <span key={name} className="legend-item">
              <span className={`legend-chip ${chipClass(color)}`} />
              {name}
            </span>
          ))}
        </div>
      )}
    </figure>
  );
}
