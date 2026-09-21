use super::*;

fn check_projection(inventory: &Inventory, chemistry: &Chemistry) {
    let actual = inventory.projection(chemistry);
    let mut expected = [0.; 4];
    for (q, p) in inventory.iter().zip(&chemistry.properties) {
        for (sum, weight) in
            expected
                .iter_mut()
                .zip([p.potential, p.stress, p.interaction[0], p.interaction[1]])
        {
            *sum += q * weight;
        }
    }
    for (a, b) in [
        actual.potential,
        actual.stress,
        actual.interaction[0],
        actual.interaction[1],
    ]
    .into_iter()
    .zip(expected)
    {
        assert!((a - b).abs() < 1e-11 * (1. + b.abs()), "{a} != {b}");
    }
}

#[test]
fn projections_follow_all_owned_mutations_and_proportional_transfers() {
    let chemistry = Chemistry::new(101).unwrap();
    let mut left = Inventory::from(vec![0.01; 256]);
    let mut right = Inventory::from(vec![0.03; 256]);
    check_projection(&left, &chemistry);
    check_projection(&right, &chemistry);
    for round in 0..40 {
        left.set(round, round as f64 * 0.002);
        let mut delta = [0.; 256];
        delta[255 - round] = 0.004;
        delta[round] = -0.1;
        left.apply(&delta);
        left.scale(0.99);
        left.transfer_to(&mut right, 0.1);
        left.exchange_with(&mut right, 0.03);
        // Warm definitions survive ordinary commits, without full reductions.
        assert!(left.projection.get_mut().is_some());
        assert!(right.projection.get_mut().is_some());
        check_projection(&left, &chemistry);
        check_projection(&right, &chemistry);
    }
    check_projection(&left.half(), &chemistry);
    right.fill(0.1);
    left.transfer_to(&mut right, 0.1);
    check_projection(&right, &chemistry);
    right.fill(0.);
    left.exchange_with(&mut right, 0.1);
    check_projection(&right, &chemistry);
    check_projection(&left, &chemistry);
}

#[test]
fn cached_definition_detaches_on_mutable_diagnostics_and_is_not_serialized() {
    let mut chemistry = Chemistry::new(101).unwrap();
    let original = chemistry.clone();
    let mut inventory = Inventory::from(vec![0.01; 256]);
    let bytes = postcard::to_stdvec(&inventory).unwrap();
    check_projection(&inventory, &chemistry);
    assert_eq!(bytes, postcard::to_stdvec(&inventory).unwrap());
    chemistry.properties[0].potential += 9.;
    chemistry.properties[1].stress += 2.;
    chemistry.properties[2].interaction = [-3., 4.];
    assert_ne!(
        chemistry.properties[0].potential,
        original.properties[0].potential
    );
    inventory.set(0, 0.2);
    check_projection(&inventory, &chemistry);
    check_projection(&inventory, &original);
    let mut other = Inventory::from(vec![0.03; 256]);
    check_projection(&other, &chemistry);
    inventory.exchange_with(&mut other, 0.1);
    check_projection(&inventory, &original);
    check_projection(&other, &chemistry);
    let restored: Inventory = postcard::from_bytes(&bytes).unwrap();
    assert!(restored.projection.get().is_none());
    check_projection(&restored, &chemistry);
    let table_bytes = postcard::to_stdvec(&chemistry.properties).unwrap();
    let dense_bytes = postcard::to_stdvec(&*chemistry.properties).unwrap();
    assert_eq!(table_bytes, dense_bytes);
    let restored: PropertyTable = postcard::from_bytes(&table_bytes).unwrap();
    assert!(!restored.same_definition(&chemistry.properties));
    assert_eq!(restored[0].potential, chemistry.properties[0].potential);
}

#[test]
fn mutation_operations_preserve_owned_reduction() {
    let mut inventory = Inventory::from(vec![0.01; 256]);
    inventory.set(17, 3.);
    inventory.scale(0.2);
    let mut delta = [0.; 256];
    delta[17] = -0.2;
    delta[3] = 0.2;
    inventory.apply(&delta);
    inventory.validate().unwrap();
    let child = inventory.half();
    child.validate().unwrap();
    assert_eq!(inventory.material(), child.material() * 2.);
    let bytes = postcard::to_stdvec(&inventory).unwrap();
    let restored: Inventory = postcard::from_bytes(&bytes).unwrap();
    assert_eq!(inventory.material(), restored.material());
}

#[test]
fn sparse_reaction_then_body_transfers_preserve_current_values_and_projections() {
    let chemistry = Chemistry::new(101).unwrap();
    let mut free = Inventory::from(vec![0.; 256]);
    let mut bound = Inventory::from(vec![0.; 256]);
    free.set(3, 2.);
    bound.set(7, 2.);
    check_projection(&free, &chemistry);
    check_projection(&bound, &chemistry);
    free.apply_sparse([(3, -0.5), (11, 0.5)]);
    free.exchange_with(&mut bound, 1.);
    free.transfer_to(&mut bound, 0.5);
    for (s, expected_free, expected_bound) in
        [(3, 0.5625, 0.9375), (7, 0.75, 1.25), (11, 0.1875, 0.3125)]
    {
        assert_eq!(free.value(s), expected_free);
        assert_eq!(bound.value(s), expected_bound);
    }
    free.apply_sparse([(3, -0.1), (11, 0.1)]);
    check_projection(&free, &chemistry);
    check_projection(&bound, &chemistry);
    free.validate().unwrap();
    bound.validate().unwrap();
    let bytes = postcard::to_stdvec(&free).unwrap();
    let restored: Inventory = postcard::from_bytes(&bytes).unwrap();
    assert_eq!(
        free.iter().collect::<Vec<_>>(),
        restored.iter().collect::<Vec<_>>()
    );
    assert_eq!(free.material(), restored.material());
}
