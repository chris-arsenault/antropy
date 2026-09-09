import { F } from "../../colony/observation";
import { REQUESTS } from "../../colony/contract";
import { all, eq, gt, input, mul, sub, sum } from "./expression";

const x = (name: keyof typeof F) => input(F[name]);
const a = (kind: (typeof REQUESTS)[number]) => eq(x("action"), REQUESTS.indexOf(kind));
const viableRoute = all(
  eq(x("routeKind"), 4),
  gt(x("routeFoodQuantity"), 0.25),
  x("routeReady"),
  gt(x("routeRemaining"), 0)
);
const quantity = sub(
  x("targetQuantity"),
  all(gt(x("targetQuantity"), 4), sub(x("targetQuantity"), 4))
);

/** Fallible shared depletion, local competition and private individual preference. */
export const FORAGING_SCORE = sum(
  all(
    eq(x("cargo"), 0),
    sub(1, x("inside")),
    a("acquire"),
    eq(x("targetKind"), 4),
    gt(x("targetQuantity"), 0.25),
    sum(
      mul(6, quantity),
      mul(10, x("targetAffinity")),
      mul(-0.15, x("targetDistance")),
      mul(-16, x("targetCrowding")),
      mul(-100, viableRoute)
    )
  ),
  all(
    eq(x("cargo"), 0),
    a("forward"),
    eq(x("routeKind"), 4),
    sub(1, gt(x("routeFoodQuantity"), 0.25)),
    -200
  )
);
