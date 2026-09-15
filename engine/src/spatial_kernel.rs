//! Symmetric cell-integrated finite-range kernel, including all periodic images.
use std::f64::consts::PI;

#[derive(Clone, Debug)]
pub struct Kernel {
    nx: usize,
    ny: usize,
    x: Vec<(usize, f64)>,
    y: Vec<(usize, f64)>,
    pub area: f64,
}
fn primitive(x: f64, range: f64) -> f64 {
    let t = x.clamp(-range, range);
    t / (2. * range) + (PI * t / range).sin() / (2. * PI)
}
fn axis(n: usize, h: f64, range: f64) -> Vec<(usize, f64)> {
    let reach = (range / h + 0.5).ceil() as isize;
    let mut result: Vec<(usize, f64)> = vec![];
    for i in -reach..=reach {
        let w = primitive((i as f64 + 0.5) * h, range) - primitive((i as f64 - 0.5) * h, range);
        if w == 0. {
            continue;
        }
        let offset = i.rem_euclid(n as isize) as usize;
        if let Some(entry) = result.iter_mut().find(|a| a.0 == offset) {
            entry.1 += w;
        } else {
            result.push((offset, w));
        }
    }
    result
}
impl Kernel {
    pub fn new(nx: usize, ny: usize, h: f64, range: f64) -> Self {
        Self {
            nx,
            ny,
            x: axis(nx, h, range),
            y: axis(ny, h, range),
            area: h * h,
        }
    }
    pub fn pair(&self, a: usize, b: usize) -> f64 {
        let dx = (b % self.nx + self.nx - a % self.nx) % self.nx;
        let dy = (b / self.nx + self.ny - a / self.nx) % self.ny;
        let x = self.x.iter().find(|v| v.0 == dx).map_or(0., |v| v.1);
        let y = self.y.iter().find(|v| v.0 == dy).map_or(0., |v| v.1);
        x * y / self.area
    }
    pub fn convolve(&self, input: &[[f64; 2]], scratch: &mut [[f64; 2]], out: &mut [[f64; 2]]) {
        for y in 0..self.ny {
            for x in 0..self.nx {
                let mut value = [0.; 2];
                for &(offset, w) in &self.x {
                    let v = input[y * self.nx + (x + offset) % self.nx];
                    value[0] += w * v[0];
                    value[1] += w * v[1];
                }
                scratch[y * self.nx + x] = value;
            }
        }
        for y in 0..self.ny {
            for x in 0..self.nx {
                let mut value = [0.; 2];
                for &(offset, w) in &self.y {
                    let v = scratch[((y + offset) % self.ny) * self.nx + x];
                    value[0] += w * v[0];
                    value[1] += w * v[1];
                }
                out[y * self.nx + x] = value;
            }
        }
    }
}
