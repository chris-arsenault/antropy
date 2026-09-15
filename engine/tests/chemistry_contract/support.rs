pub fn close(actual: f64, expected: f64, tolerance: f64) {
    assert!(actual.is_finite() && expected.is_finite());
    assert!(
        (actual - expected).abs() <= tolerance,
        "actual={actual:.16e}, expected={expected:.16e}, tolerance={tolerance:.3e}"
    );
}

pub fn concentration(amount: f64, area: f64) -> f64 {
    assert!(amount >= 0. && area > 0.);
    amount / area
}

pub fn disk_area(body: f64, internal: f64, body_density: f64, internal_density: f64) -> f64 {
    body / body_density + internal / internal_density
}

pub fn reference_energy(amounts: &[f64], potentials: &[f64]) -> f64 {
    assert_eq!(amounts.len(), potentials.len());
    amounts.iter().zip(potentials).map(|(n, u)| n * u).sum()
}

pub fn ideal_term(amount: f64, area: f64) -> f64 {
    assert!(amount >= 0. && area > 0.);
    if amount == 0. {
        0.
    } else {
        amount * ((amount / area).ln() - 1.)
    }
}

pub fn ideal_free(amounts: &[f64], areas: &[f64], potentials: &[f64], temperature: f64) -> f64 {
    reference_energy(amounts, potentials)
        + temperature
            * amounts
                .iter()
                .zip(areas)
                .map(|(n, area)| ideal_term(*n, *area))
                .sum::<f64>()
}

pub fn battery_energy(charge: f64, body: f64, stiffness: f64) -> f64 {
    assert!(body > 0. && (0. ..=body).contains(&charge));
    stiffness * charge * charge / (2. * body)
}
