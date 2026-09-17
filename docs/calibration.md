# Current calibration

[Configuration](../engine/src/config.rs) and the persisted chemical definition specify authored
model scales. [Composed runtime](design/chemistry/composed-runtime.md) and
[environmental measurements](design/chemistry/environmental-results.md)
record formula selection, rejected candidates and measured limits.
The [pre-chemistry calibration](sources/history/2026-09-13-pre-chemistry/calibration.md) is historical.

<a id="calibration-default-scales"></a>

## Default scales

| Quantity | Current value |
| --- | --- |
| World / timestep / founders | 320 × 240 periodic XY / 0.2 model seconds / 48 in two colonies |
| Controller | 39 inputs, 24 recurrent units, nine outputs |
| Machinery | Four receptor, four transporter, four unary-enzyme slots; fifteen funded stocks |
| Chemical definition | 16 × 16 coordinates; independent chemistry seed 101 |
| Potential U / diffusion D / impedance I / stress S ranges | 0.5–8 / 0.005–0.5 / 0–12 / 0–1 |
| Compact affinity support / minimum susceptibility | R=3 coordinate units / 0.05 |
| Renewing reservoirs | 48 initially around seven unequal regions, spread 18; rate scale 0.2, radius 3, lifetime scale 600 s, mean renewal wait 1,200 s; indefinite external replenishment |
| Reservoir drift / medium processing | 4 / 4; local gradients and impedance bound motion, local signals select downhill release branches |
| Source bootstrap | IDs 0 and 80 for chemistry seed 101, ranked by deliverable potential; 10% finite stock dissolved locally |
| Extracellular washout | 0.001 per second for every species; half-life 693 model seconds |
| Field mesh / physiology interval | 2 world units / 0.8 model seconds; active four-species groups, accounted concentration floor 1e-9 |
| Weathering rate / local response | 0.025 × positive interaction difference with the bounded medium profile; existing diffusion impedance attenuates exposure; no weather clock |
| Founder homeostasis | Membrane matches retained product; export begins near 75% storage fill |
| Movement / diffusion impedance coefficients | 0.5 / 1 |
| Viscosity | 0.004; no thermal-energy state or temperature solver |
| Transport turnover / work | 2.5 per installed stock per second / 0.05 per material |
| Enzyme turnover / downhill capture efficiency | 2.5 per installed stock per second / 0.8 |
| Construction work / growth rate | 0.5 per material plus potential deficit / 0.06 |
| Founder internal matter / usable energy | 0.8 / 0.5 |
| Core / motor / storage stock | 1 / 0.08 / 0.08 |
| Each receptor / transporter / enzyme stock | 0.01 / 0.04 / 0.04 |
| Body / inventory density | 4 / 4 |
| Injury / maximum repair rate / stress K | 0.01 / 0.008 per second / 0.3 |
| Repair material / energy per injury | 0.3 / 0.8 |
| Motor power density / efficiency | 0.2 / 0.5 |
| Behavioral mutation probability / scale | 0.0015 / 0.08 |
| Physical mutation probability / scale | 0.1 / 0.12; includes fixed-slot chemical alleles |
| Decomposition | Built material becomes ID 186; internal species retain identity |
| Horizontal transfer / disturbance | Rate zero / absent by default |
| UI pacing / population ceiling | Requested 30 ticks/s / pause at 10,000 cells |
| Field nodes / ancestry ceiling | 19,200 default; maximum 80,000 / 2,000,000 organism records |
| Recovery retention | Six automatic and two manual saves; 256 MiB compressed total, 192 MiB individual raw |

Potential is stored in chemical matter and generic biomass; usable energy is a separate stock.
Transport, upkeep, motor work, repair and reaction losses dissipate energy. No automatic catabolism
converts an untyped reserve. Ploidy, birth-local assimilation and expression are described in
[bodies](design/funded-bodies.md). Parameters remain revisable hypotheses, not empirical constants.

The [analytical resource economy](design/chemistry/resource-economy.md) derives the current
source and turnover settings. Positive local growth budgets coexist with an unaffordable
uniform-background reference. Both daughters at one finite site reproduce; an isolated weak
site remained unable to support its resident in those earlier probes. The earlier fixed-source weathering
startup starts with 48 cells and reaches 54 after 600 ticks, with 54 divisions and maximum
generation 3. This is a bounded integration finding, not sustained ecology.

[Mobile reservoir calibration](design/chemistry/mobile-source-results.md) selects drift4 and
processing4 from six 1,500-tick comparisons. By500ticks, 16/48 sources in seed27 and15/48 in
seed101 move beyond their initial radius; approximately30% of releases change chemical identity.
Two3,000-tick confirmations end with39/113 cells. These establish changing local supply and
continued access, not evolved pursuit or long-term survival.

<a id="calibration-throughput"></a>

## Measured throughput

The [mobile-source measurements](design/chemistry/mobile-source-results.md) give
39.31/24.55/20.18 ticks/s on fully occupied 48/2,000/2,000-growth fixtures, including packed
render preparation, census and inspection. Large saturated workloads miss the30ticks/s floor.
These source-free capacity fixtures retain the prior environmental limits; brief report
generation overlapped this check, so small differences do not establish a speedup. Ordinary
mobile-source confirmations measure131–136ticks/s with recording, without GPU execution.
Isolated browser operation was checked before this extension; days/weeks endurance remains
unmeasured. Earlier numerical and TypeScript figures are historical.

See [continuation](continuing-observation.md) and the validation record for final operating checks.
Historical A/B throughput figures do not apply to this larger chemical state.

<a id="calibration-residency"></a>

## Motion and residency

The physical geography remains sparse and uneven. Viscosity 0.004 is provisional; making all cells
slow is not the intended mechanism for spatial differentiation. Earlier TypeScript 300-tick ordinary-founder
controls used resident, nearby and empty conditions. The resident and nearby cells survived; the
nearby cell did not enter the resource target by the horizon. The empty control died at tick 291.
These results do not establish successful transit or colonization. Earlier A/B transit successes
remain [historical](spatial-probes.md), not evidence for the current chemistry.

<a id="calibration-why-the-injury-balance-changed"></a>

## Chemistry and injury selection

In the first TypeScript implementation, the stress surface made the selected nutrient pair too harmful. A replacement with sharper
peaks failed the unchanged continuity bound and was rejected. The accepted smooth additive surface
and the same source-selection criterion resolved IDs 0/15. A fixed local sensitivity set tested
injury rates 0.0075, 0.01 and 0.0125 with finite-resource and empty controls for 300 ticks.
The middle rate retained paid acquisition and construction with limited injury. This is a short
nutrition proof point; it neither selects an evolved founder nor proves indefinite survival.

The later [viability diagnosis](design/chemistry/viability.md) isolated constitutive export
and an incompatible retained product as avoidable losses. Retention and membrane compatibility
permit repeated funded reproduction without changing injury, repair, transport or resource rates.
Startup retains 24 founders per initial deposit. Reducing this to four was not supported
by the causal evidence and invalidated the earlier performance comparison. The weaker isolated
deposit contracted in that historical configuration. The current resource-economy record above
supersedes its rates and source selection. No community composition or successful evolutionary
endpoint is prescribed.
