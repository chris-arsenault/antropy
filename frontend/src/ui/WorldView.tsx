import { useEffect, useRef, useState } from "react";
import { createWorldRenderer } from "../render/worldRenderer";
import { type World } from "../sim/world";

interface WorldViewProps {
  world: World;
  /** When true (charts-only speed), the 3D viewport is not drawn. */
  chartsOnly: boolean;
}

function supportsWebgl(canvas: HTMLCanvasElement): boolean {
  return canvas.getContext("webgl2") !== null;
}

export function WorldView({ world, chartsOnly }: WorldViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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
    const resize = () => {
      renderer.resize(canvas.clientWidth, canvas.clientHeight);
    };
    resize();
    window.addEventListener("resize", resize);

    let frame = 0;
    const draw = () => {
      renderer.updateDirtyChunks();
      renderer.render(0);
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      renderer.dispose();
    };
  }, [world, chartsOnly]);

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
      <canvas ref={canvasRef} className="world-canvas" />
    </section>
  );
}
