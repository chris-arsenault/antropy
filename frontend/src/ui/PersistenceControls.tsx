import { useEffect, useState } from "react";
import { type World } from "../sim/types";
import { restoreWorld } from "../persist/checkpoint";
import { browserCheckpoint } from "./runtimeIdentity";
import { listRecoveries, loadLocal, saveLocal } from "../persist/db";
import { type RecoveryMetadata } from "../persist/recoveryPolicy";
import { observationIdentity } from "../persist/observation";

interface PersistenceProps {
  world: World;
  onRestore: (world: World) => void;
}
export function PersistenceControls({ world, onRestore }: PersistenceProps) {
  const [message, setMessage] = useState("");
  const [saves, setSaves] = useState<RecoveryMetadata[]>([]);
  const [selected, setSelected] = useState("");
  useEffect(() => {
    listRecoveries()
      .then(setSaves)
      .catch((e) => setMessage(String(e)));
  }, []);
  const run = async (operation: () => Promise<void>) => {
    try {
      await operation();
      setMessage("Done");
    } catch (e) {
      setMessage(String(e));
    }
  };
  return (
    <details className="panel">
      <summary>Save, restore and export</summary>
      <button
        onClick={() =>
          void run(async () => {
            await saveLocal(browserCheckpoint(world), {
              tick: world.tick,
              seed: world.seed,
              runId: observationIdentity(world),
              reason: "manual",
            });
            setSaves(await listRecoveries());
          })
        }
      >
        Save locally
      </button>
      <label>
        Recovery point{" "}
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">Latest saved state</option>
          {saves.map((s) => (
            <option key={s.id} value={s.id}>
              Seed {s.seed} · tick {s.tick.toLocaleString()} · {s.reason} ·{" "}
              {new Date(s.createdAt).toLocaleString()}
            </option>
          ))}
        </select>
      </label>
      <button onClick={() => void run(async () => setSaves(await listRecoveries()))}>
        Refresh saves
      </button>
      <button
        onClick={() =>
          void run(async () => onRestore(restoreWorld(await loadLocal(selected || undefined))))
        }
      >
        Restore selected state
      </button>
      <button onClick={() => exportFile(world)}>Export checkpoint</button>
      <label>
        Import checkpoint{" "}
        <input
          type="file"
          accept=".json"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void run(async () => onRestore(restoreWorld(await file.text())));
          }}
        />
      </label>
      <p role="status">{message}</p>
      <p>{RECOVERY_HELP}</p>
    </details>
  );
}
const RECOVERY_HELP =
  "Keeps six automatic and two manual recovery points across runs, within 256 MiB. Export keeps a separate copy with ancestry and retained observation. Restores start paused. Sleep or browser suspension can stop execution; recovery continues from the last completed save.";
function exportFile(world: World): void {
  const url = URL.createObjectURL(
    new Blob([browserCheckpoint(world)], { type: "application/json" })
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `bacteria-${world.seed}-${world.tick}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
