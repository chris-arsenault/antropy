//! Diagnostic implementation of one shared, separable attraction convolution.
pub struct Kernel {
    weights: Vec<f64>,
    temporary: Vec<f64>,
    pub output: Vec<f64>,
}

fn add_shifted(out: &mut [f64], input: &[f64], shift: usize, weight: f64) {
    let split = input.len() - shift;
    for (a, b) in out[..split].iter_mut().zip(&input[shift..]) {
        *a += weight * b;
    }
    for (a, b) in out[split..].iter_mut().zip(&input[..shift]) {
        *a += weight * b;
    }
}

impl Kernel {
    pub fn new(nx: usize, ny: usize, spacing: f64, length: f64) -> Self {
        let radius = (3. * length / spacing).ceil() as isize;
        let mut weights: Vec<_> = (-radius..=radius)
            .map(|j| (-0.5 * (j as f64 * spacing / length).powi(2)).exp())
            .collect();
        let total: f64 = weights.iter().sum();
        for w in &mut weights {
            *w /= total;
        }
        Self {
            weights,
            temporary: vec![0.; nx * ny],
            output: vec![0.; nx * ny],
        }
    }

    pub fn apply(&mut self, input: &[f64], nx: usize, ny: usize) {
        assert_eq!(input.len(), nx * ny);
        self.temporary.fill(0.);
        self.output.fill(0.);
        let radius = (self.weights.len() / 2) as isize;
        for (j, &weight) in self.weights.iter().enumerate() {
            let shift = (j as isize - radius).rem_euclid(nx as isize) as usize;
            for (out, row) in self
                .temporary
                .chunks_exact_mut(nx)
                .zip(input.chunks_exact(nx))
            {
                add_shifted(out, row, shift, weight);
            }
        }
        for (j, &weight) in self.weights.iter().enumerate() {
            let shift = (j as isize - radius).rem_euclid(ny as isize) as usize * nx;
            add_shifted(&mut self.output, &self.temporary, shift, weight);
        }
    }
}

pub fn benchmark() -> serde_json::Value {
    let mut rows = vec![];
    for (nx, ny) in [(160, 120), (640, 480)] {
        let input: Vec<_> = (0..nx * ny).map(|n| (n as f64 * 0.013).sin()).collect();
        let mut k = Kernel::new(nx, ny, 2., 6.);
        let mut times = vec![];
        for i in 0..120 {
            let start = std::time::Instant::now();
            k.apply(std::hint::black_box(&input), nx, ny);
            std::hint::black_box(&k.output);
            if i >= 20 {
                times.push(start.elapsed().as_secs_f64() * 1000.);
            }
        }
        times.sort_by(f64::total_cmp);
        let sum_error = (k.output.iter().sum::<f64>() - input.iter().sum::<f64>()).abs();
        assert!(sum_error < 1e-8);
        k.apply(&vec![1.; nx * ny], nx, ny);
        assert!(k.output.iter().all(|v| (v - 1.).abs() < 1e-12));
        rows.push(serde_json::json!({"nx":nx,"ny":ny,"medianMs":times[50],
            "p95Ms":times[95],"sumError":sum_error,"scratchBytes":nx*ny*8*3}));
    }
    serde_json::json!({"driver":"native-release","length":6,"rows":rows})
}
