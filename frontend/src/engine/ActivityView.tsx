import { type Activity, type FlowWindow, type SpeciesFlow } from "./phenotypes";

const format = (n: number) => n.toLocaleString(undefined, { maximumSignificantDigits: 3 });

export function WindowLabel({ window }: { window: FlowWindow }) {
  return (
    <p className="web-caption">
      Measured ticks {window.start.toLocaleString()}–{window.end.toLocaleString()}
      {" · "}
      {format(window.seconds)} model seconds
      {window.complete ? " · last complete interval" : " · collecting interval"}. Rates include
      cells that died during this interval. Group changes and restores start fresh coverage.
    </p>
  );
}

export function MaterialActivity({
  activity,
  seconds,
}: {
  activity: Activity | null;
  seconds: number;
}) {
  if (!activity || seconds <= 0)
    return <p>Advance the simulation to collect accepted material flow.</p>;
  return (
    <div className="material-activity">
      <SpeciesRates label="Uptake" values={activity.imports} seconds={seconds} />
      <SpeciesRates label="Export" values={activity.exports} seconds={seconds} />
    </div>
  );
}

function SpeciesRates({
  label,
  values,
  seconds,
}: {
  label: string;
  values: SpeciesFlow;
  seconds: number;
}) {
  return (
    <section>
      <h4>
        {label} · {format(values.total / seconds)} material / s
      </h4>
      {values.rows.length ? (
        <ul>
          {values.rows.map(([id, amount]) => (
            <li key={id}>
              #{id} <strong>{format(amount / seconds)}</strong>
            </li>
          ))}
          {values.other > 0 && (
            <li>
              Other <strong>{format(values.other / seconds)}</strong>
            </li>
          )}
        </ul>
      ) : (
        <p>None measured.</p>
      )}
    </section>
  );
}
