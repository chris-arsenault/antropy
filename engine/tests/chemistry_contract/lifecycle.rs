use super::support::*;

pub struct Payment {
    pub work: f64,
    pub heat: f64,
    pub dissipation: f64,
}
pub fn paid_event(delta_energy: f64, delta_free: f64, overhead: f64) -> Payment {
    let work = delta_free.max(0.) + overhead;
    Payment {
        work,
        heat: work - delta_energy,
        dissipation: work - delta_free,
    }
}
fn affordable(work: f64, available: f64) -> bool {
    work <= available
}
fn partition(stocks: &[f64], fraction: f64) -> Vec<f64> {
    stocks.iter().map(|b| b * fraction).collect()
}
pub fn remodel(current: f64, target: f64, dt: f64, work: f64, cost_per_distance: f64) -> f64 {
    let requested = (target - current) * -(-dt).exp_m1();
    if requested == 0. {
        return current;
    }
    let amount = requested.abs().min(work / cost_per_distance);
    current + requested.signum() * amount
}

#[test]
fn assimilation_repair_and_death_close_material_and_energy() {
    for u in [0.5, 8.] {
        // One material unit: chemical -> built -> repaired built -> ordinary debris.
        let mut inventory = [1., 0.3, 0.]; // initial substrate, repair substrate, debris
        let before = reference_energy(&inventory, &[u, 2., 2.]);
        let initial_matter: f64 = inventory.iter().sum();
        inventory[0] -= 1.;
        let mut built = 1.;
        let build = paid_event(2. - u, 2. - u, 0.5);
        inventory[1] -= 0.3;
        inventory[2] += 0.3; // equal damaged stock leaves during replacement
        let repair = paid_event(0., 0., 0.5 * 0.3);
        inventory[2] += built;
        built = 0.;
        let death = paid_event(0., 0., 0.);
        close(
            before + build.work + repair.work + death.work,
            reference_energy(&inventory, &[u, 2., 2.])
                + 2. * built
                + build.heat
                + repair.heat
                + death.heat,
            2e-14,
        );
        close(initial_matter, inventory.iter().sum::<f64>() + built, 1e-14);
        assert!(build.work >= 0.5 && repair.work > 0.);
        assert!(build.dissipation >= 0.5);
    }
}

#[test]
fn birth_partitions_actual_stocks_damage_and_capacitor() {
    let stocks = [1., 0.2, 0.1];
    let left = partition(&stocks, 0.5);
    let right = partition(&stocks, 0.5);
    close(
        left.iter().sum::<f64>() + right.iter().sum::<f64>(),
        1.3,
        1e-14,
    );
    let damage = 0.3;
    close(
        left.iter().sum::<f64>() * damage + right.iter().sum::<f64>() * damage,
        stocks.iter().sum::<f64>() * damage,
        1e-14,
    );
    close(
        2. * battery_energy(0.3, 0.5, 8.),
        battery_energy(0.6, 1., 8.),
        1e-14,
    );
    let arbitrary_target = [100.; 3];
    assert!(
        left.iter()
            .zip(arbitrary_target)
            .all(|(actual, target)| *actual < target)
    );
}

#[test]
fn paid_installed_and_membrane_changes_are_continuous() {
    close(remodel(0.2, 0.9, 0.1, 0., 0.5), 0.2, 0.);
    let large = remodel(0.2, 0.9, 0.1, 1., 0.5);
    assert!(large > 0.2 && large < 0.9);
    let delta = remodel(0.2, 0.2 + 1e-6, 0.1, 1., 0.5) - 0.2;
    assert!(delta > 0. && delta < 1e-6);
    close(remodel(0.2, 0.2, 0.1, 1., 0.5), 0.2, 0.);
    // Same continuous mechanism for a membrane coordinate and successive targets.
    let membrane = remodel(0.2, 0.9, 0.1, 0.001, 0.5);
    assert!((membrane - 0.2) * 0.5 <= 0.001 + 1e-14);
    let retargeted = remodel(membrane, 0., 0.1, 1., 0.5);
    assert!(retargeted >= 0. && retargeted < membrane);
}

#[test]
fn interface_growth_and_fission_pay_state_change() {
    // Physical cross energy Q*phi: growth changes Q, placement changes phi.
    let before = 2. * -0.3;
    let grown = 3. * -0.3;
    let growth = paid_event(grown - before, grown - before, 0.5);
    close(growth.heat, growth.work - (grown - before), 1e-14);
    let daughters = 1.5 * -0.1 + 1.5 * 0.2;
    let division = paid_event(daughters - grown, daughters - grown, 0.08);
    assert!(division.work > 0.08);
    close(grown + division.work, daughters + division.heat, 1e-14);
    assert!(!affordable(division.work, 0.1));
    // Removing an attractive interface can cost work even at identical chemical reference U.
    let dissolution = paid_event(0. - before, 0. - before, 0.);
    assert!(!affordable(dissolution.work, 0.));
}
