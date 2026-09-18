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
        for o in 0..OUTPUTS {
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
