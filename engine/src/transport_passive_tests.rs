use super::*;

fn diffuse(w: &mut crate::world::World) {
    let sites: Vec<_> = w
        .cells
        .iter()
        .map(|c| crate::footprint::sites(c, &w.config, &w.field))
        .collect();
    let mut cache = crate::movement::geometry::Cache::default();
    cache.prepare_local(&w.cells, &w.config);
    Exchange::default().diffuse_prepared(
        &mut w.cells,
        &w.config,
        &mut w.field,
        &w.chemistry,
        &sites,
        (&mut cache, &mut w.ledger, None),
    );
}

#[test]
fn passive_exchange_is_bidirectional_conservative_and_requires_no_work() {
    for outside in [false, true] {
        let mut w = crate::diagnostics::nutrition(0.8, 2., false, false);
        w.cells[0].inventory.fill(0.);
        w.cells[0].energy = 0.;
        if outside {
            w.field
                .replace_material(&w.chemistry, |i| if i % 256 == 136 { 0.4 } else { 0. });
        } else {
            w.cells[0].inventory.set(136, 0.8);
        }
        let before = w.held();
        diffuse(&mut w);
        let cell = &w.cells[0];
        assert_eq!(cell.flows.transport, 0.);
        assert_eq!(cell.energy, 0.);
        assert!(if outside {
            cell.flows.imported > 0.
        } else {
            cell.flows.exported > 0.
        });
        assert!((before.0 - w.held().0 - w.ledger.numerical_material).abs() < 1e-10);
        assert!((before.1 - w.held().1 - w.ledger.numerical_energy).abs() < 1e-10);
    }
}

#[test]
fn finite_bath_and_competing_cells_respect_donor_and_capacity_bounds() {
    let mut w = crate::diagnostics::nutrition(0.8, 2., false, false);
    w.config.dt = 1e6;
    w.cells[0].inventory.fill(0.);
    let sites = crate::footprint::sites(&w.cells[0], &w.config, &w.field);
    for &(n, _) in &sites {
        w.field.add(n, 136, 0.01, &w.chemistry);
    }
    let before = w.held();
    diffuse(&mut w);
    let sites = crate::footprint::sites(&w.cells[0], &w.config, &w.field);
    assert!(
        w.cells[0].inventory.value(136) / w.cells[0].volume(&w.config)
            <= w.field.sample(136, &sites) + 1e-6
    );
    for i in 1..8 {
        let mut cell = w.cells[0].clone();
        cell.id = i + 1;
        cell.inventory.fill(0.);
        w.cells.push(cell);
    }
    let before_competition = w.held();
    diffuse(&mut w);
    for cell in &w.cells {
        assert!(cell.material() <= cell.capacity(&w.config) + 1e-12);
        cell.inventory.validate().unwrap();
    }
    assert!(w.field.amounts().iter().all(|q| *q >= 0.));
    assert!((before_competition.0 - w.held().0).abs() < 1e-7);
    assert!(w.cells[0].flows.imported > 0.);
    assert!(before.0 > 0.);
}

#[test]
fn crowding_slows_product_clearance_without_selecting_a_toxin() {
    let mut w = crate::diagnostics::nutrition(0.8, 2., false, false);
    w.cells[0].inventory.fill(0.);
    w.cells[0].inventory.set(136, 0.8);
    let mut crowded = w.clone();
    let mut neighbor = w.cells[0].clone();
    neighbor.id = 2;
    neighbor.x += 0.1;
    crowded.cells.push(neighbor);
    diffuse(&mut w);
    diffuse(&mut crowded);
    assert!(crowded.cells[0].flows.exported < w.cells[0].flows.exported);
    assert!(crowded.cells[0].inventory.value(136) > w.cells[0].inventory.value(136));
}
