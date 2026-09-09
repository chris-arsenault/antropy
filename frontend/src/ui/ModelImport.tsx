import { type SimConfig } from "../sim/config";
import { useRef, useState } from "react";
import { validateRegisteredModel, type RegisteredModel } from "../sim/controller/registeredModel";
import { createRegisteredWorld } from "../sim/world";
import { type World } from "../sim/types";

export function ModelImport({
  config,
  seed,
  onRestore,
}: {
  readonly config: SimConfig;
  readonly seed: number;
  readonly onRestore: (world: World) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const importModel = async (file: File | undefined) => {
    if (!file) return;
    try {
      const model = validateRegisteredModel(JSON.parse(await file.text()) as RegisteredModel);
      onRestore(createRegisteredWorld(seed, model, config));
      setMessage("Experimental model loaded into a fresh colony");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Model import failed");
    }
  };
  return (
    <div className="persistence-controls">
      <button type="button" onClick={() => input.current?.click()}>
        Import RNN
      </button>
      <input
        ref={input}
        hidden
        type="file"
        accept="application/json"
        onChange={(event) => void importModel(event.target.files?.[0])}
      />
      {message && <span className="persistence-message">{message}</span>}
    </div>
  );
}
