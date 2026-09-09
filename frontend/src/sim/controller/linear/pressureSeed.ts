import { F } from "../../colony/observation";
import { REQUESTS } from "../../colony/contract";
import { all, eq, gt, input, mul, sub, sum, type Expression } from "./expression";

const x = (name: keyof typeof F) => input(F[name]);
const action = (kind: (typeof REQUESTS)[number]) => eq(x("action"), REQUESTS.indexOf(kind));
const kind = (value: number) => eq(x("proposalKind"), value);
const no = (value: Expression) => sub(1, value);
const positive = (value: Expression) => all(gt(value, 0), value);
const excess = (temperature: Expression) =>
  sum(positive(sub(18, temperature)), positive(sub(temperature, 28)));
const comfort = (temperature: Expression, moisture: Expression) =>
  sum(excess(temperature), mul(8, positive(sub(0.45, moisture))));
const gain = sub(
  comfort(x("sourceTemperature"), x("sourceMoisture")),
  comfort(x("siteTemperature"), x("siteMoisture"))
);
const openSite = all(
  eq(x("siteSolid"), 0),
  x("siteBacked"),
  x("siteFloor"),
  no(x("siteOccupied")),
  eq(x("siteFood"), 0),
  x("siteHeadroom"),
  gt(x("siteFloorNeighbors"), 0),
  eq(x("siteOutdoorNeighbors"), 0)
);
const nurseryPressure = all(gt(2, x("nurseryFree")), gt(x("nurseryBrood"), 0));

const storagePressure = gt(x("storageFill"), 0.7);
const storageArea = all(
  x("siteStorageFloor"),
  gt(4, x("siteCacheDistance")),
  gt(x("siteQueenDistance"), 3)
);
// Solid temperature does not predict the climate after opening a cell.
// Extend occupied floor and then clear its headroom; both still require hauling each soil cell.
const floorExtension = all(
  x("siteFloor"),
  gt(x("siteFloorNeighbors"), 0),
  gt(sum(x("siteHeadroom"), all(gt(x("siteUpperWork"), 0), gt(10, x("siteUpperWork")))), 0)
);

function digging(): Expression {
  return all(
    kind(1),
    x("excavationEnabled"),
    gt(sum(floorExtension, x("siteFloorBelow")), 0),
    x("siteBacked"),
    eq(x("siteOutdoorNeighbors"), 0),
    no(x("siteOccupied")),
    no(x("siteSupportingBody")),
    gt(x("siteWork"), 0),
    gt(10, x("siteWork")),
    no(x("sameDump")),
    no(x("dumpBacked")),
    gt(x("dumpQueenDistance"), 6),
    gt(4, x("dumpTraffic")),
    gt(
      sum(
        all(nurseryPressure, x("siteQueenFloor"), gt(5, x("siteQueenDistance"))),
        all(storagePressure, gt(1, x("storageFree")), storageArea),
        all(gt(x("siteTraffic"), 5), gt(12, x("siteQueenDistance")))
      ),
      0
    )
  );
}

function relocation(): Expression {
  const knownSource = all(gt(512, x("sourceAge")), gt(x("sourceDistance"), 0));
  const queen = all(kind(2), knownSource, gt(gain, sum(2, mul(0.05, x("sourceDistance")))));
  const brood = all(
    kind(5),
    knownSource,
    gt(
      sum(
        gt(gain, 2),
        all(
          nurseryPressure,
          gt(4, x("sourceQueenDistance")),
          gt(x("siteQueenDistance"), 3),
          gt(16, x("siteQueenDistance"))
        )
      ),
      0
    )
  );
  const preservation = (temperature: Expression, moisture: Expression) =>
    all(positive(sub(temperature, 10)), 0.05, positive(sub(moisture, 0.4)));
  const storage = all(
    kind(4),
    knownSource,
    gt(x("sourceFood"), 0.5),
    gt(
      sub(
        preservation(x("sourceTemperature"), x("sourceMoisture")),
        preservation(x("siteTemperature"), x("siteMoisture"))
      ),
      sum(0.1, mul(0.025, x("sourceDistance")))
    ),
    gt(30, x("siteTemperature"))
  );
  return all(openSite, sum(queen, brood, storage));
}

export const PRESSURE_SCORE = sum(
  all(
    action("propose"),
    sum(
      -500,
      all(
        900,
        x("autonomous"),
        x("knownSite"),
        no(x("workOwner")),
        eq(x("cargo"), 0),
        no(x("spoil")),
        no(x("carryingQueen")),
        no(x("carryingBrood")),
        gt(x("energy"), 0.6),
        no(x("siteReserved")),
        no(x("recentRelocation")),
        gt(sum(digging(), relocation(), all(kind(3), openSite, storagePressure, storageArea)), 0)
      ),
      mul(-2, x("siteDistance")),
      all(kind(3), mul(-4, x("siteCacheDistance"))),
      all(kind(5), mul(18, x("siteBroodNeighbors"))),
      mul(-2, x("sourceDistance")),
      mul(-0.5, x("dumpDistance")),
      mul(-4, x("siteWork")),
      mul(-10, excess(x("siteTemperature")))
    )
  ),
  all(
    action("abandon"),
    sum(-400, all(1100, x("workOwner"), gt(sum(gt(x("jobAge"), 512), gt(0.3, x("energy"))), 0)))
  ),
  all(
    x("autonomous"),
    action("acquire"),
    gt(x("targetKind"), 0),
    gt(3, x("targetKind")),
    gt(x("cargo"), 0),
    gt(x("targetQuantity"), sum(0.1, mul(0.4, eq(x("targetKind"), 1)))),
    gt(512, x("targetAge")),
    gt(x("targetDistance"), 2),
    no(x("targetFailed")),
    no(
      all(gt(x("routeKind"), 0), gt(3, x("routeKind")), x("routeReady"), gt(x("routeRemaining"), 0))
    ),
    sum(170, mul(5, x("targetQuantity")), mul(-0.5, x("targetDistance")))
  ),
  all(
    x("autonomous"),
    no(x("workOwner")),
    action("acquire"),
    eq(x("cargo"), 0),
    eq(x("targetKind"), 3),
    x("inside"),
    gt(x("targetQuantity"), 0.5),
    gt(x("knownCareNeed"), 0.5),
    no(all(eq(x("routeKind"), 3), x("routeReady"), gt(x("routeRemaining"), 0))),
    no(x("targetFailed")),
    gt(x("targetDistance"), 2),
    sum(170, mul(-0.5, x("targetDistance")))
  ),
  all(
    x("autonomous"),
    gt(x("cargo"), 0),
    no(x("workOwner")),
    action("acquire"),
    gt(3, x("targetKind")),
    gt(x("targetKind"), 0),
    gt(x("targetAge"), 256),
    x("inside"),
    gt(16, x("targetDistance")),
    no(all(x("routeReady"), gt(x("routeRemaining"), 0))),
    no(x("targetFailed")),
    gt(x("targetDistance"), 2),
    240
  )
);
