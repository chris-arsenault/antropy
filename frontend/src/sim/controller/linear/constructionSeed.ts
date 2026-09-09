import { F } from "../../colony/observation";
import { REQUESTS } from "../../colony/contract";
import { all, eq, gt, input, mul, sub, sum, type Expression } from "./expression";

const x = (name: keyof typeof F) => input(F[name]);
const a = (kind: (typeof REQUESTS)[number]) => eq(x("action"), REQUESTS.indexOf(kind));
const kind = (value: number) => eq(x("workKind"), value);
const no = (value: Expression) => sub(1, value);
const empty = eq(x("cargo"), 0),
  loaded = gt(x("cargo"), 0);
const spare = all(empty, no(x("spoil")), no(x("carryingQueen")), no(x("carryingBrood")));

function desiredRole(): Expression {
  return sum(
    mul(kind(1), sum(mul(x("spoil"), 2), mul(no(x("spoil")), sum(1, mul(x("sourceExists"), 2))))),
    mul(kind(2), sum(x("carryingQueen"), mul(no(x("carryingQueen")), 3))),
    kind(3),
    mul(kind(4), sum(no(x("siteExists")), mul(x("siteExists"), sum(loaded, mul(empty, 3))))),
    mul(kind(5), sum(x("carryingBrood"), mul(no(x("carryingBrood")), 3)))
  );
}

function finished(): Expression {
  return all(
    spare,
    sum(
      all(kind(1), x("jobCleared")),
      all(kind(2), x("jobQueenPlaced")),
      all(kind(3), x("siteExists")),
      all(kind(4), x("siteExists"), no(x("sourceExists"))),
      all(kind(5), x("jobBroodPlaced"))
    )
  );
}

function physicalWork(): Expression {
  return sum(
    all(a("dig"), kind(1), spare, x("workSite"), x("diggable")),
    all(a("deposit-spoil"), x("spoil"), x("workDump"), x("spoilSite")),
    all(a("recover-spoil"), kind(1), spare, gt(x("localLoose"), 0)),
    all(a("attach-queen"), kind(2), spare, x("localQueen"), no(x("jobQueenPlaced"))),
    all(a("release-queen"), kind(2), x("carryingQueen"), x("workSite"), x("supportedSite")),
    all(
      a("attach-brood"),
      kind(5),
      spare,
      x("localBrood"),
      x("workSource"),
      no(x("jobBroodPlaced"))
    ),
    all(a("release-brood"), kind(5), x("carryingBrood"), x("workSite"), x("supportedSite")),
    all(
      a("create-cache"),
      gt(x("workKind"), 2),
      gt(5, x("workKind")),
      x("workSite"),
      no(x("siteExists")),
      x("supportedSite")
    ),
    all(a("pickup"), kind(4), x("siteExists"), empty, x("workSource"), gt(x("food"), 0)),
    all(a("deposit"), kind(4), loaded, x("workSite"), x("siteExists")),
    all(a("retire-cache"), kind(4), empty, x("siteExists"), x("sourceLocalEmpty")),
    all(a("finish"), finished())
  );
}

export const CONSTRUCTION_SCORE = sum(
  all(no(x("workOwner")), gt(x("action"), REQUESTS.indexOf("claim")), -60),
  all(a("claim"), sum(-200, all(400, x("workAvailable"), spare, gt(x("energy"), 0.5)))),
  all(
    x("workOwner"),
    sum(
      -250,
      mul(600, physicalWork()),
      all(
        450,
        a("acquire"),
        eq(x("targetRole"), desiredRole()),
        gt(x("targetDistance"), 1),
        no(x("targetFailed"))
      ),
      all(
        470,
        a("forward"),
        eq(x("routeRole"), desiredRole()),
        x("routeReady"),
        gt(x("routeRemaining"), 0),
        no(eq(x("lastResult"), 1))
      ),
      all(250, a("eat")),
      all(210, gt(x("action"), 0), gt(5, x("action")), x("open"))
    )
  ),
  all(no(x("workOwner")), a("deposit-spoil"), x("spoil"), x("spoilSite"), 350),
  all(no(x("workOwner")), a("release-queen"), x("carryingQueen"), x("supportedSite"), 350),
  all(no(x("workOwner")), a("release-brood"), x("carryingBrood"), x("supportedSite"), 350)
);
