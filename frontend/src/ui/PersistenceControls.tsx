import { useState } from "react";
import { type World } from "../sim/types";
import { restoreWorld } from "../persist/checkpoint";
import { browserCheckpoint } from "./runtimeIdentity";
import { loadLocal, saveLocal } from "../persist/db";

export function PersistenceControls({
  world,
  onRestore,
}: {
  world: World;
  onRestore: (world: World) => void;
}) {
  const [message, setMessage] = useState("");
  const run = async (operation: () => Promise<void>) => {
    try {
      await operation();
      setMessage("Done");
    } catch (e) {
      setMessage(String(e));
    }
  };
  const exportFile = () => {
    const url = URL.createObjectURL(
      new Blob([browserCheckpoint(world)], { type: "application/json" })
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `bacteria-${world.seed}-${world.tick}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <details className="panel">
      <summary>Save, restore and export</summary>
      <button onClick={() => void run(() => saveLocal(browserCheckpoint(world)))}>
        Save locally
      </button>
      <button onClick={() => void run(async () => onRestore(restoreWorld(await loadLocal())))}>
        Restore local
      </button>
      <button onClick={exportFile}>Export checkpoint</button>
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
    </details>
  );
}
