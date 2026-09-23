# Class-specific material coupling

September 23, 2026. **Design approved by the user. C0–C2 implemented; C3 results below.**
The selected direction and its evidence are recorded in
[decisions and evidence](../design/decisions-and-evidence.md#class-specific-material-coupling).
Composed runtime laws are updated only when each phase lands.

## Outcome and boundary

V39 put dissolved material, reservoirs and cells on one attraction/repulsion/pressure balance
tuned for dissolved material. The watched v40 world lost both structures the simulation needs:
reservoir regions dispersed to a random layout, and cells spread toward an even distribution
with no mechanism to hold a contacting group still. This plan restores the dynamics the
simplification was meant to retain while keeping its reduction in competing terms.

Each class keeps the shared chemical feature field and gradient response (attraction through
`K_ℓ·A`, ℓ = 6; signed repulsion through B). Coupling to that response, and each class's
mobility, become explicit per class:

| Class | Couplings | Scalars |
| --- | --- | --- |
| Dissolved material | attraction, repulsion, crowding pressure | field drift, χ (unchanged) |
| Reservoirs | short-range cohesion via attraction; long-range pairwise like-charge repulsion; circle exclusion | `drift_r`, L, γ |
| Cells | attraction, repulsion, circle exclusion, compatibility-weighted adhesion | cell drift (0.25), `k_a` |

No persistent attribute encodes initial conditions: no anchors, home positions or region labels.
Reservoir arrangement follows current positions, compositions and field. Crowding pressure
leaves reservoirs and cells. Physical checkpoint v41 starts new worlds; no migration.

Preserve the chemical algebra, discrete chemicals, funded capabilities, material/work accounts,
controller inputs, data ownership and regional execution. Adhesion credits no work. Excluded:
inertia or orbital motion, viscosity and reservoir duty-cycle changes, terrain and climate,
new senses, and any cluster-count or colony-arrangement target.

## Phases

### C0 — Reservoir coupling

Replace reservoir crowding pressure with the three reservoir couplings. Cohesion keeps the
shared attraction sample at the reservoir footprint, so released material and cell deposits
still displace reservoirs. Long-range repulsion is a pairwise sum between nonempty reservoirs
within range L through a neighbour grid, proportional to the product of their exposed-inventory
signed repulsion properties: like signs repel, opposite signs attract. Empty reservoirs carry
no charge and do not move. Circle exclusion reuses the contact law at reservoir radius.
`drift_r` replaces `sourceDrift`.

Checks with actual current reservoir compositions:
1. Two reservoirs 12 units apart close to contact and hold; a mismatched pair separates.
2. Thirty reservoirs seeded randomly in a 60-unit box form several separated groups of similar
   size, neither one blob nor a scatter.
3. At fixed L, cluster size responds to γ; relabeling positions or chemistry gives the same
   statistics (no dependence on initial placement).
4. A passing stream of cells changes reservoir positions only through material it moves.

Record the chosen `drift_r`, L and γ with units and the fixture results. If current compositions
mostly carry one sign, report that chemistry finding before continuing.

**C0 result.** Live reservoir compositions (ticks 98k and 725k) have same-sign attraction
property a for essentially all pairs and positive signed-repulsion b for 88–100%. This is the
nucleus case the design wants (like-charge repulsion held by cohesion), so the sign check
passed rather than stopped. Measured with `examples/reservoir_clusters GAMMA RANGE DRIFT
STEPS [SEED]` on default 0/136 mixtures (a ≈ −0.51, b ≈ 0.49), exposed inventory at half
interface saturation, and no release:

- **Pair spacing.** The shared response alone gives a matched pair local like-b repulsion
  below about 11 units and ℓ-range cohesion from 12 to 20. The pair settles at 11.6–12.1 units.
- **Repulsion strength.** At γ ≤ 3 a group of 30 settles into one lattice. At γ ≥ 100 it scatters.
- **Selected defaults.** γ = 20, L = 30 (units: model length) and `drift_r` = 1. After 64k
  steps, 30 reservoirs placed at random in a 60-unit box form 12, 13 and 12 groups (15-unit
  linkage) for seeds 1–3, with largest groups of 5, 5 and 4 and 4–6 singletons. The size
  distribution does not depend on initial placement.
- **Mobility.** `drift_r` only rescales time: drift 4 reproduces drift 1's trajectory 4× faster.
- **Opposite charges.** An opposite-charge pair (species 255 against the 0/136 mixture)
  binds at contact instead of separating. This follows the charge analogy; the plan text
  predicted separation, which was wrong.

Unit tests cover reciprocal like-repel and opposite-attract behaviour, the 3L cutoff, charge-free
empty reservoirs that still exclude, invariance across the periodic seam, independence from
pressure, and a matched pair holding at 10.5–13.5 units.

### C1 — Cell coupling

Remove medium crowding pressure from cell motion; circle exclusion and medium mobility remain.
Add adhesion over existing contact pairs: damp each pair's relative velocity by `k_a × c_ij`,
where `c_ij` is the existing membrane compatibility, in the region-owned contact stage.

Checks: twenty compatible cells with random swim effort reach interior relative motion below
10% of a free cell's; an incompatible pair separates; motor spend with adhesion is at least the
spend without; material/energy residuals and observer read-only guards are unchanged.

**C1 result.** There is no stored pairwise membrane compatibility, so `c_ij = clamp(a_i a_j −
b_i b_j, 0, 1)` is derived from installed membrane profiles by the shared product rule.
Adhesion (default 4) blends intended displacements over four Jacobi passes between the
displacement computation and its application, in both the live World step and the
standalone movement path.

- **Lattice fixture.** On a 20-cell triangular contact lattice at c = 0.35, interior relative
  motion falls from 0.0551 to 0.0011. Incompatible profiles leave motion unchanged, and no
  blended displacement exceeds the largest paid one.
- **Founders.** 708 of 1,128 seed27 founder pairs (63%) have positive compatibility, varying
  by membrane type.
- **Mature v40 population.** Tick 725k, which evolved without adhesion, has only 7% positive
  pairs: membranes there have b between 0.66 and 0.88. Whether sticky membranes are selected
  is a C3 question.

**C2 result.** Physical v41 bumps the version constants, test expectations, harness schema
list, frontend type and settings. It also restricts the unused finite-owner self-load helper to
test builds and updates the source-binding diagnostic to the pressure-free reservoir law.
`make ci` passes (304 library, 13 server, 17 integration and 79 Vitest tests), and clippy is
clean on Rust 1.98.1.

Native `parallel_capacity` on the default world with a 2,000-cell load, v40 → v41:

| Workers | Run 1 ticks/s | Run 2 ticks/s |
| --- | ---: | ---: |
| 1 | 53.6 → 54.0 | 53.9 → 54.1 |
| 4 | 150.1 → 150.5 | 149.6 → 150.8 |

The reservoir pair sum and adhesion blend have no measurable cost in this workload.

### C2 — Integration and v41

Dissolved-material behavior is unchanged; confirm with existing binding tests. Bump the physical
version, update configuration validation, composed runtime laws, AGENTS runtime summary and
the watch tooling's reservoir measures. Run `make ci` and the registered native timing fixtures.

### C3 — Paired run

Seed 27, current v40 laws against v41, 150k ticks each, same start, scored with the existing
watch package: reservoir nearest-neighbour distance and Morisita, cell pair correlation, dense,
patch and diffuse shares, tight-cluster and superorganism shares, illumination and chemical-web
measures. The fixtures establish opportunity; the run shows whether it is used. No seed sweep or
horizon extension. Human motion review of the deployed world remains the motion gate.

**C3 result.** Seed27, one run per version, 150k ticks, 3 threads each; scored every 30k ticks
with the watch package. Groups link reservoirs within 15 units:

| Tick | v40 groups / largest | v41 groups / largest | v40 / v41 reservoir Morisita |
| --- | --- | --- | --- |
| 30k | 54 / 34, 25, 20 | 36 / 27, 24, 20 | 5.16 / 5.08 |
| 90k | 74 / 29, 28, 13 | 42 / 27, 23, 19 | 4.45 / 4.37 |
| 150k | 123 / 10, 10, 8 | 76 / 24, 19, 16 | 2.89 / 3.48 |

- **Reservoir layout.** V41 retains large regional groups where v40 fragments them. It is not
  yet stationary: v41 mean nearest-neighbour distance rose 10.2 → 12.7, against 11.2 → 13.5 for
  v40 and about 20 for a random layout.
- **Cell contact.** 22–26% of v41 cells were in contact at most checkpoints, against 9–14% in v40.
- **Superorganisms.** V41 reached 1.8% at 30k and none later. Positive-compatibility membrane
  pairs fell 62% → 28.5% as median b rose 0.34 → 0.82, so adhesion was not selected in this run.
- **Population.** V41 ended at 2,937 cells against 475 for v40. Empty 32-unit quadrats: 38%,
  against 0.1% expected at random.

The user set superorganisms aside; this plan targets diffusion and density. V41 is deployed to
the server world for continued observation.
