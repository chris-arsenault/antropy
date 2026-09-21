use super::*;

fn fixed() -> (Genome, Config, Vec<f32>, State) {
    let mut g = diagnostic([0.; OUTPUTS], Some((0, 1, 1.)));
    g.weights[OUTPUT_BIAS + 4] = -1.;
    let c = Config {
        learning: "static".into(),
        dt: 0.,
        ..Config::default()
    };
    let mut inputs = vec![0.; INPUTS];
    inputs[0] = 0.7;
    let mut state = State::default();
    act_owned(&g, &inputs, &mut state, &c, false, 1);
    (g, c, inputs, state)
}

fn close(a: &[f32], b: &[f32]) {
    for (a, b) in a.iter().zip(b) {
        assert!((a - b).abs() < 3e-6, "{a} != {b}");
    }
}

#[test]
fn physiological_clock_holds_actions_and_reuses_all_buffers() {
    let (g, mut c, inputs, mut state) = fixed();
    let before = state.hidden.clone();
    let epoch = state.epoch.as_ref().unwrap();
    let pointers = (
        epoch.inputs.as_ptr(),
        epoch.integral.as_ptr(),
        epoch.hidden.as_ptr(),
    );
    let initial = epoch.action.turn;
    c.dt = 0.2;
    for _ in 0..3 {
        assert_eq!(
            act_owned(&g, &inputs, &mut state, &c, false, 1).turn,
            initial
        );
        assert_eq!(state.hidden, before);
        assert_eq!(state.epoch.as_ref().unwrap().preparations, 1);
    }
    act_owned(&g, &inputs, &mut state, &c, false, 1);
    let epoch = state.epoch.as_ref().unwrap();
    assert_eq!(epoch.preparations, 2);
    assert_eq!(
        pointers,
        (
            epoch.inputs.as_ptr(),
            epoch.integral.as_ptr(),
            epoch.hidden.as_ptr()
        )
    );
}

#[test]
fn short_cue_contributes_its_signed_time_average() {
    let (g, mut c, mut inputs, mut state) = fixed();
    inputs[0] = 0.;
    invalidate(&mut state);
    act_owned(&g, &inputs, &mut state, &c, false, 1);
    inputs[0] = 0.8;
    act_owned(&g, &inputs, &mut state, &c, false, 1);
    c.dt = 0.2;
    inputs[0] = 0.;
    act_owned(&g, &inputs, &mut state, &c, false, 1);
    for _ in 0..3 {
        act_owned(&g, &inputs, &mut state, &c, false, 1);
    }
    close(&state.hidden[..1], &[squash(0.2)]);
    assert!(state.epoch.as_ref().unwrap().action.turn > 0.);
}

#[test]
fn opposite_exposures_cancel_within_their_channel() {
    let (g, mut c, mut inputs, mut state) = fixed();
    inputs[0] = 0.4;
    act_owned(&g, &inputs, &mut state, &c, false, 1);
    c.dt = 0.4;
    inputs[0] = -0.4;
    act_owned(&g, &inputs, &mut state, &c, false, 1);
    act_owned(&g, &inputs, &mut state, &c, false, 1);
    close(&state.hidden[..1], &[0.]);
}

#[test]
fn new_cues_never_backdate_the_elapsed_interval() {
    let (g, mut c, mut inputs, mut state) = fixed();
    inputs[0] = -0.7;
    c.dt = 0.8;
    assert!(act_owned(&g, &inputs, &mut state, &c, false, 1).turn > 0.);
    assert!(act_owned(&g, &inputs, &mut state, &c, false, 1).turn < 0.);
    assert_eq!(state.epoch.as_ref().unwrap().preparations, 3);
}

#[test]
fn clock_handles_steps_that_straddle_a_physiological_boundary() {
    let (g, mut c, inputs, mut whole) = fixed();
    let mut split = whole.clone();
    c.dt = 0.3;
    for _ in 0..6 {
        act_owned(&g, &inputs, &mut whole, &c, false, 1);
    }
    c.dt = 0.2;
    for _ in 0..9 {
        act_owned(&g, &inputs, &mut split, &c, false, 1);
    }
    close(&whole.hidden, &split.hidden);
    assert_eq!(whole.epoch.as_ref().unwrap().preparations, 3);
    assert_eq!(split.epoch.as_ref().unwrap().preparations, 3);
    assert!((whole.epoch.as_ref().unwrap().elapsed - 0.2).abs() < 1e-12);
}

#[test]
fn autonomous_recurrence_and_weak_cues_evaluate_without_thresholds() {
    let (mut g, mut c, mut inputs, mut state) = fixed();
    g.weights[RECURRENT] = 1.;
    inputs[0] = 0.001;
    invalidate(&mut state);
    state.hidden.fill(0.);
    act_owned(&g, &inputs, &mut state, &c, false, 1);
    let first = state.hidden[0];
    c.dt = 0.8;
    act_owned(&g, &inputs, &mut state, &c, false, 1);
    assert!(state.hidden[0] > first);
    close(&state.hidden[..1], &[squash(first + 0.001)]);
}

#[test]
fn byte_write_feeds_the_following_atomic_evaluation() {
    let (mut g, mut c, inputs, mut state) = fixed();
    g.weights[OUTPUT_BIAS + 4] = 1.;
    g.weights[OUTPUT_BIAS + 3] = 1.;
    g.weights[..RECURRENT].fill(0.);
    g.weights[34] = 1.;
    invalidate(&mut state);
    state.task = 0;
    act_owned(&g, &inputs, &mut state, &c, false, 1);
    assert_eq!(state.hidden[0], 0.);
    let byte = state.task;
    assert_ne!(byte, 0);
    c.dt = 0.8;
    act_owned(&g, &inputs, &mut state, &c, false, 1);
    close(&state.hidden[..1], &[squash(byte as f32 / 255.)]);
}

#[test]
fn affine_trace_flow_composes_with_zero_decay_and_saturation() {
    let mut flow = learning::Flow {
        decay: [0.7; HIDDEN],
        gain: [0.1; HIDDEN],
        offset: [-0.3; HIDDEN],
        paid_elapsed: 1.2,
    };
    flow.decay[0] = 0.;
    flow.offset[0] = 1.;
    let mut whole = vec![0.75; HIDDEN * HIDDEN];
    let mut split = whole.clone();
    flow.apply(&mut whole, &[0.5; HIDDEN]);
    flow.paid_elapsed = 0.6;
    flow.apply(&mut split, &[0.5; HIDDEN]);
    flow.apply(&mut split, &[0.5; HIDDEN]);
    close(&whole, &split);
    assert_eq!(whole[0], 1.);
}

#[test]
fn paid_lazy_learning_observation_assimilation_and_continuation() {
    let (mut g, mut c, mut inputs, mut state) = fixed();
    invalidate(&mut state);
    c.learning = "plastic".into();
    g.weights[BIAS..OUTPUT].fill(1.);
    g.plasticity[0] = 0.2;
    g.plasticity[1] = 0.02;
    g.plasticity[2] = 1.;
    g.plasticity[6] = 1.;
    state.hidden.fill(0.5);
    inputs[1] = 0.5;
    act_owned(&g, &inputs, &mut state, &c, false, 2);
    assert!(current_traces(&state).iter().all(|v| *v == 0.));
    c.dt = 0.2;
    act_owned(&g, &inputs, &mut state, &c, true, 2);
    let paid = current_traces(&state);
    assert!(paid.iter().any(|v| *v > 0.));
    assert!(state.traces.iter().all(|v| *v == 0.));
    act_owned(&g, &inputs, &mut state, &c, false, 2);
    close(&paid, &current_traces(&state));
    let before = postcard::to_stdvec(&state).unwrap();
    let observed = observed_state(&state);
    close(&paid, &observed.traces);
    assert!(observed.epoch.is_none());
    assert_eq!(before, postcard::to_stdvec(&state).unwrap());
    let mut restored: State = postcard::from_bytes(&before).unwrap();
    for _ in 0..5 {
        act_owned(&g, &inputs, &mut state, &c, true, 2);
        act_owned(&g, &inputs, &mut restored, &c, true, 2);
    }
    assert_eq!(
        postcard::to_stdvec(&state).unwrap(),
        postcard::to_stdvec(&restored).unwrap()
    );
    let child = assimilate(&g, &g, &state, 1.);
    assert_eq!(child, assimilate(&g, &g, &observed_state(&state), 1.));
    assert_ne!(child, g);
    validate_state(&state).unwrap();
}

#[test]
fn owner_publications_preserve_transient_cues_and_paid_private_learning() {
    let (mut g, mut c, mut inputs, mut direct) = fixed();
    g.plasticity = seed().plasticity;
    c.learning = "plastic".into();
    invalidate(&mut direct);
    act_owned(&g, &inputs, &mut direct, &c, false, 1);
    let mut published = direct.clone();
    c.dt = 0.2;
    for step in 0..12 {
        inputs[0] = if (2..5).contains(&step) { -0.8 } else { 0.2 };
        inputs[28] = 0.2 + step as f32 * 0.04;
        inputs[30] = if step == 4 { 0.9 } else { 0. };
        inputs[38] = if step >= 6 { 0.7 } else { 0. };
        let paid = step % 3 != 0;
        let publication = Config {
            dt: 0.,
            ..c.clone()
        };
        act_owned(&g, &inputs, &mut direct, &publication, false, 1);
        publish_inputs(
            &mut published,
            &inputs,
            ENVIRONMENT_INPUTS | PHYSIOLOGY_INPUTS,
        );
        let a = act_owned(&g, &inputs, &mut direct, &c, paid, 1);
        let b = act_published(&g, &inputs, &mut published, &c, paid, 1);
        close(&direct.hidden, &published.hidden);
        close(&current_traces(&direct), &current_traces(&published));
        assert!((a.turn - b.turn).abs() < 3e-6);
        validate_state(&published).unwrap();
    }
    assert!(current_traces(&published).iter().any(|value| *value != 0.));
}

#[test]
fn owner_publication_at_half_interval_preserves_the_actual_exposure_duration() {
    let (g, mut c, mut inputs, mut state) = fixed();
    inputs[0] = 0.;
    publish_inputs(&mut state, &inputs, ENVIRONMENT_INPUTS);
    c.dt = 0.4;
    act_published(&g, &inputs, &mut state, &c, false, 1);
    inputs[0] = 0.8;
    publish_inputs(&mut state, &inputs, ENVIRONMENT_INPUTS);
    act_published(&g, &inputs, &mut state, &c, false, 1);
    close(&state.hidden[..1], &[squash(0.4)]);
}

#[test]
fn simultaneous_contact_and_external_cues_share_the_same_physical_interval() {
    let (mut g, mut c, mut inputs, mut state) = fixed();
    g.weights[..RECURRENT].fill(0.);
    g.weights[0] = 1.;
    g.weights[30] = -1.;
    inputs[0] = 0.;
    inputs[30] = 0.;
    invalidate(&mut state);
    act_published(&g, &inputs, &mut state, &c, false, 1);
    c.dt = 0.4;
    act_published(&g, &inputs, &mut state, &c, false, 1);
    inputs[0] = 0.8;
    inputs[30] = 0.8;
    publish_inputs(&mut state, &inputs, ENVIRONMENT_INPUTS);
    act_published(&g, &inputs, &mut state, &c, false, 1);
    assert_eq!(
        state.hidden[0], 0.,
        "equal opposite cues occupy the same half interval"
    );
}
