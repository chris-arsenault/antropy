use super::{Accounts, DRIFT, bodies::Cloud};
use crate::{chemistry::Chemistry, field::Field};

pub struct Kernel {
    pub profile: Vec<[f64; 2]>,
    pub resistance: Vec<f64>,
    next: Vec<f32>,
    neighbors: Vec<[usize; 4]>,
    rows: [[f32; 256]; 3],
    responses: [[f64; 256]; 2],
    max_diffusion: f64,
    pub drift: f64,
}
impl Kernel {
    pub fn new(field: &Field, chemistry: &Chemistry) -> Self {
        Self {
            profile: vec![[0.; 2]; field.nx * field.ny],
            resistance: vec![1.; field.nx * field.ny],
            next: vec![0.; field.amounts.len()],
            neighbors: (0..field.nx * field.ny)
                .map(|i| {
                    let x = i % field.nx;
                    let n = field.nx * field.ny;
                    [
                        i - x + (x + 1) % field.nx,
                        i - x + (x + field.nx - 1) % field.nx,
                        (i + field.nx) % n,
                        (i + n - field.nx) % n,
                    ]
                })
                .collect(),
            rows: std::array::from_fn(|k| {
                std::array::from_fn(|s| {
                    let p = &chemistry.properties[s];
                    if k == 0 {
                        p.diffusion as f32
                    } else {
                        p.interaction[k - 1] as f32
                    }
                })
            }),
            responses: std::array::from_fn(|k| {
                std::array::from_fn(|s| chemistry.properties[s].interaction[k])
            }),
            max_diffusion: chemistry
                .properties
                .iter()
                .map(|p| p.diffusion)
                .fold(0., f64::max),
            drift: DRIFT,
        }
    }
    pub fn material(
        &self,
        cell: &crate::organism::Cell,
        membrane: [f64; 2],
        config: &crate::config::Config,
    ) -> super::bodies::Material {
        super::bodies::Material::project(cell, membrane, &self.responses, config)
    }
    pub fn refresh(&mut self, field: &Field, clouds: &[Cloud]) {
        let area = field.spacing * field.spacing;
        for (i, amounts) in field.amounts.chunks_exact(256).enumerate() {
            self.profile[i] =
                [1, 2].map(|k| crate::numeric::dot(amounts, &self.rows[k]) as f64 / area);
            self.resistance[i] = 1. + field.impedance[i] / 12.;
        }
        for cloud in clouds {
            for &(node, weight) in &cloud.weights {
                for k in 0..2 {
                    self.profile[node][k] += weight * cloud.profile[k] / area;
                }
            }
        }
    }
    pub fn gradient(&self, field: &Field, cloud: &Cloud) -> [[f64; 2]; 2] {
        let mut result = [[0.; 2]; 2];
        for &(i, w) in &cloud.weights {
            let [right, left, down, up] = self.neighbors[i];
            let neighbors = [[right, left], [down, up]];
            for (axis, row) in result.iter_mut().enumerate() {
                for (k, value) in row.iter_mut().enumerate() {
                    *value += w
                        * (self.profile[neighbors[axis][0]][k]
                            - self.profile[neighbors[axis][1]][k])
                        / (2. * field.spacing);
                }
            }
        }
        result
    }
    fn coefficients(&self, field: &Field, i: usize, dt: f64) -> [[f32; 3]; 4] {
        let h = field.spacing;
        self.neighbors[i].map(|j| {
            let delta = [0, 1].map(|k| self.profile[j][k] - self.profile[i][k]);
            let scale = self.drift / h / (1. + delta[0].abs() + delta[1].abs());
            let interval = dt * 2. / (self.resistance[i] + self.resistance[j]);
            [
                (interval / (h * h)) as f32,
                (interval * delta[0] * scale) as f32,
                (interval * delta[1] * scale) as f32,
            ]
        })
    }
    pub fn advance(
        &mut self,
        field: &mut Field,
        chemistry: &Chemistry,
        clouds: &[Cloud],
        dt: f64,
        books: &mut Accounts,
    ) -> Result<usize, String> {
        self.advance_washout(field, chemistry, clouds, dt, 0., books)
    }
    pub fn advance_washout(
        &mut self,
        field: &mut Field,
        chemistry: &Chemistry,
        clouds: &[Cloud],
        dt: f64,
        washout: f64,
        books: &mut Accounts,
    ) -> Result<usize, String> {
        if !dt.is_finite()
            || dt <= 0.
            || !self.drift.is_finite()
            || self.drift < 0.
            || !washout.is_finite()
            || washout < 0.
        {
            return Err("Invalid composed transport clock or drift".into());
        }
        let bound = 4. * (self.max_diffusion / field.spacing.powi(2) + self.drift / field.spacing);
        let steps = (dt * bound / 0.5).ceil().max(1.) as usize;
        if steps > 64 {
            return Err("Composed transport exceeds 64 substeps".into());
        }
        let factor = (-washout * dt / steps as f64).exp();
        for _ in 0..steps {
            self.refresh(field, clouds);
            let mut valid = true;
            for i in 0..self.profile.len() {
                let coefficients = self.coefficients(field, i, dt / steps as f64);
                valid &= super::numeric::transport(
                    &field.amounts[i * 256..(i + 1) * 256],
                    self.neighbors[i].map(|j| &field.amounts[j * 256..(j + 1) * 256]),
                    &mut self.next[i * 256..(i + 1) * 256],
                    &self.rows,
                    coefficients,
                    factor as f32,
                );
            }
            if !valid {
                return Err("Invalid composed transport proposal; owners retained".into());
            }
            let before = field.totals(chemistry);
            std::mem::swap(&mut self.next, &mut field.amounts);
            field.refresh(chemistry);
            let after = field.totals(chemistry);
            books.boundary_material -= before.0 * (1. - factor);
            books.boundary_energy -= before.1 * (1. - factor);
            books.material_error += before.0 * factor - after.0;
            books.energy_error += before.1 * factor - after.1;
        }
        Ok(steps)
    }
    pub fn owned_bytes(&self) -> usize {
        self.next.capacity() * 4
            + self.neighbors.capacity() * size_of::<[usize; 4]>()
            + self.profile.capacity() * 16
            + self.resistance.capacity() * 8
            + std::mem::size_of::<Self>()
    }
}
