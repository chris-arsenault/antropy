# Autonomous colony repair

Plan `ba13d993-2c56-4a16-87a7-38ca88dec183` follows the failed
[default pressure review](default-pressure-audit.md). The user authorized repairs and experiments
through a working programmed colony, with human visual review before further stages.
The final matched comparison reaches 18,000 ticks with surviving descendant colonies in both
arms. The user subsequently rejected the trajectory: queen placement at the entrance, scattered
one-cell cuts and food at the nest throat. This is a failed construction review despite survival.

## Mechanisms repaired

The seed previously enabled normal cache delivery only after the cache set changed. The original
cache therefore stayed empty while food accumulated near the queen, and storage demand never
reached the construction policy. All known non-retiring caches now participate in the same
delivery, withdrawal and capacity observations from initialization onward.

That repair exposed a second defect: an outdoor cache qualified as forage. Workers picked up and
redeposited its contents without leaving. Cache observations now retain their storage identity,
including at exposed sites. Workers withdraw for observed care needs, preserve the care task
through travel and self-maintenance, and return unused food when that need ends. Moving cached
food no longer counts as new external harvest or a completed foraging return. Physical food and
energy transfers still use the ordinary action resolver.

The policy and resolver share reservations for a source queen, brood body or cache as well as
destination and disposal space. A second worker can see that another relocation already owns the
same source. Proposal enumeration includes nearby remembered nursery sites as well as worker-local
and rotating memory samples. Enumeration does not score their suitability.

Relocation may use an adjacent site if the observed improvement exceeds its movement margin.
Backing is an observed shelter clue in the seed's placement decisions. Digging avoids the floor
directly supporting an observed queen or brood body; previous cuts made the queen fall into the
hole instead of using transport. These are mutable policy rules, not restrictions on the physical
action interface. Climate observations remain timestamped memories, not remote live measurements.

The programmed expressions and compiled LGP seed share these changes. The interface contains 134
inputs and 27 requests; the seed compiles to 2,940 instructions. The task byte remains private to
each worker. Genetics, neural training and automatic task assignments are absent.

The long run exposed another policy defect: a larva route had a higher fixed score than a queen
route even when the queen was much more depleted. A bounded equal-distance case reproduced that
choice in both controllers. Recipient routing now scores observed missing food energy, uses the
physical queen/larva appetite thresholds, and commits to its chosen recipient route. The latter
prevents repeatedly switching recipients in transit. Stale demand requires another observation.

Read-only progress observations then exposed remembered eggs whose quantity remained zero after
they became larvae. Loaded workers could not inspect those stale care sites, and finished routes
still suppressed inspection. The seed now permits nearby interior care visits with a finished
route and gives loaded workers priority to inspect. A bounded case starts with a stale egg record,
requires the worker to reach the actual larva and verifies physical feeding in both controllers.
No remote hunger update or automatic task assignment supplies the missing information.

## Default world and measurements

The browser now starts a small founding nest with three chambers and branching passages. The
larger reference, narrow and compact nests and surface tiers remain configurable. The cellular
foreground/backing world, soil pockets, 2,048 by 512 extent and physical support rules remain.
One storage cell holds 12 food units, three full worker crops, instead of 96. This gives stored
food a useful spatial footprint without altering food energy density or adding a construction
reward. Laying and development rates, food renewal and maintenance costs retain their prior values.

Existing cavities still begin with a finite 16-degree heat surplus; the surrounding material is
not warmed again when excavated. Daily surface exchange and material moisture remain active.
Comfortable colonies may stop excavating. The experiment measures reproduction, resource retention
and exposure rather than requiring a continuous construction count.

Completed-work totals now survive expiration of individual job records and checkpoint round trips.
Metrics distinguishes queen relocations from carrier movement steps, and shows brood relocations,
additional storage, cache relocations, spoil and excavation. Startup remains paused at zero with
temperature visible, Metrics open and an explicit 30 ticks/s target. No imports or work orders are
needed. Checkpoint v15 records the changed interface and durable completion totals; older versions
are rejected rather than silently continued with different inputs.

## Incremental evidence

| Run | Change or finding | Outcome |
| --- | --- | --- |
| 2765 | First-cache access exposed a storage/forage identity error | 1,902 pickups and 1,891 deposits in 2,000 ticks; rejected |
| 2766 | Cache identity, care memory, reservations and placement repairs on the compact nest | 43 pickups and 22 deposits in 4,000 ticks; queen and larvae fed; seven cuts and cache/brood relocation |
| 2767 | Smaller founding geometry | 16 cuts, queen transport, cache relocation and one hatch by 4,000 ticks |
| 2768 | Avoid removing observed body supports, checked on compact geometry | Queen physically carried into a cut; three cuts with disposal by 2,000 ticks |
| 2769 | Founding nest with smaller storage capacity during the remaining repairs | Additional cache completed at tick 1,007; one hatch by 4,000 ticks |

These are incremental development runs, not a factorial comparison: controller repairs occurred
between some steps. Their artifacts and exact configurations are in
`frontend/harness/artifacts/colony-repair-2026-09-08/` and the SQLite ledger. The final matched pair
uses the same repaired seed and default configuration with only excavation enabled or disabled.

## Long comparison before the care-priority repair

The first repaired pair, 2772 with excavation and 2771 without it, both reach 18,000 ticks with
living queens, no founders and no worker starvation. The enabled arm ends with 14 descendants,
queen reserve 21.36 and zero stored food; the control has 16 descendants, queen reserve 23.69 and
32.40 stored food energy. Excavation lowers accumulated queen thermal excess by 60.12%, but this
does not establish an overall colony advantage. The enabled arm's sampled queen reserve falls to
9.69 before feeding recovers, and one brood dies versus none in the control. The fixed larva
priority is therefore repaired before handoff.

The enabled arm completes 15 digs with disposal, three queen relocations, two additional storage
sites, four cache relocations and 15 brood relocations. Its last brood relocation finishes at
17,464. The LGP run 2770 matches every sampled field of its first 3,500 ticks exactly. These
results precede the care-priority repair and are not presented as measurements of the final seed.

## Care-priority comparison before inspection repair

Runs 2776/2775 reach 18,000 ticks with 18/17 descendants, no founders, no worker starvation and
no brood deaths. The enabled arm's minimum sampled queen reserve is 21.43, compared with 9.69
before the care-priority repair. It completes 22 cuts with disposal, four queen relocations,
five additional caches, four cache relocations and 21 brood relocations. Two dig jobs are abandoned
after removing material, so completed dig jobs total 20 while actual cuts and disposal total 22.
Queen thermal excess is 41.44% lower than in the control, but final stored food is zero versus
2.41. LGP run 2773 matches all 15 sampled snapshots through tick 3,500 exactly.

These intermediate runs preserve the care-priority change separately. They do not include the
subsequent stale-care inspection correction measured below.

## Final integrated comparison

Final programmed runs 2778/2777 differ only in excavation availability and reach 18,000 ticks,
beyond the 16,000-tick worker lifespan. They use seed 101, ordinary renewable food, funded
reproduction and mortality, with zero work-order interventions or task overrides.

| Measure at tick 18,000 | Excavation enabled, 2778 | Disabled, 2777 |
| --- | ---: | ---: |
| Living descendants / adult births | 19 / 19 | 17 / 17 |
| Remaining founders | 0 | 0 |
| Worker starvation / brood deaths | 0 / 0 | 0 / 0 |
| Queen reserve | 23.50 | 23.54 |
| Minimum sampled queen reserve | 21.56 | 21.54 |
| Stored food energy | 65.08 | 1.90 |
| Queen / brood food received | 60.86 / 137.50 | 59.38 / 130.81 |
| Accumulated queen thermal excess | 8,077.20 | 15,330.34 |
| Food energy spoiled | 0.28 | 0.60 |
| Excavated cells / deposited spoil | 21 / 21 | 0 / 0 |
| Queen / brood relocations | 4 / 20 | 2 / 16 |
| Additional caches / cache relocations | 8 / 9 | 5 / 2 |

The enabled arm has 47.31% less queen thermal excess and more retained food in this matched case.
Both arms survive and reproduce: excavation is useful here without being a survival prerequisite.
Its final completed work is additional storage at tick 17,631; two dig jobs remain in progress
at the endpoint. The peak sampled absolute food-energy residual across the pair is 1.13e-8.
These are one-seed, finite-horizon results, not evidence of universal benefit or optimal placement.

LGP run 2774 matches every field of all 15 programmed snapshots through tick 3,500 exactly.
The actual browser probe uses only Run/Pause and reaches tick 3,503
with 13 cuts and spoil deposits, three queen relocations, five brood relocations, three additional
storage sites and three cache relocations. It issues no work orders or configuration changes.
The screenshot in `patrol-browser/canvas.png` was inspected for field and cavity legibility;
this does not substitute for the user's trajectory review.
The climate overlay is less opaque and actual cavity boundaries remain outlined so excavation is
visible. A read-only progress file records worker tasks, attempted actions, routes and observed
recipients every 1,000 ticks for investigation during a campaign.

The browser pacing check on fresh worlds measures about 1 tick/s at the 1 setting and 9.38 ticks/s
at 10. During concurrent campaigns, 30 and Maximum reach 15.78 and 16.46 ticks/s respectively.
Metrics reports actual throughput and Pause stops ticking. A target cannot exceed available
compute; these loaded-host measurements do not certify interactive capacity at larger populations.

Bounded tests cover first-cache delivery, exposed-cache behavior, care withdrawal and return of
unused food, reservations, physical work, checkpoint continuation and completion totals after
memory expiry. Final `make ci` passes all 185 tests in 51 files, lint, formatting, types,
documentation and Terraform formatting. The production build passes. The earlier concurrent CI
attempt passed 183 tests and hit two five-second timeouts; both affected files and the final suite
pass unchanged after campaign load clears. A nested-conditional lint error in the new audit label
was also corrected. No assertions or timeouts were weakened. Existing optional-property and
bundle-size warnings remain.

This work does not certify arbitrary maps, tiered survival or interactive 2,000-worker colonies.
Those remain later milestones; human trajectory review is still required for this repair.
