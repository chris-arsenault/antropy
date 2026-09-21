use super::*;

#[test]
fn haploid_expression_reuses_the_allele_owner() {
    let c = Config::default();
    let chemistry = crate::chemistry::Chemistry::new(101).unwrap();
    let genome = crate::genetics::Genotype::seed(&c, &chemistry);
    assert_eq!(genome.chromosomes.len(), 1);
    let allele = &genome.chromosomes[0].behavior.weights;
    let expressed = &genome
        .compiled
        .as_ref()
        .unwrap()
        .chromosome
        .behavior
        .weights;
    assert!(Arc::ptr_eq(&allele.0, &expressed.0));
    assert!(std::ptr::eq(allele.program(), expressed.program()));
}

#[test]
fn clones_share_values_and_lazy_program_then_detach_before_any_edit() {
    let mut parent = seed();
    let mut child = parent.clone();
    assert!(Arc::ptr_eq(&parent.weights.0, &child.weights.0));
    assert!(std::ptr::eq(
        parent.weights.program(),
        child.weights.program()
    ));
    let original = parent.weights[0];
    child.weights[0] = 0.;
    assert!(!Arc::ptr_eq(&parent.weights.0, &child.weights.0));
    assert_eq!(parent.weights[0], original);
    assert!(child.weights.0.program.get().is_none());
    child.weights.program();
    child.weights[..INPUTS].fill(0.25);
    assert!(child.weights.0.program.get().is_none());
    let owner = Arc::as_ptr(&parent.weights.0);
    parent.weights[0] = 0.75;
    assert_eq!(owner, Arc::as_ptr(&parent.weights.0));
    assert!(parent.weights.0.program.get().is_none());
}

#[test]
fn serialization_is_the_original_vector_shape_and_equality_ignores_program() {
    let a = seed().weights;
    let json = serde_json::to_string(&a).unwrap();
    assert_eq!(json, serde_json::to_string(&*a).unwrap());
    let b: WeightStore = serde_json::from_str(&json).unwrap();
    a.program();
    assert!(b.0.program.get().is_none());
    assert_eq!(a, b);
    let encoded = postcard::to_stdvec(&a).unwrap();
    assert_eq!(encoded, postcard::to_stdvec(&*a).unwrap());
    let decoded: WeightStore = postcard::from_bytes(&encoded).unwrap();
    assert_eq!(a, decoded);
}

#[test]
fn mixed_sparse_dense_and_zero_rows_preserve_every_nonzero_connection() {
    let mut g = diagnostic([0.; OUTPUTS], None);
    g.weights.fill(0.);
    for j in 0..INPUTS {
        g.weights[INPUTS + j] = (j + 1) as f32 * 0.001;
    }
    for j in 0..HIDDEN {
        g.weights[OUTPUT + HIDDEN + j] = (j + 1) as f32 * -0.003;
    }
    let weak = 1e-30;
    g.weights[2] = weak;
    g.weights[OUTPUT + 3] = weak;
    let program = g.weights.program();
    assert!(matches!(program.input.rows[1], Row::Dense));
    assert!(matches!(program.output.rows[1], Row::Dense));
    let input = [1.; INPUTS];
    let hidden = [1.; HIDDEN];
    let mut actual = [0.; HIDDEN];
    let mut expected = [0.; HIDDEN];
    program.input.apply(
        &g.weights[..RECURRENT],
        &input,
        &g.weights[BIAS..OUTPUT],
        &mut actual,
    );
    arithmetic::project(
        &g.weights[..RECURRENT],
        &input,
        &g.weights[BIAS..OUTPUT],
        &mut expected,
    );
    assert_eq!(actual, expected);
    assert_eq!(actual[0], weak);
    let mut actual = [0.; TOTAL_OUTPUTS];
    let mut expected = [0.; TOTAL_OUTPUTS];
    program.output.apply(
        &g.weights[OUTPUT..OUTPUT_BIAS],
        &hidden,
        &g.weights[OUTPUT_BIAS..],
        &mut actual,
    );
    arithmetic::project(
        &g.weights[OUTPUT..OUTPUT_BIAS],
        &hidden,
        &g.weights[OUTPUT_BIAS..],
        &mut expected,
    );
    assert_eq!(actual, expected);
    assert_eq!(actual[0], weak);
}

#[test]
fn dense_program_and_direct_diagnostic_edits_use_the_current_weight_owner() {
    let mut g = diagnostic([0.; OUTPUTS], Some((0, 1, 1.)));
    let c = Config {
        dt: 0.,
        ..Config::default()
    };
    let mut inputs = [0.; INPUTS];
    inputs[0] = 0.5;
    let before = act(&g, &inputs, &mut State::default(), &c, false).turn;
    assert!(before > 0.);
    let sibling = g.clone();
    g.weights[OUTPUT + HIDDEN] = -1.;
    let after = act(&g, &inputs, &mut State::default(), &c, false).turn;
    assert_eq!(after, -before);
    assert_eq!(
        act(&sibling, &inputs, &mut State::default(), &c, false).turn,
        before
    );
    g.weights.fill(0.01);
    let program = g.weights.program();
    assert!(program.input.all_dense && program.output.all_dense);
    let mut actual = [0.; HIDDEN];
    let mut expected = [0.; HIDDEN];
    program.input.apply(
        &g.weights[..RECURRENT],
        &inputs,
        &g.weights[BIAS..OUTPUT],
        &mut actual,
    );
    arithmetic::project(
        &g.weights[..RECURRENT],
        &inputs,
        &g.weights[BIAS..OUTPUT],
        &mut expected,
    );
    assert_eq!(actual, expected);
}

#[test]
fn zero_inherited_recurrence_still_expresses_dense_private_learning() {
    let g = diagnostic([0.; OUTPUTS], Some((0, 1, 1.)));
    let c = Config {
        dt: 0.,
        learning: "plastic".into(),
        ..Config::default()
    };
    let mut learned = g.clone();
    learned.plasticity[0] = 1.;
    let mut state = State::default();
    state.hidden.fill(0.1);
    state.traces.fill(0.1);
    let action = act(&learned, &[0.; INPUTS], &mut state, &c, false);
    assert!(state.hidden.iter().all(|v| *v > 0.));
    assert!(action.turn > 0.);
}
