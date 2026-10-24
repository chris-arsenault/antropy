use super::*;
use crate::controller::{self, OUTPUT_BIAS, prepared};

#[test]
fn paid_activity_reinforces_direction_and_idle_time_relaxes_it() {
    let mut g = controller::seed();
    g.plasticity[0] = 1.;
    g.plasticity[1] = 0.5;
    let c = Config {
        dt: 0.8,
        ..Config::default()
    };
    let mut s = State::default();
    let mut inputs = vec![0.; controller::INPUTS];
    inputs[ports(0).0] = -0.4;
    inputs[ports(4).0] = 0.4;
    for _ in 0..20 {
        controller::act(&g, &inputs, &mut s, &c, true);
    }
    let learned = prepared::observed_state(&s);
    assert!(learned.allocation[0] < -0.39);
    assert!(learned.allocation[4] > 0.39);
    assert_eq!(learned.allocation[5], 0.);
    inputs.fill(0.);
    for _ in 0..30 {
        controller::act(&g, &inputs, &mut s, &c, true);
    }
    assert!(
        prepared::observed_state(&s)
            .allocation
            .iter()
            .all(|v| v.abs() < 0.001)
    );
}

#[test]
fn unpaid_static_and_disabled_learning_cannot_reinforce_requests() {
    let g = controller::seed();
    for (plastic, enabled, paid) in [
        (true, true, false),
        (false, true, true),
        (true, false, true),
    ] {
        let c = Config {
            dt: 0.8,
            activity_reinforcement: enabled,
            learning: if plastic { "plastic" } else { "static" }.into(),
            ..Config::default()
        };
        let mut s = State::default();
        let mut inputs = vec![0.; controller::INPUTS];
        inputs[ports(4).0] = 0.5;
        for _ in 0..20 {
            controller::act(&g, &inputs, &mut s, &c, paid);
        }
        assert_eq!(prepared::observed_state(&s).allocation, [0.; CHANNELS]);
    }
}

#[test]
fn update_is_a_bounded_physical_time_semigroup() {
    let mut a = [0.; CHANNELS];
    let mut b = a;
    let target = std::array::from_fn(|i| if i % 2 == 0 { 1. } else { -1. });
    advance(&mut a, &target, 4., 0.2);
    for _ in 0..4 {
        advance(&mut b, &target, 1., 0.2);
    }
    for (x, y) in a.into_iter().zip(b) {
        assert!((x - y).abs() < 1e-6);
        assert!(x.abs() <= 1.);
    }
}

#[test]
fn acquired_response_assimilates_without_rewriting_the_underlying_policy() {
    let g = controller::seed();
    let mut parent = State::default();
    parent.allocation[4] = 0.5;
    let child = controller::assimilate(&g, &g, &parent, 1.);
    assert_eq!(child.weights, g.weights);
    assert_eq!(child.responsiveness[4], 0.5);
    let newborn = controller::strategic::daughter(&child, &parent, 42);
    assert_eq!(newborn.allocation, child.responsiveness);
    assert!(newborn.traces.iter().all(|v| *v == 0.));
    let unlearned = controller::assimilate_layers(&g, &g, &parent, [1., 1., 0.]);
    assert_eq!(unlearned.weights, g.weights);
    assert_eq!(unlearned.responsiveness, [0.; CHANNELS]);
    let retained = controller::assimilate(&g, &g, &parent, 0.5);
    assert_eq!(retained.responsiveness[4], 0.25);
}

#[test]
fn repeated_births_cannot_ratchet_use_response_into_the_underlying_policy() {
    let mut g = controller::diagnostic([0.; controller::OUTPUTS], None);
    let output = ports(4).1;
    g.weights[OUTPUT_BIAS + output] = 0.;
    g.plasticity[0] = 1.;
    g.plasticity[1] = 0.5;
    let c = Config {
        dt: 0.8,
        ..Config::default()
    };
    let mut inputs = vec![0.; controller::INPUTS];
    inputs[ports(4).0] = 0.4;
    for _ in 0..32 {
        let mut state = controller::create_state(&g);
        for _ in 0..40 {
            controller::act(&g, &inputs, &mut state, &c, true);
        }
        g = controller::assimilate(&g, &g, &state, 1.);
    }
    assert_eq!(g.weights[OUTPUT_BIAS + output], 0.);
    assert!((g.responsiveness[4] - 0.4).abs() < 1e-6);
    inputs.fill(0.);
    let mut newborn = controller::create_state(&g);
    let initial = controller::act(&g, &inputs, &mut newborn, &c, true);
    assert!(initial.activity[0] > 0.5);
    for _ in 0..40 {
        controller::act(&g, &inputs, &mut newborn, &c, true);
    }
    let descendant = controller::assimilate(&g, &g, &newborn, 1.);
    assert_eq!(descendant.weights[OUTPUT_BIAS + output], 0.);
    assert!(descendant.responsiveness[4] < 1e-6);
    let action = controller::act(
        &descendant,
        &inputs,
        &mut controller::create_state(&descendant),
        &c,
        false,
    );
    assert!(action.activity[0] < 1e-5);
}

#[test]
fn inherited_response_requires_paid_learning_to_relax_and_survives_invalidation() {
    let mut g = controller::seed();
    g.responsiveness[4] = 0.4;
    for (reflex_learning, activity_reinforcement, paid) in [
        (true, true, false),
        (false, true, true),
        (true, false, true),
    ] {
        let c = Config {
            dt: 0.8,
            reflex_learning,
            activity_reinforcement,
            ..Config::default()
        };
        let mut s = controller::create_state(&g);
        for _ in 0..40 {
            controller::act(&g, &[0.; controller::INPUTS], &mut s, &c, paid);
        }
        prepared::invalidate(&mut s);
        assert_eq!(s.allocation[4], 0.4);
        let child = controller::assimilate(&g, &g, &s, 1.);
        assert_eq!(child.responsiveness[4], 0.4);
    }
    g.responsiveness[4] = f32::NAN;
    assert!(controller::validate(&g).is_err());
}

#[test]
fn birth_without_acquired_change_or_with_zero_retention_preserves_inherited_response() {
    let mut a = controller::seed();
    let mut b = a.clone();
    a.responsiveness[4] = 0.2;
    b.responsiveness[4] = 0.6;
    let expressed = controller::express(&a, &b);
    let state = controller::create_state(&expressed);
    for allele in [&a, &b] {
        let unchanged = controller::assimilate(allele, &expressed, &state, 1.);
        assert_eq!(&unchanged, allele);
        let mut experienced = state.clone();
        experienced.allocation[4] = 0.8;
        let disabled = controller::assimilate(allele, &expressed, &experienced, 0.);
        assert_eq!(&disabled, allele);
        let learned = controller::assimilate(allele, &expressed, &experienced, 1.);
        assert_eq!(learned.weights, allele.weights);
        assert!(learned.responsiveness[4] > allele.responsiveness[4]);
    }
}

#[test]
fn physical_birth_preserves_policy_and_accounts_while_transmitting_reversible_response() {
    for mode in ["fission", "budding"] {
        let mut w = crate::diagnostics::nutrition(0.8, 2., false, false);
        w.config.reproduction = mode.into();
        w.config.learning = "plastic".into();
        let genotype = w.cells[0].genome;
        let weights = w.genomes[&genotype].chromosomes[0].behavior.weights.clone();
        let parent = &mut w.cells[0];
        parent.brain.allocation[4] = 0.4;
        parent.set_fixture_body(parent.body.map(|q| q * 2.));
        parent.energy = 10.;
        parent.inventory.set(0, 3.);
        let before = w.held();
        crate::lifecycle::reproduce(&mut w);
        assert_eq!(w.cells.len(), 2);
        assert!((w.held().0 - before.0).abs() < 1e-10);
        assert!((w.held().1 + w.ledger.division_heat - before.1).abs() < 1e-10);
        for cell in w.cells.iter().filter(|cell| cell.parent.is_some()) {
            let g = &w.genomes[&cell.genome]
                .compiled
                .as_ref()
                .unwrap()
                .chromosome
                .behavior;
            assert_eq!(g.weights, weights);
            assert_eq!(g.responsiveness[4], 0.4);
            assert_eq!(cell.brain.allocation[4], 0.4);
            assert!(cell.brain.traces.iter().all(|v| *v == 0.));
        }
        let restored = crate::world::World::restore(&w.snapshot().unwrap()).unwrap();
        assert_eq!(
            restored.cells[0].brain.allocation,
            w.cells[0].brain.allocation
        );
    }
}

#[test]
fn ordinary_checkpoint_and_live_ablation_retain_paid_experience() {
    let mut w = crate::ecology_direction_tests::allocation_world();
    w.config.learning = "plastic".into();
    let id = w.cells[0].genome;
    let g = w.genomes.get_mut(&id).unwrap();
    for ch in &mut g.chromosomes {
        ch.behavior.plasticity[0] = 0.1;
        ch.behavior.plasticity[1] = 0.5;
    }
    g.compile(&w.config, &w.chemistry);
    for _ in 0..21 {
        w.step();
    }
    let raw = w.snapshot().unwrap();
    let observed = controller::observed_state(&w.cells[0].brain).allocation;
    assert!(observed.iter().any(|v| v.abs() > 0.));
    let g = &w.genomes[&w.cells[0].genome]
        .compiled
        .as_ref()
        .unwrap()
        .chromosome
        .behavior;
    controller::observation::inspect(g, &controller::observed_state(&w.cells[0].brain), &w.config);
    assert_eq!(raw, w.snapshot().unwrap());
    let mut restored = crate::world::World::restore(&raw).unwrap();
    for _ in 0..11 {
        w.step();
        restored.step();
    }
    for (a, b) in controller::observed_state(&w.cells[0].brain)
        .allocation
        .into_iter()
        .zip(controller::observed_state(&restored.cells[0].brain).allocation)
    {
        assert!(
            (a - b).abs() < 1e-5,
            "restored response {a} differs from {b}"
        );
    }
    restored.validate().unwrap();
    crate::run_control::configure(
        &mut w,
        &serde_json::json!({"patch":{"activityReinforcement":false}}),
    )
    .unwrap();
    for _ in 0..4 {
        w.step();
    }
    let retained = controller::observed_state(&w.cells[0].brain).allocation;
    for _ in 0..8 {
        w.step();
    }
    assert_eq!(
        retained,
        controller::observed_state(&w.cells[0].brain).allocation
    );
    let g = &w.genomes[&w.cells[0].genome]
        .compiled
        .as_ref()
        .unwrap()
        .chromosome
        .behavior;
    assert_eq!(
        project(g, &w.cells[0].brain, &w.config),
        [0.; TOTAL_OUTPUTS]
    );
    crate::run_control::configure(
        &mut w,
        &serde_json::json!({"patch":{"activityReinforcement":true}}),
    )
    .unwrap();
    assert_eq!(
        retained,
        controller::observed_state(&w.cells[0].brain).allocation
    );
    w.validate().unwrap();
}

#[test]
fn learned_output_bias_obeys_the_same_incoming_strength_budget() {
    let mut g = controller::diagnostic([0.; controller::OUTPUTS], None);
    g.plasticity[0] = 1.;
    let output = ports(4).1;
    g.weights[OUTPUT_BIAS + output] = 0.;
    g.weights[super::super::OUTPUT + output * HIDDEN] = 16.;
    let mut s = State::default();
    s.allocation[4] = 1.;
    let a = controller::act(
        &g,
        &[0.; controller::INPUTS],
        &mut s,
        &Config::default(),
        false,
    );
    assert!((a.activity[0] - controller::squash(9. / 19.) as f64).abs() < 1e-6);
    s.allocation[4] = -1.;
    controller::invalidate(&mut s);
    let a = controller::act(
        &g,
        &[0.; controller::INPUTS],
        &mut s,
        &Config::default(),
        false,
    );
    assert_eq!(a.activity[0], 0.);
}

#[test]
fn ordinary_mutable_founders_use_the_default_operator_and_bounded_inspection() {
    let mut w = crate::world::World::new(
        27,
        Config {
            width: 48.,
            height: 36.,
            founders: 8,
            source_count: 12,
            ..Config::default()
        },
    )
    .unwrap();
    assert!(w.config.activity_reinforcement);
    for _ in 0..32 {
        w.step();
    }
    let cell = w
        .cells
        .iter()
        .find(|c| {
            controller::observed_state(&c.brain)
                .allocation
                .iter()
                .any(|v| v.abs() > 0.)
        })
        .unwrap();
    let id = cell.id;
    let raw = w.snapshot().unwrap();
    let view =
        crate::commands::execute(&mut w, &serde_json::json!({"op":"inspect","cell":id})).unwrap();
    assert_eq!(view["control"]["activityReinforcement"]["enabled"], true);
    assert_eq!(
        view["control"]["activityReinforcement"]["state"]
            .as_array()
            .unwrap()
            .len(),
        CHANNELS
    );
    assert!(serde_json::to_vec(&view).unwrap().len() < 2 * 1024 * 1024);
    assert!(
        raw == w.snapshot().unwrap(),
        "inspection changes physical state"
    );
    w.validate().unwrap();
}
