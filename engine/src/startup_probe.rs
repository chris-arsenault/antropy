//! Isolate an actual startup source; only geometry is translated into a small arena.
use crate::{config::Config, diagnostics, movement, world::World};
pub fn isolated(seed: u64, second: bool, founders: usize) -> Result<World, String> {
    if ![1, 4].contains(&founders) {
        return Err("Source probe requires one or four founders".into());
    }
    let original = World::new(
        seed,
        Config {
            founders: 0,
            ..Default::default()
        },
    )?;
    let first = &original.sources[0].habitat;
    let selected = if second {
        original
            .sources
            .iter()
            .max_by(|a, b| {
                movement::distance(
                    [a.habitat.x, a.habitat.y],
                    [first.x, first.y],
                    &original.config,
                )
                .total_cmp(&movement::distance(
                    [b.habitat.x, b.habitat.y],
                    [first.x, first.y],
                    &original.config,
                ))
            })
            .unwrap()
    } else {
        &original.sources[0]
    };
    let mut source = selected.clone();
    for q in &mut source.inventory {
        *q /= 1. - original.config.source_priming;
    }
    source.habitat.x = 32.;
    source.habitat.y = 32.;
    let mut w = World::new(
        seed,
        Config {
            width: 64.,
            height: 64.,
            founders,
            source_count: 0,
            mutation_rate: 0.,
            physical_mutation_rate: 0.,
            learning: "static".into(),
            learning_retention: 0.,
            ..Default::default()
        },
    )?;
    w.config.source_count = 1;
    w.patch_centers = vec![[32., 32.]];
    source.rebuild(&w.config, &w.field);
    source.release(
        w.config.source_priming,
        &mut w.field,
        &w.chemistry,
        &mut w.ledger,
    );
    w.sources = vec![source];
    crate::source_medium::project(&mut w);
    w.environment_rng = original.environment_rng;
    for (i, c) in w.cells.iter_mut().enumerate() {
        c.x = 31. + 2. * (i % 2) as f64;
        c.y = 31. + 2. * (i / 2) as f64;
        c.heading = 0.;
    }
    diagnostics::initialize(&mut w);
    w.validate()?;
    Ok(w)
}
