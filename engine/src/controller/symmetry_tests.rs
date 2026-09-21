use super::*;

fn index(i: usize) -> usize {
    HIDDEN - 1 - i
}

fn permute(g: &Genome) -> Genome {
    let mut p = g.clone();
    for i in 0..HIDDEN {
        for j in 0..INPUTS {
            p.weights[index(i) * INPUTS + j] = g.weights[i * INPUTS + j];
        }
        p.weights[BIAS + index(i)] = g.weights[BIAS + i];
        for j in 0..HIDDEN {
            p.weights[RECURRENT + index(i) * HIDDEN + index(j)] =
                g.weights[RECURRENT + i * HIDDEN + j];
        }
        for o in 0..TOTAL_OUTPUTS {
            p.weights[OUTPUT + o * HIDDEN + index(i)] = g.weights[OUTPUT + o * HIDDEN + i];
        }
    }
    p
}

fn permute_state(s: &State) -> State {
    let mut p = s.clone();
    for i in 0..HIDDEN {
        p.hidden[index(i)] = s.hidden[i];
        for j in 0..HIDDEN {
            p.traces[index(i) * HIDDEN + index(j)] = s.traces[i * HIDDEN + j];
        }
    }
    p
}

fn close(a: impl IntoIterator<Item = f32>, b: impl IntoIterator<Item = f32>) {
    for (a, b) in a.into_iter().zip(b) {
        assert!((a - b).abs() < 5e-6, "{a} != {b}");
    }
}

#[test]
fn hidden_permutation_preserves_actions_learning_and_assimilation_with_roundoff() {
    let c = Config {
        learning: "plastic".into(),
        ..Config::default()
    };
    let mut g = seed();
    for (i, w) in g.weights.iter_mut().enumerate() {
        *w += (i % 11) as f32 * 0.0001;
    }
    let other = permute(&g);
    let mut state = State::default();
    for i in 0..HIDDEN {
        state.hidden[i] = i as f32 * 0.001;
    }
    let mut mapped = permute_state(&state);
    for tick in 0..32 {
        let input: Vec<_> = (0..INPUTS)
            .map(|i| ((i + tick) % 17) as f32 * 0.01)
            .collect();
        let a = act(&g, &input, &mut state, &c, true);
        let b = act(&other, &input, &mut mapped, &c, true);
        close(
            [a.swim as f32, a.turn as f32, a.repair as f32],
            [b.swim as f32, b.turn as f32, b.repair as f32],
        );
        close(a.transport.map(|x| x as f32), b.transport.map(|x| x as f32));
        let expected = permute_state(&state);
        close(expected.hidden, mapped.hidden.clone());
        close(expected.traces, mapped.traces.clone());
        assert_eq!(state.task, mapped.task);
    }
    let child = assimilate(&g, &g, &state, 0.5);
    let mapped_child = assimilate(&other, &other, &mapped, 0.5);
    close(permute(&child).weights, mapped_child.weights);
}

#[test]
fn physiological_clock_respects_hidden_permutation_and_input_channel_relabeling() {
    let c = Config {
        dt: 0.05,
        learning: "plastic".into(),
        ..Config::default()
    };
    let mut g = diagnostic([0.; OUTPUTS], Some((0, 1, 2.)));
    g.weights[OUTPUT_BIAS + 4] = -1.;
    g.weights[RECURRENT] = 0.7;
    g.plasticity = vec![0.2, 0.03, 0.4, 0., 0., 0.1, 0.3, 0., 0., 0., 0.];
    let mut other = permute(&g);
    for row in other.weights[..RECURRENT].chunks_exact_mut(INPUTS) {
        row.swap(0, 2);
    }
    let (mut state, mut mapped) = (State::default(), State::default());
    for tick in 0..32 {
        let mut inputs = vec![0.; INPUTS];
        inputs[0] = 0.4 + 0.005 * tick as f32;
        inputs[1] = 0.5;
        inputs[2] = -0.1;
        let a = act_owned(&g, &inputs, &mut state, &c, true, 1);
        inputs.swap(0, 2);
        let b = act_owned(&other, &inputs, &mut mapped, &c, true, 2);
        close([a.turn as f32], [b.turn as f32]);
        close(permute_state(&state).hidden, mapped.hidden.clone());
        assert_eq!(expiry_counts(&state), expiry_counts(&mapped));
        assert_eq!(
            state.epoch.as_ref().unwrap().preparations,
            mapped.epoch.as_ref().unwrap().preparations
        );
    }
    let a = assimilate(&g, &g, &state, 0.5);
    let mut b = assimilate(&other, &other, &mapped, 0.5);
    for row in b.weights[..RECURRENT].chunks_exact_mut(INPUTS) {
        row.swap(0, 2);
    }
    close(permute(&a).weights, b.weights);
}
