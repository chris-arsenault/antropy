# Digital chemistry implementation decisions

> Historical first TypeScript chemistry implementation (v9). Its measurements and decisions
> remain evidence for that version. The [Rust/WASM numerical contract](numerical-engine.md),
> [current results](numerical-results.md) and [migration dispositions](numerical-migration.md)
> supersede its runtime choices and unfinished work order.


September 13, 2026; milestone 1 of the implementation plan. These decisions resolve the draft's
open choices. They describe an abstract physical chemistry, not empirical molecular constants.

The initial genome has four receptors, four transporters and four enzymes. Enzymes operate
constitutively from their actual installed stock and substrate, as in the supplied specification.
No per-enzyme neural channel or additional catalytic work fee is added. Reaction inefficiency
accounts irreversible heat; installed machinery pays construction, volume and maintenance costs.
Isoenergetic conversion captures no energy. Transport is explicitly energy-funded and independently
controllable per slot, so cells can stop importing or exporting without changing their genomes.

Chemical coordinates reflect at 0 and 15. Affinity is Gaussian with initial width 1.75 coordinate
units, shared by receptors, transporters, enzymes and membrane compatibility. Physical surfaces
use sixteen low-frequency cosine products. Small deterministic coefficient perturbations preserve
broad gradients; inverse diffusion/impedance surfaces deliberately provide high-impedance,
low-diffusion neighborhoods. This is a physical correlation, not a matrix species category.

Potential spans 0.5–8 energy per material unit, diffusivity 0.005–0.5 world units squared per model
second, impedance 0–12 per concentration and stress 0–1. Stress varies through a two-axis surface.
The initial generator requires at least eight species in each declared low/high or joint-coverage
category. It rejects invalid tables rather than searching organism outcomes. Coefficients, the
resolved table and generator version are persisted together and checked for agreement.
The configuration has a separate chemistry seed (initially 101). Geography/organism seeds may
change without reinterpreting a saved organism's chemical alleles. Changing the chemistry seed
explicitly generates a new physical chemical world. Assay replications retain their chemical
definition while varying placement and other random draws.

Downhill conversion captures 80% of the potential drop; uphill conversion pays the potential rise
divided by 0.8. Generic biomass has the potential of the generated species nearest potential 2.
Every internal species can become biomass: assembly pays 0.5 work per material unit plus any
uphill potential gap divided by 0.8. Excess input potential becomes heat, not usable energy.
Death releases internal species unchanged and converts built matter to that decomposition species
immediately. This explicit coarse conversion avoids a separate detritus implementation, preserves
body energy exactly and does not require cells to import a special construction ingredient.

Environmental impedance uses movement fraction `1/(1+0.5*load^2)` and diffusion fraction
`1/(1+load)`. One effective drag must govern motor capacities and Brownian rotation. Uniform
extracellular washout initially uses 0.0005 per model second (half-life approximately 1,386 seconds).
Membrane susceptibility has a 0.05 residual and approaches one away from its affinity region.
Exposure includes external chemistry and internal concentration: storing or synthesizing a harmful
compound does not bypass compatibility. These rates and ranges remain subject to the registered
physical opportunity probes; they are not an evolved-ecology result.

## Bounded validation

Before execution, the numerical panel was fixed to seeds 101, 7, 19, 202, 303, 0, -1 and
2147483647, all 256 identity encodings, edge/corner product offsets, every potential pair in seed
101, and the biomass/decomposition energy identity. It also checks repeat generation, coefficient
corruption rejection, bounded response functions and analytical first-order washout composition.
Numerical and lifecycle checks pass independently of ecological assays. A failed nutrition probe
motivated revising the stress surface; the rejected product surface and accepted additive surface
are recorded in [validation](validation.md). No evolution run or seed search selected a world.
Neighbor steps are below 0.15 of each property's range
(log range for diffusion) across the eight declared seeds. At width
1.75, the effective species count is 38.48 at the center and 12.51 at a corner. This width gives
substantial overlap while retaining spatial differentiation within chemical space; corner
truncation is intentional, because chemical coordinates do not wrap. There are 77 affinity-weighted
high-impedance/low-diffusion neighborhoods in seed 101. Thresholds are physical coverage checks,
not population performance gates.

The property atlas command writes local generated JSON and SVG without advancing the simulation.
Its report is an inspection of the implemented surfaces, not a proof of affordable metabolism,
barrier persistence or useful signaling. Those are measured in milestone 3 using the same engine.

## Complete-cycle implementation

The selected neural interface is 39 inputs, 24 recurrent units and nine outputs. Inputs contain
four receptor readings each (level, temporal change, forward difference and left difference),
twelve installed machinery fractions, usable energy, growth, four contact directions, private
task byte, motor/storage capacity, inventory fill and injury. Outputs choose swim, turn, repair,
private-byte candidate/commit and four transporter efforts. Enzymes remain constitutive.
Eleven plasticity loci include modulation by all four receptor changes and usable-energy change.

All twelve chemical machinery slots have separate built stocks in a fifteen-stock body. The
other stocks are core, motor and storage. Non-core construction targets use a nonnegative squared
investment response that allows a zero target and mutation back out of zero. A changed slot at
birth or optional contact transfer recycles that slot's inherited installed material locally.
The new allele must be expressed by paid ordinary construction. Unchanged stocks partition
normally. Contact transfer copies the whole typed allele and its investment locus and records
donor organism/genotype, slot and recipient genotype before/after. Membrane coordinates describe
the body's compatibility directly; no independently interchangeable membrane machinery is added.

Chemical requests use shared pre-transfer supply and internal headroom. Uptake is also bounded by
diffusive conductance. Prospective export cannot make room for an import in the same transfer
phase, and exported material is unavailable to a neighbor until the next phase. Enzymes resolve
shared substrate from one initial inventory and cannot cascade newly made products in iteration
order. Uphill work must use energy held before reactions. Downhill overflow becomes recorded heat.

Checkpoint v9 stores the resolved definition, canonical little-endian float64 chemical blocks,
species mixtures, genes, bodies, neural state, complete ancestry, random streams and ledgers.
Old checkpoints and configuration keys are rejected. A continuation test exposed insertion-order
rounding differences after sorting inventories for persistence; canonical runtime reductions
fixed them. Exact continued state now matches after restore in the bounded lifecycle fixture.

Removed kernel modules: named carbon/oxygen cycle, matrix walls/binding, family toxin types,
direct prey-yield transfer, automatic reserve sharing, named secretion and A/B composition
helpers. Their generic replacements and experimental paths are connected; the
[migration audit](migration-audit.md) records dispositions and checks. Browser/harness TypeScript,
bounded tests, current Python reports and local SQL queries pass. The physical-opportunity probes
and operating measurements are recorded in validation. The remaining acceptance concerns browser
motion and operating limits, not a missing named chemical pathway.
The provisional maximum injury rate is 0.01 per second following the registered 300-tick
nutrition comparison and nearby-rate checks. This selection does not establish sustained ecology.

Generation and restore both enforce coefficient/table agreement, scalar coverage, normalized
neighbor steps below 0.15, at least eight affinity-weighted barrier neighborhoods, a connected
four-species barrier region and a reachable two-step downhill path. These checks use physical
properties and the allowed offsets, without running organisms or selecting a favorable ecosystem.

Initial lossless sparse traversal did not make the world usable. The user set a minimum of
30 ticks/second and delegated numerical choices to the implementation. The
[performance decision](performance.md) adds persisted extracellular resolution and explicit
numerical material/potential counters. Shared buffers, cached source geometry, local impedance
sampling and reuse of unchanged body quantities remove repeated work. Physical rates, chemical
identities, affinity and intracellular reactions retain their semantics; no second engine is added.
