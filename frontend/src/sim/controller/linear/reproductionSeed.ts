import { F } from "../../colony/observation";
import { REQUESTS } from "../../colony/contract";
import { all, eq, gt, input, mul, sub, sum } from "./expression";

const x = (name: keyof typeof F) => input(F[name]);
const action = (kind: (typeof REQUESTS)[number]) => eq(x("action"), REQUESTS.indexOf(kind));
const no = (name: keyof typeof F) => sub(1, x(name));
const moving = all(gt(x("action"), 0), gt(5, x("action")));
const hungry = gt(0.9, x("energy"));
const depleted = gt(0.6, x("energy"));
const routeActive = all(x("routeReady"), gt(x("routeRemaining"), 0));

/** A branch in the shared seed, conditioned on reproductive physiology rather than task labels. */
export const REPRODUCTION_SCORE = sum(
  all(action("lay-egg"), -500),
  all(
    x("fertile"),
    sum(
      all(
        action("lay-egg"),
        x("eggReady"),
        x("laySite"),
        no("bodyCarried"),
        x("localBacked"),
        no("localOutdoor"),
        1200
      ),
      all(action("eat"), hungry, gt(sum(x("cargo"), x("edible"), x("foodHere")), 0), 350),
      all(action("pickup"), hungry, eq(x("cargo"), 0), gt(x("food"), 0), 250),
      all(
        action("acquire"),
        no("bodyCarried"),
        no("targetFailed"),
        sub(1, routeActive),
        gt(x("targetDistance"), 2),
        sum(
          all(
            hungry,
            gt(sum(depleted, x("targetBacked")), 0),
            gt(x("targetQuantity"), 0.25),
            gt(sum(eq(x("targetKind"), 3), eq(x("targetKind"), 4)), 0),
            sum(300, mul(50, x("targetBacked")), mul(-1, x("targetDistance")))
          ),
          all(
            eq(x("targetKind"), 2),
            no("inside"),
            sub(1, depleted),
            sum(220, mul(-0.5, x("targetDistance")))
          ),
          all(
            eq(x("targetKind"), 6),
            eq(x("siteSolid"), 0),
            x("siteFloor"),
            x("siteBacked"),
            no("siteOccupied"),
            eq(x("siteFood"), 0),
            x("siteHeadroom"),
            eq(x("siteOutdoorNeighbors"), 0),
            gt(sum(x("eggReady"), no("inside"), gt(x("bodyDiscomfort"), 2)), 0),
            no("routeReady"),
            sum(120, mul(-2, x("siteDistance")))
          )
        )
      ),
      all(action("wait"), 35),
      all(moving, -40),
      all(
        moving,
        no("bodyCarried"),
        x("open"),
        sub(1, routeActive),
        gt(x("bodyDiscomfort"), 2),
        gt(x("bodyDiscomfort"), x("contactDiscomfort")),
        150
      ),
      all(
        moving,
        no("bodyCarried"),
        x("open"),
        x("eggReady"),
        no("routeReady"),
        x("localFloor"),
        x("localBacked"),
        no("localOutdoor"),
        90
      ),
      all(action("forward"), routeActive, no("bodyCarried"), 45),
      all(
        action("discard"),
        x("routeReady"),
        gt(sum(eq(x("routeRemaining"), 0), eq(x("lastResult"), 1)), 0),
        180
      )
    )
  )
);
