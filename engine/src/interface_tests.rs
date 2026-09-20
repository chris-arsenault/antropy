use crate::{diagnostics, interfaces::Graph, transport::Exchange, world::World};

fn fixture(injury: f64) -> World {
    let mut w = diagnostics::nutrition(0.8, 2., false, false);
    w.config.transporter_turnover = 100000.;
    w.cells = vec![w.cells[0].clone(); 3];
    for (i, cell) in w.cells.iter_mut().enumerate() {
        cell.id = i as u64 + 1;
        cell.x = 12. + i as f64 * 0.01;
        cell.inventory.fill(0.);
        cell.energy = 100.;
        cell.action.transport = [1.; 4];
    }
    w.cells[0].inventory.set(w.config.source_species[0], 0.04);
    w.cells[0].damage = injury;
    w.cells[0].action.transport = [0.; 4];
    w
}
fn exchange(w: &mut World) {
    let sites: Vec<_> = w
        .cells
        .iter()
        .map(|cell| crate::footprint::sites(cell, &w.config, &w.field))
        .collect();
    Exchange::default().advance(
        &mut w.cells,
        &w.config,
        &mut w.field,
        &w.chemistry,
        &sites,
        (&mut w.ledger, None),
    );
}

#[test]
fn intact_neighbors_are_private_and_share_one_interface() {
    let mut w = fixture(0.);
    let graph = Graph::new(&w.cells, &w.config);
    graph.prepare(&mut w.cells, &w.config, &w.chemistry);
    for i in 0..3 {
        assert!(
            (graph.field[i] + graph.neighbors[i].iter().map(|n| n.weight).sum::<f64>() - 1.).abs()
                < 1e-12
        );
        assert!(graph.field[i] < 1.);
        assert!(
            w.cells[i]
                .interface
                .recognition
                .iter()
                .flatten()
                .all(|v| *v == 0.)
        );
    }
    exchange(&mut w);
    assert_eq!(w.cells[1].material(), 0.);
    assert_eq!(w.cells[2].material(), 0.);
    // Own export entered the field but cannot supply another request in this stage.
    assert!(w.cells[0].flows.exported > 0.);
}

#[test]
fn contested_cell_export_and_contact_import_close_and_permute() {
    let initial = fixture(0.5);
    let mut a = initial.clone();
    let mut b = initial.clone();
    b.cells.reverse();
    let before = a.held().0;
    exchange(&mut a);
    exchange(&mut b);
    b.cells.reverse();
    assert!(a.cells[1].flows.contact_imported > 0. && a.cells[2].flows.contact_imported > 0.);
    assert!((a.held().0 - before).abs() < 1e-8);
    for ((x, y), old) in a.cells.iter().zip(&b.cells).zip(&initial.cells) {
        for (left, right) in x.inventory.iter().zip(y.inventory.iter()) {
            assert!((left - right).abs() < 1e-12);
        }
        let cost = (x.flows.imported + x.flows.exported) * a.config.transport_energy;
        assert!((old.energy - x.energy - cost).abs() < 1e-12);
        assert!(x.material() <= x.capacity(&a.config) + 1e-12);
        x.inventory.validate().unwrap();
    }
    assert!(
        (a.cells[0].flows.contact_lost
            - a.cells[1].flows.contact_imported
            - a.cells[2].flows.contact_imported)
            .abs()
            < 1e-12
    );
}

#[test]
fn exposed_material_is_visible_and_can_be_recycled_for_paid_work() {
    let mut w = fixture(0.5);
    // The contention fixture exaggerates demand. This opportunity comparison uses
    // the ordinary turnover and one model-second for both import and conversion.
    w.config.transporter_turnover = crate::config::Config::default().transporter_turnover;
    w.config.dt = 1.;
    let graph = Graph::new(&w.cells, &w.config);
    graph.prepare(&mut w.cells, &w.config, &w.chemistry);
    assert!(w.cells[1].interface.recognition[0][0] > 0.);
    assert!(w.cells[1].interface.stress >= 0.);
    exchange(&mut w);
    let cell = &mut w.cells[1];
    let energy = cell.energy;
    crate::metabolism::react_observed(cell, &w.config, &w.chemistry, 1., false, [1., 1.]);
    assert!(cell.flows.reacted > 0.);
    assert!(cell.energy > energy);
    let upkeep = crate::organism::maintenance_rate(&cell.body, cell.damage, &w.config);
    let net = cell.energy - 100. - upkeep;
    println!(
        "contact recipient: imported={} transport={} captured={} upkeep={} private_net={}",
        cell.flows.contact_imported, cell.flows.transport, cell.flows.captured, upkeep, net
    );
    assert!(net > 0.);
}

#[test]
fn contact_relaxation_has_a_fixed_duration_not_a_per_tick_decay() {
    let mut w = fixture(0.);
    w.cells.truncate(2);
    for cell in &mut w.cells {
        cell.action = Default::default();
    }
    let mut small = w.clone();
    w.config.dt = 1.;
    small.config.dt = 0.1;
    for world in [&mut w, &mut small] {
        for _ in 0..(1. / world.config.dt).round() as usize {
            let sites: Vec<_> = world
                .cells
                .iter()
                .map(|cell| crate::footprint::sites(cell, &world.config, &world.field))
                .collect();
            crate::movement::advance(&mut world.cells, &world.config, &world.field, &sites);
        }
    }
    for (a, b) in w.cells.iter().zip(&small.cells) {
        assert!((a.x - b.x).abs() < 1e-12);
    }
}
