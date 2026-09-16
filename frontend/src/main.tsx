import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { releaseDevelopmentTimings } from "./ui/developmentTimings";
import "./styles.css";

if (import.meta.env.DEV) {
  const dispose = releaseDevelopmentTimings();
  import.meta.hot?.dispose(dispose);
}

const container = document.getElementById("root");
if (!container) {
  throw new Error("Missing #root container");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
