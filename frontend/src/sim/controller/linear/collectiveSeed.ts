import { F } from "../../colony/observation";
import { REQUESTS } from "../../colony/contract";
import { all, eq, gt, input, mul, sub, sum } from "./expression";

const x = (name: keyof typeof F) => input(F[name]);
const a = (kind: (typeof REQUESTS)[number]) => eq(x("action"), REQUESTS.indexOf(kind));
const no = (name: keyof typeof F) => sub(1, x(name));
const spare = all(eq(x("cargo"), 0), no("carryingQueen"), no("carryingBrood"), no("workOwner"));
const digging = all(x("hasFocus"), no("spoil"));
const move = all(gt(x("action"), 0), gt(5, x("action")));
const ready = all(x("routeReady"), gt(x("routeRemaining"), 0));
// Mutable seed preferences for nursery floor and traffic clearance, not kernel excavation targets.
const localFront = all(
  gt(10, x("contactFocusX")),
  gt(x("focusHeightDelta"), -1),
  gt(4, x("focusHeightDelta")),
  gt(sum(gt(1, x("focusHeightDelta")), x("localOpenBelow")), 0),
  x("diggable"),
  x("localBacked"),
  no("localSupportingBody"),
  no("localOutdoor"),
  gt(x("contactEntranceDepth"), 3)
);
const knownFront = all(
  gt(10, x("siteFocusX")),
  gt(x("siteFocusY"), -1),
  gt(4, x("siteFocusY")),
  gt(sum(gt(1, x("siteFocusY")), x("siteOpenBelow")), 0),
  gt(x("siteWork"), 0),
  gt(10, x("siteWork")),
  x("siteBacked"),
  no("siteSupportingBody"),
  no("siteOccupied"),
  eq(x("siteOutdoorNeighbors"), 0)
);

export const COLLECTIVE_SCORE = all(
  x("collective"),
  sum(
    all(a("propose"), eq(x("proposalKind"), 1), -1000),
    all(
      a("deposit-spoil"),
      no("workOwner"),
      gt(sum(x("localBacked"), gt(9, x("entranceDistance")), no("contactBelowBacked")), 0),
      -1000
    ),
    all(
      spare,
      -1000,
      sum(
        all(
          x("hasFocus"),
          sum(
            a("propose"),
            a("pickup"),
            all(a("acquire"), no("spoil"), sub(1, eq(x("targetKind"), 6)))
          )
        ),
        all(
          x("spoil"),
          sum(
            a("pickup"),
            all(a("acquire"), sub(1, sum(eq(x("targetKind"), 0), eq(x("targetKind"), 6)))),
            all(a("forward"), sub(1, sum(eq(x("routeKind"), 0), eq(x("routeKind"), 6))))
          )
        )
      )
    ),
    all(
      a("forget-site"),
      x("hasFocus"),
      sum(
        -200,
        all(1000, gt(0.5, x("energy"))),
        all(1000, gt(sum(x("cargo"), x("workOwner")), 0)),
        all(1000, gt(x("focusOpen"), 71)),
        all(1000, gt(x("focusAge"), 6000))
      )
    ),
    all(
      spare,
      gt(x("energy"), 0.5),
      sum(
        all(
          a("remember-site"),
          no("hasFocus"),
          no("spoil"),
          x("inside"),
          gt(x("entranceDepth"), 6),
          gt(sum(x("areaBrood"), all(gt(x("workSignal"), 0.01), gt(x("areaWorkers"), 0))), 0),
          x("diggable"),
          x("localFloor"),
          x("nearFloor"),
          x("localBacked"),
          no("localSupportingBody"),
          no("localOutdoor"),
          gt(10, x("localWork")),
          400
        ),
        all(a("pheromone-b"), digging, gt(20, x("focusDistance")), x("workPulse"), 650),
        all(
          a("dig"),
          digging,
          localFront,
          sum(600, mul(-4, x("contactFocusX")), mul(-8, x("focusHeightDelta")))
        ),
        all(
          a("acquire"),
          digging,
          knownFront,
          gt(x("targetDistance"), 1),
          no("targetFailed"),
          sub(1, ready),
          sum(450, mul(-3, x("targetDistance")), mul(-4, x("siteFocusX")), mul(-8, x("siteFocusY")))
        ),
        all(a("forward"), digging, eq(x("routeKind"), 6), ready, 420),
        all(a("drop-spoil"), x("hasFocus"), x("spoil"), x("canDrop"), 700),
        // If local piles fill, carry the load out and return with the worksite still remembered.
        all(
          a("acquire"),
          x("spoil"),
          x("inside"),
          eq(x("targetKind"), 0),
          gt(x("targetDistance"), 2),
          sub(1, all(eq(x("routeKind"), 0), ready)),
          550
        ),
        all(a("forward"), x("spoil"), x("inside"), eq(x("routeKind"), 0), ready, 520),
        all(
          a("acquire"),
          x("spoil"),
          no("inside"),
          eq(x("targetKind"), 6),
          no("siteBacked"),
          x("siteBelowBacked"),
          eq(x("siteSolid"), 0),
          x("siteFloor"),
          no("siteOccupied"),
          eq(x("siteFood"), 0),
          gt(x("siteEntranceDistance"), 11),
          no("targetFailed"),
          sub(1, all(eq(x("routeKind"), 6), ready)),
          sum(800, mul(-2, x("targetDistance")))
        ),
        all(a("forward"), x("spoil"), no("inside"), eq(x("routeKind"), 6), ready, 650),
        all(
          a("recover-spoil"),
          no("hasFocus"),
          no("spoil"),
          sub(1, eq(x("task"), 91)),
          gt(x("localLoose"), 0),
          550
        ),
        all(a("deposit-spoil"), x("spoil"), no("inside"), x("spoilSite"), 650),
        all(move, x("spoil"), no("inside"), x("open"), gt(x("outwardStep"), 0), 600),
        all(a("down"), x("spoil"), no("inside"), x("open"), gt(x("entranceDistance"), 8), 620),
        all(
          move,
          no("hasFocus"),
          no("spoil"),
          no("routeReady"),
          x("inside"),
          x("open"),
          gt(x("signalStep"), 0.0001),
          sum(80, mul(20, x("signalStep")))
        )
      )
    )
  )
);
