use super::*;

#[test]
fn scratch_follows_touched_nodes_and_reuses_slots_without_stale_demands() {
    let mut exchange = Exchange::default();
    exchange.prepare_nodes(
        19200,
        &[crate::footprint::Row::from_slice(&[
            (17, 0.5),
            (19000, 0.5),
            (4, 0.),
        ])],
    );
    assert_eq!(exchange.nodes, [(17, 0), (19000, 0)]);
    assert_eq!(exchange.demand.len(), 512);
    for (slot, (_, mask)) in exchange.nodes.iter_mut().enumerate() {
        *mask = (1 << slot) | (1 << 63);
        for s in species(*mask) {
            exchange.demand[slot * 256 + s] = 0.75;
            exchange.changes[slot * 256 + s] = -0.01;
        }
    }
    exchange.prepare_nodes(19200, &[crate::footprint::Row::from_slice(&[(3, 1.)])]);
    assert_eq!(exchange.nodes, [(3, 0)]);
    assert_eq!(exchange.slots[17], usize::MAX);
    assert_eq!(exchange.slots[19000], usize::MAX);
    assert_eq!(exchange.slots[3], 0);
    assert_eq!(exchange.demand.len(), 256);
    assert!(
        exchange
            .demand
            .iter()
            .chain(&exchange.changes)
            .all(|q| *q == 0.)
    );
    exchange.prepare_nodes(2, &[]);
    assert!(exchange.nodes.is_empty() && exchange.demand.is_empty());
    assert!(exchange.slots.iter().all(|slot| *slot == usize::MAX));
}

fn advance(exchange: &mut Exchange, w: &mut crate::world::World) {
    let sites: Vec<_> = w
        .cells
        .iter()
        .map(|cell| crate::footprint::sites(cell, &w.config, &w.field))
        .collect();
    exchange.advance(
        &mut w.cells,
        &w.config,
        &mut w.field,
        &w.chemistry,
        &sites,
        (&mut w.ledger, None),
    );
}

#[test]
fn reused_exchange_matches_fresh_scratch_after_effort_and_population_changes() {
    let mut w = crate::diagnostics::nutrition(0.8, 2., false, false);
    w.cells = vec![w.cells[0].clone(); 3];
    let mut exchange = Exchange::default();
    for phase in 0..6 {
        for (i, cell) in w.cells.iter_mut().enumerate() {
            cell.id = i as u64 + 1;
            cell.x = 12. + 0.01 * i as f64;
            cell.damage = if phase == 2 { 0. } else { 0.5 };
            cell.energy = 100.;
            cell.inventory.set(w.config.source_species[0], 0.03);
            cell.action.transport = [if (i + phase) % 2 == 0 { 1. } else { 0. }; 4];
        }
        let mut fresh = w.clone();
        let mut fresh_scratch = Exchange::default();
        advance(&mut fresh_scratch, &mut fresh);
        advance(&mut exchange, &mut w);
        for (actual, expected) in w.cells.iter().zip(&fresh.cells) {
            for (a, b) in actual.inventory.iter().zip(expected.inventory.iter()) {
                assert!((a - b).abs() < 1e-12);
            }
            assert!((actual.energy - expected.energy).abs() < 1e-12);
            assert!((actual.flows.contact_lost - expected.flows.contact_lost).abs() < 1e-12);
        }
        assert_eq!(w.field.amounts, fresh.field.amounts);
        assert_eq!(w.ledger.numerical_material, fresh.ledger.numerical_material);
        w.cells.reverse();
        if phase == 3 {
            w.cells.pop();
        } else if phase == 4 {
            w.cells.push(w.cells[0].clone());
        }
    }
}

#[test]
fn shared_field_contention_is_symmetric_and_excludes_same_stage_exports() {
    let mut w = super::flux_tests::fixture(false);
    w.config.dt = 1.;
    w.config.transporter_turnover = 1e8;
    let s = w.cells[0].operators.as_ref().unwrap().transporters[0]
        .iter()
        .max_by(|a, b| a.value.total_cmp(&b.value))
        .unwrap()
        .species;
    w.cells = vec![w.cells[0].clone(); 3];
    for (i, cell) in w.cells.iter_mut().enumerate() {
        cell.id = i as u64 + 1;
    }
    w.cells[2].inventory.set(s, 0.01);
    w.cells[2].action.transport.fill(0.);
    w.field.add(0, s, 1e-6, &w.chemistry);
    let available = w.field.amounts[s] as f64;
    let held = w.held().0;
    let sites = vec![crate::footprint::Row::from_slice(&[(0, 1.)]); 3];
    Exchange::default().advance(
        &mut w.cells,
        &w.config,
        &mut w.field,
        &w.chemistry,
        &sites,
        (&mut w.ledger, None),
    );
    let received = w.cells[0].inventory.value(s) + w.cells[1].inventory.value(s);
    assert!(received > 0.);
    assert!(received <= available + 1e-12);
    assert!((w.cells[0].inventory.value(s) - w.cells[1].inventory.value(s)).abs() < 1e-12);
    assert!(w.cells[2].flows.exported > available);
    assert!((held - w.held().0 - w.ledger.numerical_material).abs() < 1e-10);
    for cell in &w.cells {
        assert!(
            (cell.flows.transport
                - (cell.flows.imported + cell.flows.exported) * w.config.transport_energy)
                .abs()
                < 1e-12
        );
        cell.inventory.validate().unwrap();
    }
}
