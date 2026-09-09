import { senseColony } from "../sim/colonySensors";
import { type Ant, type World } from "../sim/types";

const DIRECTIONS = [
  "front",
  "front-left",
  "left",
  "back-left",
  "back",
  "back-right",
  "right",
  "front-right",
];

export function ColonySensePanel({ world, ant }: { readonly world: World; readonly ant: Ant }) {
  const frame = senseColony(world, ant);
  return (
    <details className="inspector-block">
      <summary>Local colony contacts and air</summary>
      {frame.contacts.map((contact, index) => (
        <div className="inspector-row" key={DIRECTIONS[index]}>
          <span className="inspector-key">{DIRECTIONS[index]}</span>
          <span className="inspector-value">
            air {frame.freshAir[index].toFixed(5)} · food {contact.food.toFixed(1)}
            {contact.hungry ? " · hungry recipient" : ""}
            {contact.queen ? " · queen" : ""}
            {contact.open ? "" : " · blocked"}
          </span>
        </div>
      ))}
    </details>
  );
}
