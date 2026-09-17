//! Compiled local chemical response; material and configuration determine conversion.
use crate::{chemical_projection::lanes, chemistry::Chemistry, config::Config, weathering};

#[derive(Clone, Debug, Default)]
pub struct Climate {
    pub operators: Option<weathering::Operators>,
    changes: Vec<f64>,
    impedance_scale: f64,
    rate: f64,
    feedback: bool,
    floor: f64,
    pub heat: f64,
    pub converted: f64,
    pub prevented: f64,
}

impl Climate {
    pub fn new(config: &Config, chemistry: &Chemistry) -> Self {
        Self {
            operators: Some(weathering::Operators::new(chemistry)),
            changes: vec![0.; 256],
            floor: crate::field_activity::CONCENTRATION_FLOOR as f64 * config.mesh.powi(2),
            ..Self::default()
        }
    }

    pub fn prepare(&mut self, config: &Config) {
        self.rate = config.weathering_rate;
        self.feedback = config.habitat_feedback;
        self.impedance_scale = config.diffusion_impedance;
        self.heat = 0.;
        self.converted = 0.;
        self.prevented = 0.;
    }

    pub fn convert(
        &mut self,
        row: &mut [f32],
        mut mask: u64,
        medium: ([f64; 2], f64),
        dt: f64,
    ) -> u64 {
        if self.rate == 0. || mask == 0 {
            return mask;
        }
        let mut active = mask;
        mask &= self.operators.as_ref().unwrap().active_groups;
        if mask == 0 {
            return active;
        }
        let exposure = weathering::exposure(1., medium.1, self.feedback, self.impedance_scale);
        let signal = weathering::signal(medium.0);
        let elapsed = [self.rate * dt * exposure, self.rate * dt];
        if elapsed[0] == 0. || weathering::strength(signal) == 0. {
            return active;
        }
        while mask != 0 {
            let start = mask.trailing_zeros() as usize * 4;
            mask &= mask - 1;
            active |= self.convert_pair(row, start, signal, elapsed);
            active |= self.convert_pair(row, start + 2, signal, elapsed);
        }
        // One rounded commit after every donor has reserved against the original row.
        let mut changed = active;
        active = 0;
        while changed != 0 {
            let s = changed.trailing_zeros() as usize * 4;
            changed &= changed - 1;
            for (i, value) in row.iter_mut().enumerate().skip(s).take(4) {
                *value = (*value as f64 + self.changes[i]) as f32;
                if (*value as f64) < self.floor {
                    *value = 0.;
                }
                if *value > 0. {
                    active |= 1 << (i / 4);
                }
                self.changes[i] = 0.;
            }
        }
        active
    }
    fn convert_pair(&mut self, row: &[f32], s: usize, signal: [f64; 2], elapsed: [f64; 2]) -> u64 {
        let minimum =
            weathering::minimum_donor(self.floor, elapsed[0] * weathering::strength(signal));
        if row[s] as f64 <= minimum && row[s + 1] as f64 <= minimum {
            return 0;
        }
        let operators = self.operators.as_ref().unwrap();
        if !operators.reactive[s] && !operators.reactive[s + 1] {
            return 0;
        }
        let engagement = operators.engagement_pair(s, signal);
        let fractions = weathering::allocate_pair(engagement, elapsed[0]);
        let total = engagement
            .iter()
            .fold(lanes::zero(), |a, &b| lanes::add(a, b));
        let hazard = lanes::mul(total, lanes::splat(elapsed[1]));
        let bare = lanes::div(hazard, lanes::add(lanes::splat(1.), hazard));
        let q = lanes::load_material(&row[s..]);
        let mut active = 0;
        let mut converted = lanes::zero();
        let mut heat = lanes::zero();
        for (j, fraction) in fractions.into_iter().enumerate() {
            let loss = lanes::mul(q, fraction);
            converted = lanes::add(converted, loss);
            heat = lanes::add(heat, lanes::mul(loss, lanes::load(&operators.heat[j][s..])));
            let mut amounts = [0.; 2];
            lanes::store(&mut amounts, loss);
            for (lane, amount) in amounts.into_iter().enumerate() {
                if amount == 0. {
                    continue;
                }
                let donor = s + lane;
                let target = operators.destination[donor][j];
                self.changes[target] += amount;
                active |= 1 << (target / 4);
            }
        }
        let retained = lanes::sub(lanes::load(&self.changes[s..]), converted);
        lanes::store(&mut self.changes[s..], retained);
        self.converted += lanes::total(converted);
        self.heat += lanes::total(heat);
        if elapsed[0] < elapsed[1] {
            self.prevented += lanes::total(lanes::sub(lanes::mul(q, bare), converted));
        }
        active
    }
}

pub fn local(w: &crate::world::World, x: f64, y: f64) -> [f64; 3] {
    let sites = w.field.stencil(x, y);
    let mut medium: [f64; 2] = std::array::from_fn(|k| {
        sites
            .iter()
            .map(|&(n, a)| a * (w.field.signal[n][k] + w.field.source_signal[n][k]))
            .sum()
    });
    crate::footprint::visit_current(w, |node, profile| {
        if let Some((_, weight)) = sites.iter().find(|(n, _)| *n == node) {
            for k in 0..2 {
                medium[k] += weight * profile[k];
            }
        }
    });
    let ambient = weathering::strength(weathering::signal(medium));
    let load = w.field.medium_load(&sites);
    let effective = weathering::exposure(
        ambient,
        load,
        w.config.habitat_feedback,
        w.config.diffusion_impedance,
    );
    [
        ambient,
        effective,
        if ambient > 0. {
            1. - effective / ambient
        } else {
            0.
        },
    ]
}
