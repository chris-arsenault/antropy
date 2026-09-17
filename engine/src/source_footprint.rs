//! Radius-dependent source shape, translated with the ordinary geographic interpolation.
use crate::field::Field;

#[derive(Clone, Debug, Default)]
pub struct Kernel {
    geometry: (usize, usize, f64, f64),
    rows: Vec<(usize, [f64; 4])>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn motion_reuses_kernel_and_is_continuous_across_grid_and_periodic_edges() {
        let field = Field::new(24., 24., 2.);
        let mut kernel = Kernel::default();
        kernel.prepare(2., &field);
        let pointer = kernel.rows.as_ptr();
        for x in [0., 1., 11., 24.] {
            kernel.prepare(2., &field);
            assert_eq!(pointer, kernel.rows.as_ptr());
            let mut left = vec![];
            let mut right = vec![];
            kernel.translate(x - 1e-8, 7.3, &field, &mut left);
            kernel.translate(x + 1e-8, 7.3, &field, &mut right);
            let mut difference = vec![0.; field.nx * field.ny];
            for (n, w) in left {
                difference[n] += w;
            }
            for (n, w) in right {
                difference[n] -= w;
            }
            assert!(difference.iter().map(|v| v.abs()).sum::<f64>() < 1e-7);
        }
    }
}

impl Kernel {
    pub fn prepare(&mut self, radius: f64, field: &Field) {
        let geometry = (field.nx, field.ny, field.spacing, radius);
        if self.geometry == geometry {
            return;
        }
        self.geometry = geometry;
        let radius = radius.max(field.spacing * 0.25);
        let mut base = vec![];
        let range = |size: usize| {
            let reach = (3. * radius / field.spacing).min(size as f64).floor() as isize;
            let (lo, count) = if 2 * reach + 1 >= size as isize {
                (0, size)
            } else {
                (-reach, (2 * reach + 1) as usize)
            };
            (lo..lo + count as isize).map(move |i| i.rem_euclid(size as isize) as usize)
        };
        for y in range(field.ny) {
            for x in range(field.nx) {
                let dx = x.min(field.nx - x) as f64 * field.spacing;
                let dy = y.min(field.ny - y) as f64 * field.spacing;
                let scaled = (dx / radius).powi(2) + (dy / radius).powi(2);
                if scaled <= 9. {
                    base.push((x, y, (-scaled / 2.).exp()));
                }
            }
        }
        let total = base.iter().map(|(_, _, w)| w).sum::<f64>();
        let mut rows = std::collections::BTreeMap::<usize, [f64; 4]>::new();
        for (x, y, w) in base {
            for (j, (dx, dy)) in [(0, 0), (1, 0), (0, 1), (1, 1)].into_iter().enumerate() {
                let n = ((y + dy) % field.ny) * field.nx + (x + dx) % field.nx;
                rows.entry(n).or_default()[j] += w / total;
            }
        }
        self.rows = rows.into_iter().collect();
    }

    pub fn translate(&self, x: f64, y: f64, field: &Field, out: &mut Vec<(usize, f64)>) {
        let sites = field.stencil(x, y);
        let (ox, oy) = (sites[0].0 % field.nx, sites[0].0 / field.nx);
        out.clear();
        out.extend(self.rows.iter().filter_map(|&(offset, coefficients)| {
            let w = coefficients
                .iter()
                .zip(sites)
                .map(|(a, (_, b))| a * b)
                .sum::<f64>();
            let n = ((offset / field.nx + oy) % field.ny) * field.nx
                + (offset % field.nx + ox) % field.nx;
            (w > 0.).then_some((n, w))
        }));
    }
}
