import { useRef, useState } from "react";
import { createCheckpoint, restoreCheckpoint } from "../persist/checkpoint";
import { loadCheckpoint, saveCheckpoint } from "../persist/db";
import { downloadCheckpoint, readCheckpoint } from "../persist/file";
import { type World } from "../sim/types";

export function PersistenceControls({
  world,
  onRestore,
}: {
  readonly world: World;
  readonly onRestore: (world: World) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");

  const save = async () => {
    await saveCheckpoint(createCheckpoint(world));
    setMessage("Saved locally");
  };
  const load = async () => {
    const checkpoint = await loadCheckpoint();
    if (!checkpoint) return setMessage("No local checkpoint");
    onRestore(restoreCheckpoint(checkpoint));
  };
  const importFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      onRestore(await readCheckpoint(file));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Checkpoint import failed");
    }
  };

  return (
    <div className="persistence-controls">
      <button type="button" onClick={() => void save()}>
        Save
      </button>
      <button type="button" onClick={() => void load()}>
        Load
      </button>
      <button type="button" onClick={() => downloadCheckpoint(world)}>
        Export
      </button>
      <button type="button" onClick={() => input.current?.click()}>
        Import
      </button>
      <input
        ref={input}
        hidden
        type="file"
        accept="application/json"
        onChange={(event) => void importFile(event.target.files?.[0])}
      />
      {message && <span className="persistence-message">{message}</span>}
    </div>
  );
}
