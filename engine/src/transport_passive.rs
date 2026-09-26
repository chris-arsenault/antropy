//! Passive concentration relaxation through the same membrane that attenuates exposure.
use super::*;

pub(crate) fn requests(
    cell: &Cell,
    c: &Config,
    field: &Field,
    chemistry: &Chemistry,
    row: &crate::footprint::Row,
    incoming: &mut [f64; 256],
    outgoing: &mut [f64; 256],
) -> u64 {
    let mask = row.iter().fold(0, |m, &(n, _)| m | field.active_groups(n))
        | cell
            .inventory
            .iter()
            .enumerate()
            .fold(0, |m, (s, q)| m | if q > 0. { 1 << (s / 4) } else { 0 });
    if mask == 0 {
        return 0;
    }
    let local = crate::numeric::mixture_masked(field, row, mask);
    let volume = cell.volume(c).max(1e-30);
    let inverse_bath = row.iter().map(|(_, a)| a * a).sum::<f64>() / c.mesh.powi(2);
    let rate = c.dt * volume * cell.interface.field / cell.radius(c).powi(2).max(1e-30);
    let mut susceptibility = [1.; 256];
    for a in cell.operators.as_ref().unwrap().membrane.iter() {
        susceptibility[a.species] -= (1. - c.susceptibility_floor) * a.value;
    }
    for s in species(mask) {
        let conductance = rate * chemistry.properties[s].diffusion * susceptibility[s];
        let difference = local[s] as f64 - cell.inventory.value(s) / volume;
        let q = conductance * difference / (1. + conductance * (1. / volume + inverse_bath));
        incoming[s] = q.max(0.);
        outgoing[s] = (-q).max(0.).min(cell.inventory.value(s));
    }
    let total: f64 = species(mask).map(|s| incoming[s]).sum();
    let headroom = (cell.capacity(c) - cell.material()).max(0.);
    let fraction = if total > 0. {
        (headroom / total).min(1.)
    } else {
        1.
    };
    for s in species(mask) {
        incoming[s] *= fraction;
    }
    mask
}
