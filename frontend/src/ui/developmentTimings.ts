/** React development measures retain serialized props in the browser's timing buffer. */
export function releaseDevelopmentTimings() {
  if (
    typeof PerformanceObserver === "undefined" ||
    !PerformanceObserver.supportedEntryTypes.includes("measure")
  )
    return () => {};

  const observer = new PerformanceObserver((list) => {
    const names = new Set<string>();
    for (const entry of list.getEntries()) {
      const details = (entry as PerformanceMeasure).detail?.devtools;
      if (details?.track === "Components ⚛" || details?.trackGroup === "Scheduler ⚛")
        names.add(entry.name);
    }
    // Observers (including a live recording) receive entries before buffer cleanup.
    for (const name of names) performance.clearMeasures(name);
  });
  observer.observe({ type: "measure", buffered: true });
  return () => observer.disconnect();
}
