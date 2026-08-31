import { useRef, useState } from "react";
import { deserializeWorld, serializeWorld } from "../persist/checkpoint";
import { loadCheckpoint, saveCheckpoint } from "../persist/db";
import { checkpointFromJson, checkpointToJson } from "../persist/file";
import { type World } from "../sim/world";

interface PersistenceControlsProps {
  world: World;
  onRestore(factory: () => World): void;
}

const SLOT = "latest";

/** Checkpoint save/load (IndexedDB) and file export/import (spec §11.2). */
export function PersistenceControls({ world, onRestore }: PersistenceControlsProps) {
  const [status, setStatus] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const save = async () => {
    try {
      await saveCheckpoint(SLOT, serializeWorld(world));
      setStatus(`saved @ tick ${world.tick}`);
    } catch (error) {
      setStatus(`save failed: ${String(error)}`);
    }
  };

  const load = async () => {
    try {
      const checkpoint = await loadCheckpoint(SLOT);
      if (!checkpoint) {
        setStatus("no saved checkpoint");
        return;
      }
      onRestore(() => deserializeWorld(checkpoint));
      setStatus(`loaded @ tick ${checkpoint.tick}`);
    } catch (error) {
      setStatus(`load failed: ${String(error)}`);
    }
  };

  const exportFile = () => {
    const json = checkpointToJson(serializeWorld(world));
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `antropy-seed${world.seed}-tick${world.tick}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus("exported");
  };

  const importFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    try {
      const checkpoint = checkpointFromJson(await file.text());
      onRestore(() => deserializeWorld(checkpoint));
      setStatus(`imported @ tick ${checkpoint.tick}`);
    } catch (error) {
      setStatus(`import failed: ${String(error)}`);
    }
  };

  return (
    <div className="persistence-controls">
      <button type="button" onClick={save}>
        Save
      </button>
      <button type="button" onClick={load}>
        Load
      </button>
      <button type="button" onClick={exportFile}>
        Export
      </button>
      <button type="button" onClick={() => fileRef.current?.click()}>
        Import
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        onChange={importFile}
        className="file-input"
      />
      {status && <span className="persistence-status">{status}</span>}
    </div>
  );
}
