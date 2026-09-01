import { useEffect, useRef, useState } from "react";
import { createWorldRenderer, type WorldRenderer } from "../render/worldRenderer";
import { type World } from "../sim/world";

interface WorldViewProps {
  world: World;
  /** When true (charts-only speed), the 3D viewport is not drawn. */
  chartsOnly: boolean;
  /** Ground opacity in [0.05, 1]; below 1 the terrain is x-ray. */
  groundOpacity: number;
  /** Fractional-tick interpolation factor owned by the simulation host. */
  alphaRef: { readonly current: number };
  onPickAnt(antId: number | null): void;
}

function supportsWebgl(canvas: HTMLCanvasElement): boolean {
  return canvas.getContext("webgl2") !== null;
}

export function WorldView({
  world,
  chartsOnly,
  groundOpacity,
  alphaRef,
  onPickAnt,
}: WorldViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<WorldRenderer | null>(null);
  const [webglAvailable, setWebglAvailable] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || chartsOnly) {
      return undefined;
    }
    if (!supportsWebgl(canvas)) {
      setWebglAvailable(false);
      return undefined;
    }

    const renderer = createWorldRenderer(canvas, world);
    rendererRef.current = renderer;
    const resize = () => {
      renderer.resize(canvas.clientWidth, canvas.clientHeight);
    };
    resize();
    window.addEventListener("resize", resize);

    let frame = 0;
    const draw = () => {
      renderer.updateDirtyChunks();
      renderer.render(alphaRef.current);
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      rendererRef.current = null;
      renderer.dispose();
    };
  }, [world, chartsOnly, alphaRef]);

  // Runs after the creation effect (declaration order), so a fresh renderer
  // always receives the current opacity.
  useEffect(() => {
    rendererRef.current?.setTerrainOpacity(groundOpacity);
  }, [groundOpacity, world, chartsOnly]);

  const onClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const renderer = rendererRef.current;
    if (!canvas || !renderer) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const ndcX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    onPickAnt(renderer.pickAnt(ndcX, ndcY));
  };

  if (chartsOnly) {
    return (
      <section className="world-view" data-testid="world-view">
        <p className="viewport-notice">Charts-only speed — rendering disabled.</p>
      </section>
    );
  }

  return (
    <section className="world-view" data-testid="world-view">
      {!webglAvailable && (
        <p className="viewport-notice">
          WebGL2 is unavailable in this browser; the 3D view cannot render.
        </p>
      )}
      <canvas ref={canvasRef} className="world-canvas" onClick={onClick} />
    </section>
  );
}
