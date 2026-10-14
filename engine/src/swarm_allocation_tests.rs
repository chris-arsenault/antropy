//! Registered bounded mechanism checks; fixed diagnostic genomes run ordinary paid physics.
use crate::{controller, diagnostics, ecology_direction_tests, world::World};
use serde_json::json;

fn world(inward: bool) -> World {
    let mut w = ecology_direction_tests::allocation_world();
    w.config.learning = "plastic".into();
    w.config.learning_retention = 0.;
    w.config.activity.strategy = false;
    w.config.growth_rate = 0.;
    let id = w.cells[0].genome;
    let g = w.genomes.get_mut(&id).unwrap();
    for ch in &mut g.chromosomes {
        ch.physical[3] = 3.;
        ch.physical[4] = 3.;
        ch.chemistry.inward[0] = if inward { 1. } else { 0. };
        ch.chemistry.inward[1] = ch.chemistry.inward[0];
        ch.chemistry.enzymes[1].center_y = 0.; // 0 -> 128, disjoint from 136 -> 128.
        let mut logits = vec![-3.; controller::TOTAL_OUTPUTS];
        logits[0] = 0.;
        logits[1] = 0.;
        logits[2] = 3.;
        logits[5] = 3.;
        logits[6] = 3.;
        logits[7] = 0.;
        logits[8] = 0.;
        logits[controller::ACTIVITY] = -0.3;
        logits[controller::ACTIVITY + 1] = -0.3;
        ch.behavior = controller::diagnostics::authored_responses(
            logits,
            &[
                (
                    if inward { controller::INWARD_INPUT } else { 0 },
                    controller::ACTIVITY,
                    1.5,
                ),
                (
                    if inward {
                        controller::INWARD_INPUT + 2
                    } else {
                        4
                    },
                    controller::ACTIVITY + 1,
                    1.5,
                ),
            ],
        )
        .unwrap();
        ch.behavior.plasticity[0] = 1.;
        ch.behavior.plasticity[1] = 0.5;
    }
    g.compile(&w.config, &w.chemistry);
    diagnostics::initialize(&mut w);
    let budget = crate::binding_observation::budget(&w, &json!({"cell":2})).unwrap();
    assert_eq!(budget["ticksAdvanced"], 0);
    println!(
        "swarm initial budget maintenance={} capture={} ceiling={}",
        budget["budget"]["maintenance"],
        budget["budget"]["grossWork"],
        budget["initialContextImportWorkCeiling"]
    );
    w
}

fn supply(w: &mut World, chemicals: &[usize], amount: f32) {
    let before = w.field.totals(&w.chemistry);
    w.field.replace_material(&w.chemistry, |i| {
        if chemicals.contains(&(i % 256)) {
            amount
        } else {
            0.
        }
    });
    let after = w.field.totals(&w.chemistry);
    w.ledger.washed_out += before.0;
    w.ledger.washout_energy += before.1;
    w.ledger.supplied += after.0;
    w.ledger.supplied_energy += after.1;
}

fn histories(inward: bool) -> (World, World) {
    let mut a = world(inward);
    let mut b = a.clone();
    supply(&mut a, &[136], 1.2);
    supply(&mut b, &[0], 1.2);
    for _ in 0..40 {
        a.step();
        b.step();
    }
    assert_eq!(a.cells.len(), 1);
    assert_eq!(b.cells.len(), 1);
    println!(
        "physical histories response={:?} / {:?}",
        controller::observed_state(&a.cells[0].brain).allocation,
        controller::observed_state(&b.cells[0].brain).allocation
    );
    (a, b)
}

fn common(w: &mut World) {
    // Match exposure, inventory, work and non-allocation private state for causal attribution.
    controller::materialize(&mut w.cells[0].brain);
    let response = w.cells[0].brain.allocation;
    w.cells[0].brain = controller::State::default();
    w.cells[0].brain.allocation = response;
    w.cells[0].inventory.fill(0.);
    w.cells[0].energy = 0.5;
    w.cells[0].damage = 0.;
    w.cells[0].activity.reset();
    // Solve the authored, symmetric response's zero-effort boundary: 1.5*squash(x)=0.3.
    let (mut low, mut high) = (0_f32, 1_f32);
    for _ in 0..24 {
        let middle = (low + high) / 2.;
        if 1.5 * controller::squash(middle) < 0.3 {
            low = middle;
        } else {
            high = middle;
        }
    }
    let cell = &w.cells[0];
    let gain = cell.body[3] / (cell.body[3] + w.config.receptor_ratio * cell.body[0]);
    let input = ((low + high) / 2.) as f64;
    let concentration = w.config.receptor_k * input / (gain - input);
    if cell.chemistry().inward[0] == 1. {
        let amount = concentration * cell.volume(&w.config)
            / (1. - 2. * concentration / w.config.inventory_density);
        w.cells[0].inventory.set(0, amount);
        w.cells[0].inventory.set(136, amount);
    }
    supply(w, &[0, 136], (concentration * w.config.mesh.powi(2)) as f32);
    diagnostics::initialize(w); // Declared matched start; records actual owned material/work.
}

fn check(w: &World) {
    w.validate().unwrap();
    crate::boundary_tests::usable_continuation(w, w.tick);
    assert!(w.ledger.flows.reflex_learning > 0.);
}

fn common_pair(a: &mut World, b: &mut World) {
    common(a);
    common(b);
    let response = controller::observed_state(&b.cells[0].brain).allocation;
    // Match all physical state, including historical repair chemistry and passive displacement.
    b.cells[0] = a.cells[0].clone();
    b.cells[0].brain.allocation = response;
    diagnostics::initialize(b);
}

fn margin(w: &World) -> f64 {
    let f = &w.ledger.flows;
    f.captured
        - (f.maintenance
            + f.motors
            + f.learning
            + f.transport
            + f.growth
            + f.repair
            + f.cover_work
            + f.emission
            + f.speech_work)
}

fn preparation_price(w: &World) -> f64 {
    let c = &w.config;
    let extra_learning = c.plasticity_cost
        * w.cells[0].body[0]
        * (controller::reflex_learning_rate(1., c) - c.reflex_gain(1.));
    // Injury is bounded by one: twice the inference increment is a conservative price.
    let extra_inference = 2.
        * c.controller_cost
        * (controller::upkeep_multiplier(c) - controller::strategic::upkeep_multiplier(c));
    40. * c.dt * (extra_learning + extra_inference)
}

#[test]
fn identical_genotypes_acquire_different_allocations_from_actual_activity() {
    let (mut a, mut b) = histories(false);
    common_pair(&mut a, &mut b);
    assert_eq!(a.cells[0].body, b.cells[0].body);
    assert_eq!(a.genomes[&2].chromosomes, b.genomes[&2].chromosomes);
    let mut off_a = a.clone();
    let mut off_b = b.clone();
    for w in [&mut off_a, &mut off_b] {
        crate::run_control::configure(w, &json!({"patch":{"activityReinforcement":false}}))
            .unwrap();
    }
    let mut efforts = [[0.; 2]; 4];
    for _ in 0..16 {
        for (i, w) in [&mut a, &mut b, &mut off_a, &mut off_b]
            .into_iter()
            .enumerate()
        {
            w.step();
            for (total, effort) in efforts[i].iter_mut().zip(&w.cells[0].action.activity[..2]) {
                *total += effort * w.config.dt;
            }
        }
    }
    let effort = |w: &World| [w.cells[0].action.activity[0], w.cells[0].action.activity[1]];
    println!(
        "same-present allocation active={:?} / {:?}; off={:?} / {:?}; capture={} / {}",
        efforts[0],
        efforts[1],
        efforts[2],
        efforts[3],
        a.ledger.flows.captured,
        b.ledger.flows.captured
    );
    assert!(efforts[0][0] > efforts[0][1]);
    assert!(efforts[1][1] > efforts[1][0]);
    assert!(efforts[0][0] > efforts[2][0]);
    assert!(efforts[1][1] > efforts[3][1]);
    assert_eq!(effort(&off_a), effort(&off_b));
    for w in [&a, &b, &off_a, &off_b] {
        check(w);
    }
    assert!(a.ledger.flows.captured > 0. && b.ledger.flows.captured > 0.);
    println!(
        "matched allocation usable margins on={} / {} off={} / {}",
        margin(&a),
        margin(&b),
        margin(&off_a),
        margin(&off_b)
    );
    assert!(margin(&a) - margin(&off_a) > preparation_price(&a));
    assert!(margin(&b) - margin(&off_b) > preparation_price(&b));
}

#[test]
fn sustained_absence_relaxes_commitment_instead_of_locking_in() {
    let (mut w, _) = histories(false);
    common(&mut w);
    let before = controller::observed_state(&w.cells[0].brain).allocation;
    supply(&mut w, &[], 0.);
    w.cells[0].inventory.fill(0.);
    diagnostics::initialize(&mut w);
    let mut frozen = w.clone();
    crate::run_control::configure(
        &mut frozen,
        &json!({"patch":{"activityReinforcement":false}}),
    )
    .unwrap();
    for _ in 0..64 {
        w.step();
        frozen.step();
    }
    let after = controller::observed_state(&w.cells[0].brain).allocation;
    println!(
        "declining return response before={} after={}",
        before[0], after[0]
    );
    assert!(after[0].abs() < before[0].abs() * 0.01);
    assert_eq!(
        controller::observed_state(&frozen.cells[0].brain).allocation,
        before
    );
    check(&w);
    check(&frozen);
}

fn succession(export: bool) -> World {
    let mut w = ecology_direction_tests::succession(export, true);
    w.config.learning = "plastic".into();
    w.config.learning_retention = 0.;
    w.config.activity.strategy = false;
    w.config.growth_rate = 0.;
    let g = w.genomes.get_mut(&2).unwrap();
    for ch in &mut g.chromosomes {
        let mut logits = vec![-3.; controller::TOTAL_OUTPUTS];
        logits[0] = 0.;
        logits[1] = 0.;
        logits[2] = 3.;
        logits[5] = 0.;
        logits[6] = -3.;
        logits[7] = 0.;
        logits[8] = 0.;
        logits[controller::ACTIVITY] = 0.2;
        ch.behavior = controller::diagnostics::authored(logits, Some((0, 5, 6.))).unwrap();
        ch.behavior.plasticity[0] = 1.;
        ch.behavior.plasticity[1] = 0.5;
    }
    g.compile(&w.config, &w.chemistry);
    diagnostics::initialize(&mut w);
    let budget = crate::binding_observation::budget(&w, &json!({"cell":2})).unwrap();
    assert_eq!(budget["ticksAdvanced"], 0);
    w
}

#[test]
fn exported_product_creates_paid_activity_and_acquired_recipient_response() {
    let mut with = succession(true);
    let mut held = succession(false);
    for _ in 0..40 {
        with.step();
        held.step();
    }
    let receiver = |w: &World| {
        controller::observed_state(&w.cells.iter().find(|c| c.id == 2).unwrap().brain).allocation
    };
    println!(
        "succession acquired recipient enzyme response={} export-held={}",
        receiver(&with)[4],
        receiver(&held)[4]
    );
    assert!(receiver(&with)[4] > receiver(&held)[4]);
    let mut masked = with.clone();
    crate::run_control::configure(
        &mut masked,
        &json!({"patch":{"activityReinforcement":false}}),
    )
    .unwrap();
    for _ in 0..16 {
        with.step();
        masked.step();
    }
    let effort = |w: &World| w.cells.iter().find(|c| c.id == 2).unwrap().action.activity[0];
    assert!(effort(&with) > effort(&masked));
    for w in [&with, &held, &masked] {
        check(w);
    }
}

#[test]
fn changed_demand_recruits_the_remaining_cell_after_participant_loss() {
    let (mut a, mut b) = histories(true);
    common_pair(&mut a, &mut b);
    let mut second = b.cells.remove(0);
    second.id = a.next_cell;
    second.parent = Some(a.cells[0].id);
    second.generation = a.cells[0].generation + 1;
    second.born = a.tick;
    second.x = a.cells[0].x + 1.;
    a.next_cell += 1;
    let mut record = a
        .ancestry
        .iter()
        .find(|r| r.id == a.cells[0].id)
        .unwrap()
        .clone();
    record.id = second.id;
    record.parent = second.parent.unwrap();
    record.born = second.born;
    a.ancestry.push(record);
    a.cells.push(second);
    diagnostics::initialize(&mut a);
    for _ in 0..16 {
        a.step();
    }
    let mut removed = a.clone();
    let id = removed.cells[0].id;
    crate::commands::execute(
        &mut removed,
        &json!({"op":"intervene","cell":id,"kill":true}),
    )
    .unwrap();
    let survivor = removed.cells[0].id;
    let before_consumed = removed.cells[0].chemical_flows.consumed.value(136);
    let before_margin = margin(&removed);
    let mut removed_off = removed.clone();
    crate::run_control::configure(
        &mut removed_off,
        &json!({"patch":{"activityReinforcement":false}}),
    )
    .unwrap();
    let mut retained = a;
    // Same finite material injection in each arm. The available stimulus is locally consumed.
    for _ in 0..80 {
        for w in [&mut removed, &mut retained, &mut removed_off] {
            for (node, weight) in w.field.stencil(14., 12.) {
                let amount = 0.005 * weight;
                w.field.add(node, 136, amount, &w.chemistry);
                w.ledger.supplied += amount;
                w.ledger.supplied_energy += amount * w.chemistry.properties[136].potential;
            }
            w.step();
        }
    }
    let cell = |w: &World| {
        w.cells
            .iter()
            .find(|c| c.id == survivor)
            .unwrap()
            .action
            .activity[0]
    };
    println!(
        "replacement old-route effort remaining={} retained={} reinforcement-off={}",
        cell(&removed),
        cell(&retained),
        cell(&removed_off)
    );
    for w in [&removed, &retained] {
        let c = w.cells.iter().find(|c| c.id == survivor).unwrap();
        println!(
            "replacement observation cue={} inward={} held136={} response={:?} consumed136={}",
            c.inputs[0],
            c.inputs[41],
            c.inventory.value(136),
            controller::observed_state(&c.brain).allocation,
            c.chemical_flows.consumed.value(136)
        );
    }
    assert!(cell(&removed) > cell(&retained));
    assert!(cell(&removed) > cell(&removed_off));
    let consumed = |w: &World| {
        w.cells
            .iter()
            .find(|c| c.id == survivor)
            .unwrap()
            .chemical_flows
            .consumed
            .value(136)
    };
    println!(
        "replacement consumed136 on={} off={}; usable margins={} / {}",
        consumed(&removed) - before_consumed,
        consumed(&removed_off) - before_consumed,
        margin(&removed) - before_margin,
        margin(&removed_off) - before_margin
    );
    assert!(consumed(&removed) > consumed(&removed_off));
    assert!(margin(&removed) - margin(&removed_off) > 2. * preparation_price(&removed));
    check(&removed);
    check(&retained);
    check(&removed_off);
}
