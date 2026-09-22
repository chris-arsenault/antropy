//! Birth-local program changes preserve installed material and controller ownership.
use super::*;
use crate::organism::{Body, Cell, MAX_ENZYMES, enzyme_stock};

/// A count event uses the scalar law in program units, rounded before reflection.
pub fn mutate(
    g: &mut Genotype,
    cell: &mut Cell,
    rng: &mut Random,
    c: &Config,
    chemistry: &Chemistry,
) {
    if c.physical_mutation_rate <= 0.
        || c.physical_mutation_scale <= 0.
        || rng.unit() >= c.physical_mutation_rate
    {
        return;
    }
    let active = g.compiled.as_ref().unwrap().chromosome.chemistry.programs;
    let count = active.iter().filter(|v| **v).count();
    let next = super::mutation::count(count, MAX_ENZYMES, c.physical_mutation_scale, rng);
    if next == count {
        return;
    }
    let mut active = active;
    if next > count {
        for _ in count..next {
            let candidates: Vec<_> = (0..MAX_ENZYMES).filter(|&s| active[s]).collect();
            let vacancies: Vec<_> = (0..MAX_ENZYMES)
                .filter(|&s| !active[s] && cell.body[enzyme_stock(s)] == 0.)
                .collect();
            if vacancies.is_empty() {
                break;
            }
            let source = candidates[rng.index(candidates.len())];
            let destination = vacancies[rng.index(vacancies.len())];
            duplicate(g, cell, source, destination);
            active[destination] = true;
        }
    } else {
        for _ in next..count {
            let candidates: Vec<_> = (0..MAX_ENZYMES).filter(|&s| active[s]).collect();
            let slot = candidates[rng.index(candidates.len())];
            remove(g, slot);
            active[slot] = false;
        }
    }
    if active != g.compiled.as_ref().unwrap().chromosome.chemistry.programs {
        g.mutated = true;
        g.compile(c, chemistry);
    }
}

pub fn remove(g: &mut Genotype, slot: usize) {
    for a in &mut g.chromosomes {
        a.chemistry.programs[slot] = false;
        controller::programs::remove(&mut a.behavior, slot);
    }
}

pub fn duplicate(g: &mut Genotype, cell: &mut Cell, source: usize, destination: usize) {
    assert!(!g.express().chemistry.programs[destination]);
    assert_eq!(cell.body[enzyme_stock(destination)], 0.);
    let (a, b) = (enzyme_stock(source), enzyme_stock(destination));
    for allele in &mut g.chromosomes {
        allele.chemistry.enzymes[destination] = allele.chemistry.enzymes[source];
        allele.chemistry.programs[destination] = allele.chemistry.programs[source];
        let half = (1. + allele.physical[a]).max(0.) * 0.5 - 1.;
        allele.physical[a] = half;
        allele.physical[b] = half;
        controller::programs::duplicate(&mut allele.behavior, source, destination);
    }
    cell.body[a] *= 0.5;
    cell.body[b] = cell.body[a];
}

pub fn desired(g: &Compiled, cell: &Cell) -> Body {
    std::array::from_fn(|i| {
        if i == 0 {
            g.body[i] * (1. + cell.action.allocation[i])
        } else {
            2. * g.body[i] * cell.action.allocation[i]
        }
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn program_reordering_preserves_controller_and_reaction_outputs() {
        let w = crate::diagnostics::nutrition(0.8, 2., false, false);
        let mut g = w.genomes[&1].clone();
        controller::diagnostics::perturb_weights(
            &mut g.chromosomes[0].behavior,
            &mut Random::new(91),
        );
        g.compile(&w.config, &w.chemistry);
        let mut a = w.cells[0].clone();
        crate::sensing::initialize(&mut a, g.compiled.as_ref().unwrap(), &w.config, &w.field);
        let order = [7, 6, 5, 4, 3, 2, 1, 0];
        let mut reordered = g.clone();
        for (target, source) in reordered.chromosomes.iter_mut().zip(&g.chromosomes) {
            target.behavior = controller::programs::permute(&source.behavior, order);
            for (to, from) in order.into_iter().enumerate() {
                target.chemistry.enzymes[to] = source.chemistry.enzymes[from];
                target.chemistry.programs[to] = source.chemistry.programs[from];
                target.physical[enzyme_stock(to)] = source.physical[enzyme_stock(from)];
            }
        }
        reordered.compile(&w.config, &w.chemistry);
        let mut b = a.clone();
        for (to, from) in order.into_iter().enumerate() {
            b.body[enzyme_stock(to)] = a.body[enzyme_stock(from)];
        }
        b.operators = Some(reordered.compiled.as_ref().unwrap().operators.clone());
        crate::sensing::initialize(
            &mut b,
            reordered.compiled.as_ref().unwrap(),
            &w.config,
            &w.field,
        );
        a.action = controller::act(
            &g.express().behavior,
            &a.inputs,
            &mut a.brain,
            &w.config,
            false,
        );
        b.action = controller::act(
            &reordered.express().behavior,
            &b.inputs,
            &mut b.brain,
            &w.config,
            false,
        );
        assert!((a.action.swim - b.action.swim).abs() < 1e-6);
        for (to, from) in order.into_iter().enumerate() {
            assert!((b.action.activity[to] - a.action.activity[from]).abs() < 1e-6);
        }
        crate::metabolism::react(&mut a, &w.config, &w.chemistry, 0.1);
        crate::metabolism::react(&mut b, &w.config, &w.chemistry, 0.1);
        for (left, right) in a.inventory.iter().zip(b.inventory.iter()) {
            assert!((left - right).abs() < 1e-10);
        }
    }
    #[test]
    fn deleting_a_program_retains_actual_stock_and_requires_paid_retirement() {
        let w = crate::diagnostics::nutrition(0.8, 2., false, false);
        let mut g = w.genomes[&1].clone();
        let mut cell = w.cells[0].clone();
        let body = cell.body;
        let material = cell.material();
        let energy = cell.energy;
        remove(&mut g, 0);
        g.compile(&w.config, &w.chemistry);
        cell.operators = Some(g.compiled.as_ref().unwrap().operators.clone());
        assert_eq!(body, cell.body);
        assert_eq!(material, cell.material());
        assert_eq!(energy, cell.energy);
        assert_eq!(g.compiled.as_ref().unwrap().body[11], 0.);
        assert!(!cell.chemistry().programs[0]);
        cell.action.allocation.fill(0.5);
        cell.action.retirement = 1.;
        crate::organization::remodel(&mut cell, g.compiled.as_ref().unwrap(), &w.config, 1.);
        assert!(cell.body[11] < body[11]);
        assert!(cell.energy < energy);
        cell.validate(&w.config).unwrap();
    }
    #[test]
    fn duplicate_preserves_funded_body_targets_and_neural_response() {
        let w = crate::diagnostics::nutrition(0.8, 2., false, false);
        let mut g = w.genomes[&1].clone();
        controller::diagnostics::perturb_weights(
            &mut g.chromosomes[0].behavior,
            &mut Random::new(14),
        );
        g.compile(&w.config, &w.chemistry);
        let mut cell = w.cells[0].clone();
        crate::sensing::initialize(&mut cell, g.compiled.as_ref().unwrap(), &w.config, &w.field);
        let mut unmodified = cell.clone();
        let before = cell.mass();
        let target = g.compiled.as_ref().unwrap().body[11];
        let original = controller::act(
            &g.express().behavior,
            &cell.inputs,
            &mut controller::State::default(),
            &w.config,
            false,
        );
        duplicate(&mut g, &mut cell, 0, 4);
        g.compile(&w.config, &w.chemistry);
        cell.operators = Some(g.compiled.as_ref().unwrap().operators.clone());
        crate::sensing::initialize(&mut cell, g.compiled.as_ref().unwrap(), &w.config, &w.field);
        let after = controller::act(
            &g.express().behavior,
            &cell.inputs,
            &mut controller::State::default(),
            &w.config,
            false,
        );
        assert!((cell.mass() - before).abs() < 1e-12);
        assert_eq!(
            g.compiled.as_ref().unwrap().body[11] + g.compiled.as_ref().unwrap().body[16],
            target
        );
        assert!((original.swim - after.swim).abs() < 1e-6);
        for (a, b) in original.transport.iter().zip(after.transport) {
            assert!((a - b).abs() < 1e-6);
        }
        assert_eq!(after.activity[0], after.activity[4]);
        cell.validate(&w.config).unwrap();
        g.validate(&w.config).unwrap();
        unmodified.action = original;
        cell.action = after;
        crate::metabolism::react(&mut unmodified, &w.config, &w.chemistry, 0.1);
        crate::metabolism::react(&mut cell, &w.config, &w.chemistry, 0.1);
        assert!((cell.flows.reacted - unmodified.flows.reacted).abs() < 1e-10);
        for (a, b) in cell.inventory.iter().zip(unmodified.inventory.iter()) {
            assert!((a - b).abs() < 1e-10);
        }
    }
}
