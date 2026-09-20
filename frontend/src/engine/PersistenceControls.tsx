import { useState } from "react";
import { type Bridge } from "./bridge";
import { type RecoveryMetadata } from "../persist/recoveryPolicy";
import { readRuntimeHealth } from "./runtimeHealth";

export function PersistenceControls({ bridge, ready }: { bridge: Bridge; ready: boolean }) {
  const [message, setMessage] = useState(""),
    [saves, setSaves] = useState<RecoveryMetadata[]>([]),
    [selected, setSelected] = useState("");
  const refresh = async () => setSaves(await bridge.call<RecoveryMetadata[]>("recoveries"));
  const run = async (operation: () => Promise<unknown>) => {
    try {
      await operation();
      setMessage("Done");
    } catch (error) {
      setMessage(String(error));
    }
  };
  return (
    <details
      className="panel"
      open
      onToggle={(e) => {
        if (e.currentTarget.open && ready) run(refresh);
      }}
    >
      <summary>Save, restore and export</summary>
      <button
        disabled={!ready}
        onClick={() =>
          run(async () => {
            await bridge.call("save");
            await refresh();
          })
        }
      >
        Save locally
      </button>
      <RecoverySelect saves={saves} selected={selected} setSelected={setSelected} />
      <button disabled={!ready} onClick={() => run(refresh)}>
        Refresh saves
      </button>
      <button
        disabled={!ready}
        onClick={() => run(() => bridge.call("recover", selected ? { id: selected } : {}))}
      >
        Restore selected state
      </button>
      <button disabled={!ready} onClick={() => run(() => download(bridge))}>
        Export checkpoint
      </button>
      <button onClick={() => run(downloadHealth)}>Export runtime report</button>
      <label>
        Import checkpoint{" "}
        <input
          disabled={!ready}
          type="file"
          accept=".gz,.antropy"
          onChange={(e) => {
            const blob = e.target.files?.[0];
            if (blob) run(() => bridge.call("import", { blob }));
            e.target.value = "";
          }}
        />
      </label>
      <p role="status">{message}</p>
      <p>
        Keeps up to six automatic and two manual recovery points across runs, within 256 MiB. Older
        points expire as space is needed; the newest save takes priority. Export keeps a separate
        copy with ancestry and retained observation. Restores start paused. Sleep or browser
        suspension can stop execution; recovery continues from the last completed save.
      </p>
    </details>
  );
}

async function downloadHealth() {
  const report = {
    note: "Last local observations; an abrupt end alone does not identify the crash cause.",
    runs: await readRuntimeHealth(),
  };
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(report, null, 2)], { type: "application/json" })
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "antropy-runtime-report.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function download(bridge: Bridge) {
  const blob = await bridge.call<Blob>("export"),
    status = bridge.getSnapshot();
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = `antropy-${status.definition?.seed}-${status.status?.summary.tick}.antropy.gz`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function RecoverySelect({
  saves,
  selected,
  setSelected,
}: {
  saves: RecoveryMetadata[];
  selected: string;
  setSelected: (id: string) => void;
}) {
  return (
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
  );
}
