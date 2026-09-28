use super::*;

#[test]
fn large_incoming_rows_retain_directional_response_instead_of_clipping() {
    let mut g = diagnostic([0.; OUTPUTS], None);
    // Strong common input formerly clipped the hidden neuron regardless of the local cue.
    g.weights[0] = 16.;
    g.weights[3] = 16.;
    g.weights[OUTPUT + HIDDEN] = 16.;
    let c = Config {
        dt: 0.,
        learning: "static".into(),
        ..Config::default()
    };
    let turn = |cue| {
        let mut input = [0.; INPUTS];
        input[0] = 0.5;
        input[3] = cue;
        act(&g, &input, &mut State::default(), &c, false).turn
    };
    assert!(turn(-0.1) < turn(0.) && turn(0.) < turn(0.1));
    assert!(turn(0.1) < 1.);
}

#[test]
fn learned_recurrence_uses_effective_coefficients_including_cancellation() {
    let mut g = diagnostic([0.; OUTPUTS], None);
    g.weights[0] = 2.;
    g.weights[BIAS] = 1.;
    g.weights[RECURRENT] = -1.;
    g.weights[OUTPUT + HIDDEN] = 1.;
    g.plasticity[0] = 1.;
    let c = Config {
        dt: 0.,
        learning: "plastic".into(),
        ..Config::default()
    };
    let mut state = State::default();
    state.traces[0] = 1.;
    state.hidden[0] = 0.8;
    let mut inputs = [0.; INPUTS];
    inputs[0] = 0.2;
    act(&g, &inputs, &mut state, &c, false);
    // The effective recurrent coefficient is exactly zero, leaving strength 2+1=3.
    assert!((state.hidden[0] - squash(1.4)).abs() < 1e-6);
    state.traces.fill(1.);
    state.hidden.fill(1.);
    invalidate(&mut state);
    act(&g, &inputs, &mut state, &c, false);
    assert!((state.hidden[0] - squash(3. * (1.4 + 23.) / 26.)).abs() < 1e-6);
}

#[test]
fn shared_row_budget_bounds_every_sign_configuration_and_preserves_small_rows() {
    for width in [1, 24, 58, 83] {
        let a: Vec<_> = (0..width).map(|i| (i as f32 - 9.) / 3.).collect();
        let norm: f32 = a.iter().map(|x| x.abs()).sum();
        for sign in [-1., 1.] {
            let value: f32 = a.iter().map(|x| x * x.signum() * sign).sum();
            assert!(bounded_drive(value, norm).abs() <= DRIVE_LIMIT + 1e-5);
        }
    }
    assert_eq!(bounded_drive(0.7, 2.), 0.7);
}
