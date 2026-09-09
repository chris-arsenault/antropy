import { type SimulationHandle } from "./useSimulation";

export function ThroughputPanel({ simulation }: { readonly simulation: SimulationHandle }) {
  const { speed, running, ticksPerSecond, millisecondsPerTick } = simulation;
  const limited = running && speed !== "max" && ticksPerSecond > 0 && ticksPerSecond < speed * 0.9;
  return (
    <section className="panel" data-testid="throughput-panel">
      <h2>Simulation rate</h2>
      <p>
        Target: {speed === "max" ? "Maximum" : `${speed} ticks/s`} ·{" "}
        {running ? "Running" : "Paused"}
      </p>
      <p>
        {running ? "Actual" : "Last measured"}:{" "}
        <span data-testid="actual-tick-rate">{ticksPerSecond.toFixed(1)}</span> ticks/s ·{" "}
        {millisecondsPerTick.toFixed(1)} ms/tick
      </p>
      {limited && <p>Running below target; computation and display work limit throughput.</p>}
    </section>
  );
}
