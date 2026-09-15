use crate::{
    accounting::Ledger,
    chemistry::{Chemistry, SPECIES, assembly_cost},
    config::Config,
    field::Field,
    genetics::Compiled,
    organism::Cell,
};

#[derive(Clone, Default, Debug)]
struct Request {
    substrate: usize,
    product: usize,
    quantity: f64,
    energy: f64,
    heat: f64,
}
#[derive(Clone, Debug)]
pub struct Work {
    requests: Vec<Request>,
    demand: [f64; SPECIES],
    delta: [f64; SPECIES],
}
impl Default for Work {
    fn default() -> Self {
        Self {
            requests: Vec::with_capacity(1024),
            demand: [0.; SPECIES],
            delta: [0.; SPECIES],
        }
    }
}

impl Work {
    pub fn reactions(&self) -> impl Iterator<Item = (usize, usize, f64)> + '_ {
        self.requests
            .iter()
            .filter(|r| r.quantity > 0.)
            .map(|r| (r.substrate, r.product, r.quantity))
    }
}
pub fn react(cell: &mut Cell, g: &Compiled, c: &Config, work: &mut Work, ledger: &mut Ledger) {
    work.requests.clear();
    work.demand.fill(0.);
    work.delta.fill(0.);
    for slot in 0..4 {
        let capacity = cell.body[11 + slot] * c.enzyme_turnover * (1. - cell.damage) * c.dt;
        if capacity <= 0. {
            continue;
        }
        let start = work.requests.len();
        let mut total = 0.;
        for e in &g.enzymes[slot] {
            let q = capacity * e.affinity * cell.inventory[e.substrate];
            if q > 0. {
                total += q;
                work.requests.push(Request {
                    substrate: e.substrate,
                    product: e.product,
                    quantity: q,
                    energy: e.energy,
                    heat: e.heat,
                });
            }
        }
        let scale = (capacity / total.max(1e-300)).min(1.);
        for r in &mut work.requests[start..] {
            r.quantity *= scale;
            work.demand[r.substrate] += r.quantity;
        }
    }
    let mut uphill = 0.;
    for r in &mut work.requests {
        r.quantity *= (cell.inventory[r.substrate] / work.demand[r.substrate].max(1e-300)).min(1.);
        if r.energy < 0. {
            uphill -= r.energy * r.quantity;
        }
    }
    let affordable = (cell.energy / uphill.max(1e-300)).min(1.);
    let mut energy = 0.;
    for r in &mut work.requests {
        let q = r.quantity * if r.energy < 0. { affordable } else { 1. };
        r.quantity = q;
        work.delta[r.substrate] -= q;
        work.delta[r.product] += q;
        energy += q * r.energy;
        cell.flows.reacted += q;
        cell.chemical_flows.consumed[r.substrate] += q;
        cell.chemical_flows.produced[r.product] += q;
        cell.flows.reaction_heat += q * r.heat;
        if r.energy > 0. {
            cell.flows.captured += q * r.energy;
        }
    }
    cell.inventory.apply(&work.delta);
    cell.energy = (cell.energy + energy).max(0.);
    let overflow = (cell.energy - cell.energy_capacity(c)).max(0.);
    cell.energy -= overflow;
    ledger.overflow_heat += overflow;
}

pub(crate) fn assemble(
    cell: &mut Cell,
    chemistry: &Chemistry,
    c: &Config,
    quantity: f64,
    reserve: f64,
    extra_work: f64,
) -> (f64, f64) {
    let total = cell.material();
    if total <= 0. || quantity <= 0. {
        return (0., 0.);
    }
    let body = chemistry.properties[chemistry.decomposition].potential;
    let (mut cost, mut heat) = (0., 0.);
    for (q, p) in cell.inventory.iter().zip(&chemistry.properties) {
        let (work, loss) = assembly_cost(
            p.potential,
            body,
            c.construction_energy + extra_work,
            c.conversion_efficiency,
        );
        cost += q * work;
        heat += q * loss;
    }
    let share = (quantity / total)
        .min(1.)
        .min((cell.energy - reserve).max(0.) / cost.max(1e-300));
    cell.inventory.scale(1. - share);
    cell.energy = (cell.energy - cost * share).max(0.);
    (total * share, heat * share)
}
pub fn develop(
    cell: &mut Cell,
    g: &Compiled,
    c: &Config,
    chemistry: &Chemistry,
    field: &mut Field,
    ledger: &mut Ledger,
) {
    let basal = cell.basal(c);
    cell.flows.maintenance += cell.pay(basal);
    let desired = cell.damage.min(cell.action.repair * c.repair_rate * c.dt);
    let replacement = cell.mass() * c.repair_material;
    if desired > 0. && replacement > 0. {
        let (built, heat) = assemble(
            cell,
            chemistry,
            c,
            desired * replacement,
            0.,
            c.repair_energy / replacement,
        );
        let repaired = built / replacement;
        cell.damage = (cell.damage - repaired).max(0.);
        cell.flows.repair += heat;
        cell.flows.repaired += repaired;
        let rounding = field.deposit(cell.x, cell.y, chemistry.decomposition, built, chemistry);
        ledger.rounding(rounding, chemistry.decomposition, chemistry);
    }
    let deficits: [f64; 15] = std::array::from_fn(|i| (2. * g.body[i] - cell.body[i]).max(0.));
    let missing = deficits.iter().sum::<f64>();
    let available = (cell.material() - c.protected_reserve * cell.capacity(c)).max(0.);
    let request = missing
        .min(available)
        .min(c.growth_rate * cell.mass() * c.dt);
    if request <= 0. {
        return;
    }
    let (built, heat) = assemble(
        cell,
        chemistry,
        c,
        request,
        c.protected_reserve * cell.energy_capacity(c),
        0.,
    );
    for (stock, deficit) in cell.body.iter_mut().zip(deficits) {
        *stock += built * deficit / missing;
    }
    cell.flows.constructed += built;
    cell.flows.construction += heat;
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::genetics::Genotype;
    #[test]
    fn competing_reactions_cannot_create_matter_or_energy() {
        let chemistry = Chemistry::new(101).unwrap();
        let mut c = Config::default();
        c.source_species = chemistry.source_species();
        let mut g = Genotype::seed(&c, &chemistry);
        let source = c.source_species[0];
        for a in &mut g.chromosomes {
            let enzyme = a.chemistry.enzymes[0];
            a.chemistry.enzymes.fill(enzyme);
        }
        g.compile(&c, &chemistry);
        let compiled = g.compiled.as_ref().unwrap();
        let mut cell = Cell::new(1, 1, compiled, &c, 0., 0., 0.);
        cell.inventory.fill(0.);
        cell.inventory.set(source, 0.01);
        cell.body[11..].fill(100.);
        let before = cell.material();
        let energy = cell.energy
            + cell
                .inventory
                .iter()
                .zip(&chemistry.properties)
                .map(|(n, p)| n * p.potential)
                .sum::<f64>();
        let mut ledger = Ledger::default();
        react(&mut cell, compiled, &c, &mut Work::default(), &mut ledger);
        assert!((cell.material() - before).abs() < 1e-12);
        assert!(cell.inventory.iter().all(|q| *q >= 0.));
        let after = cell.energy
            + cell
                .inventory
                .iter()
                .zip(&chemistry.properties)
                .map(|(n, p)| n * p.potential)
                .sum::<f64>()
            + cell.flows.reaction_heat
            + ledger.overflow_heat;
        assert!((energy - after).abs() < 1e-12);
    }
}
