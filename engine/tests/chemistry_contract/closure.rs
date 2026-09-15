use super::{interactions, lifecycle, machinery, support::*, transport};

// Two species, one external finite volume and one synthetic point-interface compartment.
// No controller, time loop, mutation or population state is modeled here.
#[derive(Clone)]
struct State {
    n: [f64; 5],
    work: f64,
    membrane: f64,
}
impl State {
    fn initial() -> Self {
        Self {
            n: [1., 0.01, 0.01, 1., 0.02],
            work: 3.,
            membrane: 0.2,
        }
    }
    fn matter(&self) -> f64 {
        self.n.iter().sum()
    }
    fn area(&self) -> f64 {
        (self.n[1] + self.n[2] + self.n[3]) / 4.
    }
    fn energy(&self) -> f64 {
        let [outside, feed, product, body, released] = self.n;
        let coupling = |chemical: f64| {
            0.05 + 0.95
                * (1. - (15. * self.membrane - chemical).powi(2) / 9.)
                    .max(0.)
                    .powi(2)
        };
        let q = [
            body * self.membrane + coupling(0.) * feed * 0.5,
            body * (1. - self.membrane) + coupling(1.) * product * 0.5,
        ];
        let interface = interactions::point(1., [1., 0.], q);
        let p = [
            interactions::point(outside, [0., 0.], [0.5, 0.]),
            interactions::point(released, [0., 0.], [0., 0.5]),
            interface,
        ];
        let cross = interactions::stored(&p, 0.)
            - 2. * (outside + released + 1.)
            - (interactions::stored(&[interface], 0.) - 2.);
        let crowd = 0.4 / 3.
            * ((outside + released).powi(3) + (feed + product).powi(3) / self.area().powi(2));
        reference_energy(&self.n, &[6., 6., 2., 2., 2.]) + cross + crowd + self.work
    }
    fn free(&self) -> f64 {
        self.energy()
            + ideal_term(self.n[0], 1.)
            + ideal_term(self.n[4], 1.)
            + ideal_term(self.n[1], self.area())
            + ideal_term(self.n[2], self.area())
    }
    fn directional(&self, transform: impl Fn(&mut Self, f64)) -> f64 {
        let (mut plus, mut minus) = (self.clone(), self.clone());
        transform(&mut plus, 1e-6);
        transform(&mut minus, -1e-6);
        (plus.free() - minus.free()) / 2e-6
    }
    fn convert(&mut self, amount: f64, nu: f64) {
        let z = (2. * self.n[3] * self.work / 8.).sqrt();
        self.n[1] -= amount;
        self.n[2] += amount;
        self.work = battery_energy(z + nu * amount, self.n[3], 8.);
    }
}
fn passive(state: &mut State, next: State, heat: &mut f64, dissipation: &mut f64) {
    assert!(next.free() <= state.free());
    *heat += state.energy() - next.energy();
    *dissipation += state.free() - next.free();
    *state = next;
}
fn settle(
    state: &mut State,
    mut next: State,
    overhead: f64,
    heat: &mut f64,
    dissipation: &mut f64,
) {
    // Preserve charge when body/capacitance changes, then apply paid biological overhead.
    next.work *= state.n[3] / next.n[3];
    let payment = lifecycle::paid_event(
        next.energy() - state.energy(),
        next.free() - state.free(),
        overhead,
    );
    next.work -= payment.work;
    assert!(next.work >= 0.);
    *heat += payment.heat;
    *dissipation += payment.dissipation;
    *state = next;
}

#[test]
fn composed_field_import_conversion_body_remodel_and_release() {
    let mut state = State::initial();
    let initial_matter = state.matter();
    let initial_energy = state.energy();
    let initial_free = state.free();
    let mut heat = 0.;
    let mut dissipation = 0.;

    // Actual finite events are proposed from the selected flux/engagement laws.
    let internal_c = state.n[1] / state.area();
    let affinity = -state.directional(|s, dx| {
        s.n[0] -= dx;
        s.n[1] += dx;
    });
    let excess_jump = -affinity - (internal_c / state.n[0]).ln();
    let delivered = 0.01 * transport::flux(state.n[0], internal_c, excess_jump, 0.2);
    assert!(delivered > 0.);
    let mut next = state.clone();
    next.n[0] -= delivered;
    next.n[1] += delivered;
    passive(&mut state, next, &mut heat, &mut dissipation);

    let feed_activity = (state.directional(|s, dx| s.n[1] += dx) - 6.).exp();
    let product_activity = (state.directional(|s, dx| s.n[2] += dx) - 2.).exp();
    let engagement = machinery::occupancy(&[feed_activity, product_activity]);
    let nu = 0.1;
    let affinity = -state.directional(|s, dx| s.convert(dx, nu));
    let rates = machinery::tendency(engagement.iter().sum(), affinity, machinery::barrier(1.));
    let converted = (0.01 * (rates.0 - rates.1)).min(state.n[1]);
    let mut next = state.clone();
    next.convert(converted, nu);
    assert!(next.work > state.work);
    passive(&mut state, next, &mut heat, &mut dissipation);

    let mut next = state.clone();
    next.n[2] -= converted;
    next.n[3] += converted;
    settle(
        &mut state,
        next,
        0.5 * converted,
        &mut heat,
        &mut dissipation,
    );

    let mut next = state.clone();
    next.membrane = lifecycle::remodel(state.membrane, 0.8, 0.1, state.work, 0.5);
    let overhead = 0.5 * state.n[3] * (next.membrane - state.membrane).abs();
    settle(&mut state, next, overhead, &mut heat, &mut dissipation);

    let mut next = state.clone();
    next.n[3] -= converted;
    next.n[4] += converted;
    settle(&mut state, next, 0., &mut heat, &mut dissipation);

    close(state.matter(), initial_matter, 2e-14);
    close(state.energy() + heat, initial_energy, 2e-13);
    close(state.free() + dissipation, initial_free, 2e-13);
    assert!(state.work >= 0. && state.work < 3.);
    assert!(state.n.iter().all(|n| *n >= 0.));
    assert!(dissipation > 0. && converted > 0.);
    println!(
        "composite material={:.12}, heat={heat:.12}, dissipation={dissipation:.12}",
        state.matter()
    );
}
