# Sustained chamber excavation

The September 9 user rejection sets a concrete acceptance target: double the default nest's
connected underground area. The starting seed-101 nest has 148 open backed cells; the target is
at least 296, excavated through worker actions. Scattered cuts do not satisfy chamber construction.
Plan `77ed0fa2-d235-455c-b5af-9b9201bb9ec1` tracks implementation and the default measurement.

The previous policy released work after three locally free floor cells. Its two-row geometry,
256-tick commitment and moving brood pressure explain its ten-cell result. That result failed
chamber acceptance; population growth did not cure the construction mechanism.

## Controller mechanism

A worker encountering brood can commit to an adjacent floor edge as a private nursery worksite.
The commitment survives temporary local space relief, brood relocation and spoil transport.
Workers choose nearby legal cuts and routes to timestamped observed wall cells around that site.
They extend floor and then clear space above it. The seed prefers a broad nursery with clearance
for tending and passing above brood; dimensions and action priorities belong to the mutable common
programmed/LGP seed. There is no kernel room-carving operation, global crew assignment or remotely
selected excavation destination. The nest-area acceptance counter never enters observations.

The shared observation interface exposes remembered geometry relative to the ant's private site,
open cells below a candidate, and counts of observed open space and brood nearby. Unknown terrain
remains unknown. Ants explicitly emit pheromone B, drop or recover spoil, and pay for every cut,
move and placement. A worker may haul its own spoil when local piles fill, retaining its worksite.
Low reserves interrupt construction so the worker can eat and resume ordinary food work.

Hauling must approach supported ground after moving horizontally away from the entrance.
Manhattan distance alone rewards climbing and can strand a load above a disposal surface.
The seed retains task 91 after depositing soil until it collects food, alternating hauling
with food service rather than letting a backlog occupy every worker indefinitely. The kernel
does not interpret that task value. Nursery work starts below the entrance and preserves its
upper supporting surfaces; clearance at the throat is not nursery expansion.

Disposal routes use observed open floor at least twelve columns from the entrance. The ant
can place a load earlier when it encounters suitable ground outside the nine-column exclusion.
The observed backing below the deposit distinguishes original supported ground from the top of
an exposed spoil column. The seed spreads loads along that ground instead of stacking an exit
obstruction. These preferences govern the seed; the physical resolver still allows other policies
to stack material. The LGP seed remains ordinary bounded VM instructions; its capacity is now
8,192 instructions and the current common policy occupies 4,232.

## Acceptance

Measure the exact default tick-zero world headlessly. Report connected area, contiguous new
excavation geometry, nursery use, living queen/workers, food/care and the physical spoil balance.
Show the area change in the default stats panel. Do not shrink the initial nest, supply extra
founders, pre-carve chambers, or claim success from cumulative excavation that was filled again.
Do not run a browser assay. Human motion review follows a measured doubling, not another tiny-cut
handoff. Required CI and bounded mechanics/parity checks remain separate from this behavior result.

## Development evidence

Run 2811 excavates 187 cells by tick 4,000: the underground opening grows from 148 to 335 cells.
The grid contains broad connected rooms. However, 102 material units remain unplaced, almost
every worker holds spoil, food service declines and upper excavation removes exit grip surfaces.
This is failed integrated behavior despite meeting the area number. The queen is alive with
reserve 12.76 and fifteen workers remain. This run predates the persisted area denominator.

The following hauling-continuity trial reaches 213 cells by tick 2,000 and remains at 213 at
tick 3,000. Food acquisition stalls at 21–22 pickups. It was deliberately terminated after
identifying the missing ground-approach branch rather than running the remaining requested
horizon. Its console observations are not a completed ledger result. The corrected assay saves
periodic checkpoints so blocked work can be inspected before another full horizon is spent.

Run 2812 reaches 267 cells but its direct hauling branch oscillates at terrain steps. Run 2813
uses observed disposal routes and reaches 242 cells, but Manhattan-distance disposal permits
columns near the entrance. Queen feeding stops late in both runs. Their checkpoints establish
the obstruction and local attempted actions; neither run is accepted. The next correction uses
horizontal entrance clearance and observed original ground below the disposal site.

## Default doubling result

The spread-disposal default reaches **298 connected underground cells from 148 at tick 4,000**,
a net increase of 150 cells and a 2.014 area ratio. The initial map, eight founders, food supply,
reproduction costs and rates remain unchanged. All 150 new cells are actual worker excavations;
110 material units have been placed outside, 32 remain in loose piles and eight are carried.
The complete material count is conserved. The openings form broad connected chambers, including
a four-cell-high upper nursery below the preserved entrance and a larger lower chamber complex.
There are 25 new supported floor cells and eight uncarried brood occupy new floor at this sample.

The colony has twenty workers, fourteen births, two founder age deaths and twenty-three developing
brood. The queen is at (1019,298) with reserve 23.72/24. Queen feeding totals 77.81 energy and
larval feeding totals 162.90; both continue in the last sampled interval. There are no starvation
or brood deaths. Twenty-two larvae still need investment and stored food is zero; this is a
construction demonstration, not a claim of surplus reserves or 2,000-worker capacity.

The default stats show connected area, starting area and their ratio. Checkpoint v19 retains the
original denominator. Reloading starts the programmed seed-101 world paused at tick zero; Run is
the only required control. Completed ledger run **2814** is under
`frontend/harness/artifacts/chamber-doubling-2026-09-09/spread-disposal/`.
Human motion review remains with the user; no browser assay was run.

The same run finishes at tick 6,000 with **324 cells (2.189×)**, 176 excavations by seven workers,
137 soil units placed outside, 35 loose units and four carried units. The trace records 136 new
cells traversed and 21 used by brood during the run; 27 new cells remain supported floor at the
endpoint. `nest-section.txt` projects the exact initial and excavated grid, while `behavior.json`
retains the spatial frames and action history. The 148th excavation occurs at tick 3,982.

The endpoint has 34 workers, 29 births, three founder age deaths, two brood deaths and nineteen
developing brood. The queen is at (1020,294), reserve 23.56/24; queen and larval feeding total
105.72 and 272.07 energy. Stored food is 2.85. Feeding continues through the last interval, but
eighteen larvae still need investment and laying currently waits for adjacent space. Route churn
and throughput at larger populations remain later work, not certified by chamber doubling.

Full CI passes 242 tests in 65 files, lint, formatting, typechecking, docs and Terraform formatting.
The existing optional-property lint warning remains. Bounded cases exercise programmed/LGP
construction and hauling, preserved post-haul task memory, area counting and checkpoint persistence.
The long default run is programmed only; it is not a new full-horizon LGP comparison.
