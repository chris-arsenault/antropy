/** Fixed-capacity ring buffer for one instrumented time series. */
export interface TimeSeries {
  readonly capacity: number;
  ticks: number[];
  values: number[];
}

export function createTimeSeries(capacity = 600): TimeSeries {
  return { capacity, ticks: [], values: [] };
}

export function pushSample(series: TimeSeries, tick: number, value: number): void {
  series.ticks.push(tick);
  series.values.push(value);
  if (series.ticks.length > series.capacity) {
    series.ticks.shift();
    series.values.shift();
  }
}

export interface SeriesExtent {
  min: number;
  max: number;
}

/** Combined extent over several series, padded and never degenerate. */
export function extentOf(seriesList: TimeSeries[]): SeriesExtent {
  let min = Infinity;
  let max = -Infinity;
  for (const series of seriesList) {
    for (const value of series.values) {
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  }
  if (min === Infinity) {
    return { min: 0, max: 1 };
  }
  if (min === max) {
    return { min: min - 0.5, max: max + 0.5 };
  }
  const pad = (max - min) * 0.08;
  return { min: min - pad, max: max + pad };
}
