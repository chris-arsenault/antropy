//! Derived periodic attraction; material and chemical exposure remain local.
use rayon::prelude::*;
#[derive(Clone, Debug, Default)]
pub struct Attraction {
    geometry: (usize, usize, f64, f64),
    kernel: BoxKernel,
    input: Vec<f64>,
    temporary: Vec<f64>,
    transposed: Vec<f64>,
    column_scratch: Vec<f64>,
    pub output: Vec<f64>,
    pub revisions: u64,
}

#[derive(Clone, Copy, Debug, Default)]
struct BoxKernel {
    radius: usize,
    edge: f64,
    normalization: f64,
}

impl BoxKernel {
    fn new(width: f64) -> Self {
        let radius = (width + 0.5).floor() as usize;
        Self {
            radius,
            edge: width - radius as f64 + 0.5,
            normalization: 1. / (2. * width),
        }
    }
}

fn next(index: usize, count: usize) -> usize {
    if index + 1 == count { 0 } else { index + 1 }
}

fn box_line(
    out: &mut [f64],
    input: &[f64],
    start: usize,
    stride: usize,
    count: usize,
    kernel: BoxKernel,
) {
    let radius = kernel.radius;
    let interior = 2 * radius - 1;
    let mut remove = (count - (radius - 1) % count) % count;
    let mut left = (count - radius % count) % count;
    let mut right = radius % count;
    // Complete periods contribute their total once, regardless of the reach.
    let mut sum = if interior >= count {
        (0..count).map(|j| input[start + j * stride]).sum::<f64>() * (interior / count) as f64
    } else {
        0.
    };
    for j in 0..interior % count {
        sum += input[start + (remove + j) % count * stride];
    }
    for j in 0..count {
        let a = input[start + left * stride];
        let b = input[start + right * stride];
        out[start + j * stride] = (sum + kernel.edge * (a + b)) * kernel.normalization;
        sum += b - input[start + remove * stride];
        remove = next(remove, count);
        left = next(left, count);
        right = next(right, count);
    }
}

fn box_axis(out: &mut [f64], input: &[f64], nx: usize, ny: usize, kernel: BoxKernel) {
    if kernel.radius == 0 {
        out.copy_from_slice(input);
        return;
    }
    if crate::parallel::enabled(nx * ny, 65536) {
        out.par_chunks_mut(nx)
            .zip(input.par_chunks(nx))
            .for_each(|(out, input)| {
                box_line(out, input, 0, 1, nx, kernel);
            });
    } else {
        for line in 0..ny {
            box_line(out, input, line * nx, 1, nx, kernel);
        }
    }
}

fn transpose(out: &mut [f64], input: &[f64], nx: usize, ny: usize) {
    out.par_chunks_mut(ny).enumerate().for_each(|(x, row)| {
        for (y, value) in row.iter_mut().enumerate() {
            *value = input[y * nx + x];
        }
    });
}

fn box_columns(out: &mut [f64], input: &[f64], nx: usize, ny: usize, kernel: BoxKernel) {
    if kernel.radius == 0 {
        out.copy_from_slice(input);
        return;
    }
    for column in 0..nx {
        box_line(out, input, column, nx, ny, kernel);
    }
}

impl Attraction {
    pub fn prepare(&mut self, geometry: (usize, usize, f64, f64), rows: [&[[f64; 2]]; 3]) {
        let (nx, ny, spacing, length) = geometry;
        if length == 0. {
            return;
        }
        let mut changed = self.geometry != geometry;
        if changed {
            self.geometry = geometry;
            // Integrate the uniform interval [-length, length] over grid cells.
            // Three passes have continuum variance length² on each axis.
            self.kernel = BoxKernel::new(length / spacing);
            self.input.resize(nx * ny, 0.);
            self.temporary.resize(nx * ny, 0.);
            self.output.resize(nx * ny, 0.);
        }
        let update = |(n, value): (usize, &mut f64)| {
            let next = rows[0][n][0] + rows[1][n][0] + rows[2][n][0];
            let changed = *value != next;
            *value = next;
            (changed, next != 0.)
        };
        let merge = |a: (bool, bool), b: (bool, bool)| (a.0 || b.0, a.1 || b.1);
        let state = if crate::parallel::enabled(nx * ny, 65536) {
            self.input
                .par_iter_mut()
                .enumerate()
                .map(update)
                .reduce(|| (false, false), merge)
        } else {
            self.input
                .iter_mut()
                .enumerate()
                .map(update)
                .fold((false, false), merge)
        };
        changed |= state.0;
        if !changed {
            return;
        }
        self.revisions += 1;
        self.output.fill(0.);
        if !state.1 {
            return;
        }
        box_axis(&mut self.temporary, &self.input, nx, ny, self.kernel);
        box_axis(&mut self.output, &self.temporary, nx, ny, self.kernel);
        box_axis(&mut self.temporary, &self.output, nx, ny, self.kernel);
        if crate::parallel::enabled(nx * ny, 65536) {
            self.transposed.resize(nx * ny, 0.);
            self.column_scratch.resize(nx * ny, 0.);
            transpose(&mut self.transposed, &self.temporary, nx, ny);
            box_axis(
                &mut self.column_scratch,
                &self.transposed,
                ny,
                nx,
                self.kernel,
            );
            box_axis(
                &mut self.transposed,
                &self.column_scratch,
                ny,
                nx,
                self.kernel,
            );
            box_axis(
                &mut self.column_scratch,
                &self.transposed,
                ny,
                nx,
                self.kernel,
            );
            transpose(&mut self.output, &self.column_scratch, ny, nx);
        } else {
            box_columns(&mut self.output, &self.temporary, nx, ny, self.kernel);
            box_columns(&mut self.temporary, &self.output, nx, ny, self.kernel);
            box_columns(&mut self.output, &self.temporary, nx, ny, self.kernel);
        }
    }
}

impl crate::field::Field {
    /// Compare actual combined input, including public diagnostic/intervention writes.
    pub fn prepare_attraction(&mut self) {
        self.attraction.prepare(
            (self.nx, self.ny, self.spacing, self.attraction_length),
            [&self.signal, &self.source_signal, &self.body_signal],
        );
        self.broad_attraction.prepare(
            (self.nx, self.ny, self.spacing, 2. * self.attraction_length),
            [&self.signal, &self.source_signal, &self.body_signal],
        );
    }

    pub(crate) fn attractive(&self, n: usize) -> f64 {
        if self.attraction_length == 0. {
            self.medium_signal(n)[0]
        } else {
            self.attraction_strength * (self.attraction.output[n] - self.broad_attraction.output[n])
        }
    }

    /// Material-supported cohesion; removing the supporting medium restores bare loss.
    pub(crate) fn retention(&self, n: usize, scale: f64) -> f64 {
        let [a, b] = self.medium_signal(n);
        let load = self.impedance[n] + self.source_load[n] + self.body_load[n];
        let cohesion = (a * self.attractive(n) - b * b).max(0.) / (1. + load.max(0.));
        crate::field::mobility(cohesion, scale)
    }
}
