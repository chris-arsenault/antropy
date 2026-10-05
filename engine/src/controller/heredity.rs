//! Controller-owned hereditary operations apply the shared mutation law to both layers.
use super::*;
pub fn assimilate(allele: &Genome, expressed: &Genome, state: &State, retention: f64) -> Genome {
    let mut child = allele.clone();
    for (i, h) in current_traces(state).iter().enumerate() {
        child.weights[RECURRENT + i] = (child.weights[RECURRENT + i]
            + retention as f32 * expressed.plasticity[0].abs() * h)
            .clamp(-16., 16.);
    }
    child.strategy = allele
        .strategy
        .assimilate(&expressed.strategy, &state.strategy, retention);
    child
}
pub fn mutate(g: &mut Genome, rng: &mut Random, c: &Config) -> bool {
    let weights = mutate_vector(&mut g.weights, rng, c.mutation_rate, c.mutation_scale, 16.);
    let plasticity = mutate_vector(
        &mut g.plasticity,
        rng,
        c.mutation_rate,
        c.mutation_scale,
        1.,
    );
    let strategy = c.features.strategy && g.strategy.mutate(rng, c);
    weights || plasticity || strategy
}
pub fn express(a: &Genome, b: &Genome) -> Genome {
    let mean = |x: &[f32], y: &[f32]| {
        x.iter()
            .zip(y)
            .map(|(a, b)| (a + b) * 0.5)
            .collect::<Vec<_>>()
    };
    Genome {
        weights: mean(&a.weights, &b.weights).into(),
        plasticity: mean(&a.plasticity, &b.plasticity),
        strategy: strategic::Genome::express(&a.strategy, &b.strategy),
    }
}
pub fn recombine(a: &Genome, b: &Genome, rng: &mut Random, kind: &str) -> Genome {
    Genome {
        weights: combine(&a.weights, &b.weights, rng, kind).into(),
        plasticity: combine(&a.plasticity, &b.plasticity, rng, kind),
        strategy: if rng.unit() < 0.5 {
            a.strategy.clone()
        } else {
            b.strategy.clone()
        },
    }
}
pub fn genome_distance(a: &Genome, b: &Genome) -> f64 {
    (a.weights
        .iter()
        .chain(&a.plasticity)
        .chain(a.strategy.values())
        .zip(
            b.weights
                .iter()
                .chain(&b.plasticity)
                .chain(b.strategy.values()),
        )
        .map(|(x, y)| (*x as f64 - *y as f64).powi(2))
        .sum::<f64>()
        / (PARAMETERS + 11 + strategic::PARAMETERS + 11 + strategic::HIDDEN + 2) as f64)
        .sqrt()
}
