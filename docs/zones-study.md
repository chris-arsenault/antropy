# Spatial A/B zones and diet specialists

Registered September 11, 2026 as phase 3 of the
[roadmap to strategic differentiation](design/README.md#design-roadmap). Sulion plan
`ac1df944-ed66-4d21-8461-9e7f4ab19509`. Artifacts: `frontend/harness/artifacts/zones-2026-09-11/`.
All cases are constructed physical genotypes on the founder brain; no winner enters the browser
default and no assay score selects parents.

## Question and mechanism

This is the original registration. Interpretations were corrected September 13; the current
[work order](design/README.md) uses these as world-design proof points, not species-count gates.

The food-epoch calendar changes composition for everyone at once, so at any moment there is one
best processing allocation. Coexisting specialists need both resources available at the same time
in different places. [Food zones](design/bacteria.md#world-fields-and-finite-deposits) split the
world into equal bands, place deposit slot *i* in band *i* mod *N* and give each band a fixed
food-A share, so supply is balanced across bands at every moment.

Three constructed diets share the founder brain, core and every other target, with equal total
processing stock (founder 0.08 A + 0.05 B):

| Diet | A processing | B processing | Brain |
| --- | --- | --- | --- |
| A-specialist | 0.11 | 0.02 | founder, or founder steering on A only (`--preference on`) |
| B-specialist | 0.02 | 0.11 | founder, or founder steering on B only |
| Generalist | 0.08 | 0.05 | founder |

The preference variant zeroes the founder's input rows for the other food (hidden units 15–18 for
B, 0–3 for A). It is a declared constructed change, not an evolved trait. Contests run on a
64-cell world with eight deposits, 64 founders, no initial dissolved meal, mutation and learning
off. Gate: constructed A- and B-specialists each invade from 10% in the zoned world; a mixed
world is the control.

## Confounds found by the first two sets

With the default initial meal (0.15 per raster cell, half A and half B, 614 units in total) the
zoned and mixed worlds gave identical outcomes at 3,000 ticks: the meal dwarfed the deposits.
With the meal removed, six of eight deposits still landed in one band because cluster centres are
random, and both diets herded together between deposits. Balancing deposit slots across bands
fixed the supply; the preference brains address the herding.

## Pairwise results at 6,000 ticks

Living cells, first and swapped placement, 0.9/0.1 bands unless stated.

| World | A-specialist v B-specialist | A-specialist v generalist | B-specialist v generalist |
| --- | --- | --- | --- |
| zones, preference | 80 v 76; 87 v 75 | 53 v 111; 46 v 112 | 42 v 118; 45 v 117 |
| zones, no preference | 78 v 85; 79 v 81 | 49 v 112; 49 v 114 | 57 v 103; 64 v 102 |
| mixed, preference | 65 v 95; 65 v 101 | 21 v 139; 27 v 139 | 52 v 106; 54 v 107 |
| pure 1/0 zones, preference | 80 v 80; 80 v 83 | 54 v 106; 59 v 106 | 44 v 117; 45 v 115 |

The two specialists remain present at the endpoints of these zoned contests; the B-specialist
has more cells in the mixed contests, where
recycled detritus makes B ubiquitous. A generalist beats either specialist alone everywhere: the
uptake law is diffusion-limited, so returns to processing stock are concave and a generalist's
idle stock costs little. Pairwise contests therefore cannot show partitioning; the three-way and
invasion pilots can.

## Three-way and invasion pilots at 12,000 ticks

Counts A-specialist / B-specialist / generalist. Rare invaders start at 7 of 64.

| World, seed | Case | Start | End | Divisions per founder (invader) |
| --- | --- | --- | --- | --- |
| pure zones, 901 | three-way | 22/21/21 | 31/78/67 | 3.4 / 4.5 / 3.1 |
| pure zones, 901 | invade A-specialist | 7/38/19 | 24/67/81 | **8.0** |
| pure zones, 901 | invade B-specialist | 19/7/38 | 19/62/92 | **10.0** |
| pure zones, 901 | invade generalist | 38/19/7 | 65/93/22 | 3.0 |
| pure zones, 902 | three-way | 22/21/21 | 59/53/42 | 3.9 / 3.2 / 1.8 |
| pure zones, 902 | invade A-specialist | 7/38/19 | 41/46/76 | **8.1** |
| pure zones, 902 | invade B-specialist | 19/7/38 | 35/32/92 | **5.7** |
| pure zones, 902 | invade generalist | 38/19/7 | 80/68/10 | 1.1 |
| mixed, 901 | three-way | 22/21/21 | 6/30/132 | 1.5 / 2.9 / 6.2 |
| mixed, 901 | invade A-specialist | 7/38/19 | 6/29/136 | 2.3 |
| mixed, 901 | invade B-specialist | 19/7/38 | 2/17/161 | 4.6 |
| mixed, 901 | invade generalist | 38/19/7 | 52/56/66 | **9.1** |

Both rare specialists gain share in the zoned contests: A ends at 24/172 (13.95%) and
41/163 (25.15%), B at 62/173 (35.84%) and 32/159 (20.13%), from 7/64 (10.94%). The generalist
ends at 22/180 (12.22%) in seed 901 and 10/158 (6.33%) in seed 902. In mixed food the rare
specialists lose share and the generalist gains it. All three remain at the equal-start zoned
endpoints. Band occupancy favors the corresponding foods. These are useful short proof points
for a spatial resource opportunity, compatible with frequency-dependent advantage; they do not
establish lasting coexistence or the former phase 3 gate.

## Default disposition and limits

The Run default now uses pure A/B halves (`foodZones: { shares: [1, 0] }`) in place of the epoch
calendar; the calendar remains selectable in the environment settings and in configuration. The
current default world is 80 × 60 with 12 of 24 deposit slots per band. These earlier assays
used eight slots and a different medium; their exact outcomes are specific to that setup.
The initial mixed meal is retained in the default; it delays but does not remove the zone effect.

Limits: these specialists have constructed preferences. The later [evolution study](evolve-study.md)
records diet differences from identical founders under revised world settings. Recycling now
returns equal A/B, so the older B bias is not a current rule. Two seeds and one assay size are a
screen. The A/B layout is a simple way to provide local differences, not a required final ecosystem.
