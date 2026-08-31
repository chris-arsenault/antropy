import { SPEED_PRESETS, type SpeedPreset } from "./ui/pacing";
import { useSimulation } from "./ui/useSimulation";

const DEFAULT_SEED = 1;

export function App() {
  const sim = useSimulation(DEFAULT_SEED);

  return (
    <main className="app-shell">
      <h1>Antropy</h1>
      <p className="status-line">
        Tick <span data-testid="tick">{sim.tick}</span> · seed {sim.world.seed}
      </p>
      <div className="controls">
        <button type="button" onClick={sim.running ? sim.pause : sim.start}>
          {sim.running ? "Pause" : "Run"}
        </button>
        <label className="speed-label">
          Speed
          <select
            value={sim.speed}
            onChange={(event) => sim.setSpeed(Number(event.target.value) as SpeedPreset)}
          >
            {SPEED_PRESETS.map((preset) => (
              <option key={preset} value={preset}>
                {preset}×
              </option>
            ))}
          </select>
        </label>
      </div>
    </main>
  );
}
