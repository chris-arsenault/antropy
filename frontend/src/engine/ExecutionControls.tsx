import { useState } from "react";
import { executionMode, remoteEndpoint } from "./executionMode";
import { type LiveStatus } from "./types";
import { type Bridge } from "./bridge";

export function ExecutionControls({
  status,
  bridge,
}: {
  status: LiveStatus | null;
  bridge: Bridge;
}) {
  const current = executionMode();
  const [mode, setMode] = useState(current.mode);
  const [endpoint, setEndpoint] = useState(current.endpoint);
  const [error, setError] = useState("");
  function open() {
    try {
      const url = new URL(location.href);
      url.searchParams.set("execution", mode);
      if (mode === "server") url.searchParams.set("server", remoteEndpoint(endpoint));
      else url.searchParams.delete("server");
      location.assign(url.href);
    } catch (e) {
      setError(String(e));
    }
  }
  const runtime = status?.execution;
  const label = executionLabel(status);
  return (
    <details className="execution-controls">
      <summary>{label}</summary>
      <label>
        Execution mode{" "}
        <select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
          <option value="browser1">Browser · 1 thread</option>
          <option value="browser4">Browser · 4 threads</option>
          <option value="server">Connect to server</option>
        </select>
      </label>
      {mode === "server" && (
        <label>
          Server address{" "}
          <input
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="https://server-address/stream"
          />
        </label>
      )}
      <p>{mode === "server" ? "Watch the continuing world." : "Starts a new local run."}</p>
      <button onClick={open}>{mode === "server" ? "Connect" : "Start local world"}</button>
      {error && <p role="alert">{error}</p>}
      {runtime?.location === "server" && !runtime.operator && <OperatorLogin bridge={bridge} />}
    </details>
  );
}

function executionLabel(status: LiveStatus | null) {
  const runtime = status?.execution;
  if (!runtime) return "Execution";
  const place = runtime.location === "server" ? "Server" : "Browser";
  return `${place} · ${runtime.threads} threads${runtime.connected ? "" : " · reconnecting"}`;
}

function OperatorLogin({ bridge }: { bridge: Bridge }) {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        bridge
          .call("authenticate", { token })
          .then(() => setToken(""))
          .catch((e) => setError(String(e)));
      }}
    >
      <label>
        Operator key{" "}
        <input
          type="password"
          autoComplete="off"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
      </label>
      <button type="submit">Enable owner controls</button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
