use super::*;

#[test]
fn windows_begin_before_paid_activity_and_budding_retains_parent_accounts() {
    let mut w = crate::diagnostics::nutrition(0.8, 2., true, false);
    w.config.reproduction = "budding".into();
    let body = w.cells[0].body.map(|q| q * 2.);
    w.cells[0].set_fixture_body(body);
    w.cells[0].energy = 1.;
    crate::diagnostics::initialize(&mut w);
    let id = w.cells[0].id;
    w.ecology = Some(Box::new(Observer::new(&w)));
    w.step();
    assert!(w.ecology.as_ref().unwrap().active.contains_key(&id));
    assert_eq!(w.ecology.as_ref().unwrap().endings_seen, 1);
    let cell = &w.cells[0];
    let mut observer = Observer::new(&w);
    observer.before(&w.cells, w.tick + WINDOW);
    let window = &observer.active[&cell.id].current;
    assert_eq!(window.energy_at_start, cell.energy);
    assert_eq!(window.from_tick, w.tick + WINDOW);
    assert_eq!(
        observer.active[&cell.id]
            .previous
            .as_ref()
            .unwrap()
            .from_tick,
        w.tick
    );
}

#[test]
fn observation_preserves_physical_state_and_tracks_conservative_births() {
    let mut observed = crate::diagnostics::nutrition(0.8, 2., true, false);
    let body = observed.cells[0].body.map(|q| q * 2.);
    observed.cells[0].set_fixture_body(body);
    observed.cells[0].energy = 1.;
    crate::diagnostics::initialize(&mut observed);
    let mut control = observed.clone();
    observed.ecology = Some(Box::new(Observer::new(&observed)));
    for _ in 0..16 {
        observed.step();
        control.step();
    }
    assert_eq!(observed.snapshot().unwrap(), control.snapshot().unwrap());
    let observer = observed.ecology.as_ref().unwrap();
    assert_eq!(observer.active.len(), observed.cells.len());
    assert!(
        observer
            .endings
            .entries
            .iter()
            .any(|e| e["cause"] == "division")
    );
    for cell in &observed.cells {
        let active = &observer.active[&cell.id];
        if cell.parent.is_some() {
            assert!(active.birth["energy"].as_f64().unwrap() > 0.);
        }
        assert_eq!(active.current.to_tick, observed.tick);
    }
}

#[test]
fn starvation_retains_pre_spill_chemistry_genetics_and_recent_accounts() {
    let mut w = crate::diagnostics::nutrition(0.8, 2., false, false);
    w.ecology = Some(Box::new(Observer::new(&w)));
    let id = w.cells[0].id;
    w.cells[0].energy = 0.;
    w.step();
    assert!(w.cells.is_empty());
    let observer = w.ecology.as_ref().unwrap();
    assert!(observer.active.is_empty());
    let event = observer.endings.entries.back().unwrap();
    assert_eq!(event["cause"], "starvation");
    assert_eq!(event["cell"]["id"], id);
    assert_eq!(event["genotype"]["id"], event["cell"]["genome"]);
    assert_eq!(event["context"]["local"].as_array().unwrap().len(), 256);
    assert_eq!(event["recent"]["fromTick"], 0);
    assert_eq!(event["recent"]["toTick"], 1);
    assert_eq!(event["recoveredBody"], 0.);
}

#[test]
fn diagnostic_records_bound_count_bytes_and_recover_limits_after_deserialization() {
    let mut records = Records::new(3, 100);
    for i in 0..10 {
        records.push(json!({"tick":i}));
    }
    assert_eq!(records.entries.len(), 3);
    assert_eq!(records.dropped, 7);
    records.push(json!({"oversized":"x".repeat(100)}));
    assert_eq!(records.entries.len(), 3);
    assert_eq!(records.dropped, 8);
    let mut restored: Records = serde_json::from_value(json!(records)).unwrap();
    restored.rebound(2, 100);
    assert_eq!(restored.entries.len(), 2);
    assert_eq!(restored.dropped, 9);
    restored.decimate();
    assert_eq!(restored.entries.len(), 1);
    assert_eq!(restored.dropped, 10);
}
