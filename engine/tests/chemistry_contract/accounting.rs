use super::support::*;

#[test]
fn units_and_internal_transfers() {
    close(concentration(12., 4.), 3., 1e-14);
    close(disk_area(2., 1., 4., 2.), 1., 1e-14);
    let mut owners = [8., 2., 3.]; // field, internal, body; all in M
    owners[0] -= 1.5;
    owners[1] += 1.5;
    close(owners.iter().sum(), 13., 1e-14);
    close(reference_energy(&owners, &[2., 2., 2.]), 26., 1e-14);
}

#[test]
fn explicit_boundaries_and_work_reservoir() {
    // Initial field 4, source 6, usable energy 2. External renewal adds 3 units.
    let initial = 10. * 3. + 2.;
    let final_energy = 11. * 3. + 1.5;
    let source_input = 3. * 3.;
    let removed = 2. * 3.;
    let heat = 0.5;
    close(initial + source_input, final_energy + removed + heat, 1e-14);
    close(10. + 3., 11. + 2., 1e-14);
    close(battery_energy(0.5, 1., 8.), 1., 1e-14);
    let eps = 1e-6;
    let derivative =
        (battery_energy(0.5 + eps, 1., 8.) - battery_energy(0.5 - eps, 1., 8.)) / (2. * eps);
    close(derivative, 4., 1e-9);
}

#[test]
fn ideal_mixing_is_entropy_change_not_heat() {
    let initial = ideal_free(&[2., 0.], &[1., 1.], &[3., 3.], 1.);
    let final_free = ideal_free(&[1., 1.], &[1., 1.], &[3., 3.], 1.);
    close(initial - final_free, 2. * 2_f64.ln(), 1e-13);
    let energy_before = reference_energy(&[2., 0.], &[3., 3.]);
    let energy_after = reference_energy(&[1., 1.], &[3., 3.]);
    close(energy_before, energy_after, 1e-14);
    let heat_to_bath = energy_before - energy_after;
    close(heat_to_bath, 0., 1e-14);
    assert!(initial - final_free > heat_to_bath);
    close(ideal_term(0., 1.), 0., 0.);
}
