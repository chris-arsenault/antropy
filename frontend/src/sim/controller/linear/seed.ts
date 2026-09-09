import { F } from "../../colony/observation";
import { REQUESTS } from "../../colony/contract";
import {
  add,
  all,
  compile,
  eq,
  gt,
  input,
  mul,
  sub,
  sum,
  specialize,
  type Expression,
} from "./expression";
import { validateLinearGenome, type LinearGenome } from "./genome";
import { CONSTRUCTION_SCORE } from "./constructionSeed";
import { PRESSURE_SCORE } from "./pressureSeed";
import { FORAGING_SCORE } from "./foragingSeed";
import { COLLECTIVE_SCORE } from "./collectiveSeed";
import { REPRODUCTION_SCORE } from "./reproductionSeed";

const x = (name: keyof typeof F) => input(F[name]);
const action = (kind: (typeof REQUESTS)[number]) => eq(x("action"), REQUESTS.indexOf(kind));
const empty = eq(x("cargo"), 0),
  loaded = gt(x("cargo"), 0);
const outside = sub(1, x("inside"));
const moving = all(gt(x("action"), 0), gt(5, x("action")));
const careNeeded = gt(sum(x("knownCareNeed"), x("anyRecipient")), 0.5);

function movementScore(): Expression {
  return mul(
    moving,
    sum(
      -20,
      mul(25, x("open")),
      mul(4, add(action("left"), action("right"))),
      mul(3, eq(x("task"), x("action"))),
      mul(2, x("noise")),
      all(10, x("inside"), action("up"), x("open"))
    )
  );
}

function destinationScore(): Expression {
  const distant = gt(x("targetDistance"), 2);
  return mul(
    action("acquire"),
    sum(
      -50,
      all(90, empty, x("inside"), eq(x("targetKind"), 0), distant),
      all(
        85,
        empty,
        eq(x("targetKind"), 4),
        gt(x("targetQuantity"), 0.25),
        sub(1, x("targetBacked")),
        outside,
        distant
      ),
      all(100, loaded, eq(x("targetKind"), 1), distant, sub(1, eq(x("task"), 19))),
      all(
        220,
        x("knownStorageSpace"),
        eq(x("targetKind"), 3),
        sub(1, x("targetRetiring")),
        sub(1, all(eq(x("task"), 19), x("routeReady"), gt(x("routeRemaining"), 0))),
        x("queenContact"),
        sum(
          all(loaded, sub(1, careNeeded), x("targetStorageSpace")),
          all(empty, x("anyRecipient"), gt(x("targetQuantity"), 0))
        ),
        distant
      ),
      mul(-0.01, x("targetDistance")),
      all(-20, x("sameTarget"), x("routeReady")),
      mul(-100, x("targetFailed"))
    )
  );
}

function interactionScore(): Expression {
  return sum(
    mul(
      action("eat"),
      sum(-50, all(200, gt(0.75, x("energy")), gt(sum(x("cargo"), x("edible"), x("foodHere")), 0)))
    ),
    mul(action("feed"), sum(-50, all(180, loaded, x("recipient")))),
    mul(
      action("pickup"),
      sum(
        -50,
        all(
          120,
          empty,
          gt(x("food"), 0.25),
          gt(
            sum(
              all(outside, sub(1, x("localCache"))),
              x("anyRecipient"),
              all(x("localCache"), gt(x("knownCareNeed"), 0.5))
            ),
            0
          )
        )
      )
    ),
    mul(
      action("deposit"),
      sum(
        -50,
        all(
          140,
          loaded,
          x("queenContact"),
          x("open"),
          sub(1, x("knownStorageSpace")),
          sub(1, eq(x("task"), 19)),
          sub(1, x("localRetiring"))
        ),
        all(
          210,
          loaded,
          x("localCache"),
          sub(1, x("localRetiring")),
          sub(1, all(eq(x("task"), 36), careNeeded)),
          sub(1, x("anyRecipient")),
          gt(x("cacheSpace"), 0)
        )
      )
    )
  );
}

/** Readable seed policy, evaluated directly for the programmed arm and compiled for LGP. */
export const SCORE = sum(
  REPRODUCTION_SCORE,
  all(
    sub(1, x("fertile")),
    sum(COLLECTIVE_SCORE, FORAGING_SCORE, PRESSURE_SCORE, destinationScore())
  ),
  CONSTRUCTION_SCORE,
  movementScore(),
  interactionScore(),
  mul(
    action("forward"),
    sum(
      -50,
      all(105, x("routeReady"), gt(x("routeRemaining"), 0)),
      mul(-80, eq(x("lastResult"), 1))
    )
  ),
  mul(action("backward"), -60),
  mul(action("discard"), -60),
  mul(action("pheromone"), -60),
  mul(action("wait"), -10)
);

const ordinaryTask = sum(
  -1,
  mul(moving, add(1, x("action"))),
  mul(action("acquire"), add(17, x("targetKind"))),
  all(
    action("acquire"),
    eq(x("task"), 36),
    gt(x("targetKind"), 0),
    gt(3, x("targetKind")),
    sub(20, x("targetKind"))
  ),
  mul(action("pickup"), 33),
  all(action("pickup"), x("localCache"), 4),
  mul(action("eat"), 34),
  mul(action("feed"), 35),
  mul(action("deposit"), 36),
  mul(action("claim"), 65),
  mul(action("propose"), 65),
  mul(action("lay-egg"), 81)
);

// A care load keeps its purpose through feeding, eating and collision avoidance.
const careLoad = all(eq(x("task"), 36), loaded, careNeeded, sub(1, action("deposit")));
// After a soil trip, collect food before accepting another hauling trip. This private
// commitment prevents a spoil backlog from recruiting every worker indefinitely.
const foodAfterSoil = all(eq(x("task"), 91), empty, sub(1, action("pickup")), sub(1, x("spoil")));
const haulFinished = all(action("deposit-spoil"), x("spoil"));
export const TASK = sum(
  all(
    sub(1, haulFinished),
    sub(1, foodAfterSoil),
    sum(mul(sub(1, careLoad), ordinaryTask), mul(careLoad, 36))
  ),
  mul(sum(haulFinished, foodAfterSoil), 91)
);

export function seedLinearGenome(): LinearGenome {
  return validateLinearGenome({
    version: 1,
    // No input has index -1: this folds constants without specializing any observation.
    instructions: [...compile(specialize(SCORE, -1, 0), 0), ...compile(specialize(TASK, -1, 0), 1)],
  });
}
