# Calibration record

Current measurements concern the canonical 2D programmed colony. Older spatial-world measurements
remain in Git history. The September 7 user decision authorizes the living-colony economy and local
sensor/action extensions; the earlier immortal-forager work order does not block them.

## Current world values

The world has 2,048 × 128 cells, eight chambers, thirteen junctions and thirty-one passages.
Ninety-six seeded food positions lie outside a forty-cell entrance clearance. The colony begins
with eight workers of staggered ages; recruitment has no population target.

| Quantity | Survival value |
| --- | ---: |
| Initial food / source capacity | 4 / 12 energy |
| Regrowth per source per tick | 0.002 |
| Worker initial / maximum reserve | 8 / 10 |
| Crop capacity | 4 |
| Worker metabolism / move / turn cost | 0.0005 / 0.0003 / 0.0001 |
| Queen reserve / upkeep | 24 / 0.001 per tick |
| Egg energy / laying interval | 2 / 800 ticks |
| Egg / minimum larva / pupa duration | 600 / 1,200 / 600 ticks |
| Larval investment requirement | 6 energy |
| Brood upkeep | 0.0005 per tick |
| Worker lifespan | 16,000 ticks |
| Chemical update interval | 5 ticks |

These are authored simulation parameters, not empirical ant physiology. The conservation equation
and local interactions are documented in [the colony contract](design/programmed-colony.md).

## Mechanism changes and observations

Early colony runs exposed a one-cell surface traffic bottleneck. Extending grounded reach to two
cells provided a passing lane. Queen and larval hunger thresholds prevent a returning worker from
spending every tick topping up a minute deficit instead of feeding and moving on.

Constant food odor strength kept workers near depleted patches. Emission proportional to remaining
food improved renewed harvest without increasing source productivity. Run 2505 reached 40,000
ticks with 20, 20 and 19 workers, but later seed-3 decline showed that endpoint was insufficient.

Run 2508 captured three unloaded workers near the queen after harvest stopped at 64,000 ticks.
Their own pheromone had overwhelmed the old entrance trace. A separate air carrier now enters at
the physical opening and diffuses independently. Run 2509 reaches the same horizon with 20 workers,
a fed queen, continued harvest and 154.646 units of stored food.

Run 2511 is the final matched three-seed, 40,000-tick panel. Run 2510 removes external food and
regrowth at tick 8,000 on the same seeds. See [certifications](certifications.md) for per-seed
outcomes, conservation residuals and the remaining visual gate. Run 2512 extends the low-reserve
seed 1 to 64,000 ticks; it recovers to 19 workers and queen reserve 23.494 without a parameter change.

## Historical forager comparison

Run 2492 measured the earlier immortal diagnostic configuration. Both map-aware and programmed
arms completed five trips on all eight worlds, with programmed median completion-time overhead
9.988%. The recurrent comparison failed on all eight. It provides historical transport evidence,
not calibration of the current queen/brood economy.

## Next calibration boundary

Pause for human review of the programmed colony. Do not begin RNN training or genetics.
A later behavior repair should identify the failing local mechanism, predict the effect of one
change and compare the same seeded world before expanding the panel.
