//! Three composed boxes along one axis, evaluated only in owned destination regions.
use crate::spatial::{Geometry, SIDE, SITES};

/// Lines up to this length stay on the stack; longer reaches use a heap buffer.
const INLINE: usize = 128;

/// Reads a dense region-major plane at node coordinates.
#[inline]
fn at(input: &[[f64; SITES]], columns: usize, x: usize, y: usize) -> f64 {
    input[y / SIDE * columns + x / SIDE][y % SIDE * SIDE + x % SIDE]
}

/// Each destination line gathers its finite input once and applies the three boxes in
/// sequence, so intermediate box results never become region-granular planes or halos.
pub fn region(
    input: &[[f64; SITES]],
    geometry: Geometry,
    id: usize,
    width: f64,
    axis: usize,
) -> [f64; SITES] {
    let radius = (width + 0.5).floor() as usize;
    if radius == 0 {
        return input[id];
    }
    let mut result = [0.; SITES];
    let columns = geometry.columns();
    let origin = [
        id % geometry.columns() * SIDE,
        id / geometry.columns() * SIDE,
    ];
    let extent = [geometry.nx, geometry.ny];
    let count = extent[axis];
    let span = SIDE.min(count - origin[axis]);
    let len = span + 6 * radius;
    let mut inline = [0.; 2 * INLINE];
    let mut heap = Vec::new();
    let scratch = if len <= INLINE {
        &mut inline[..2 * len]
    } else {
        heap.resize(2 * len, 0.);
        &mut heap[..]
    };
    let (line, spare) = scratch.split_at_mut(len);
    let start = (origin[axis] + count * (3 * radius).div_ceil(count) - 3 * radius) % count;
    for offset in 0..SIDE {
        let fixed = origin[1 - axis] + offset;
        if fixed >= extent[1 - axis] {
            break;
        }
        let mut p = start;
        for value in line.iter_mut() {
            *value = if axis == 0 {
                at(input, columns, p, fixed)
            } else {
                at(input, columns, fixed, p)
            };
            p = if p + 1 == count { 0 } else { p + 1 };
        }
        let mut valid = len;
        for _ in 0..3 {
            valid = boxed(
                &line[..valid],
                &mut spare[..valid - 2 * radius],
                width,
                radius,
            );
            line[..valid].copy_from_slice(&spare[..valid]);
        }
        for (position, &value) in line[..span].iter().enumerate() {
            let s = if axis == 0 {
                offset * SIDE + position
            } else {
                position * SIDE + offset
            };
            result[s] = value;
        }
    }
    result
}

/// One normalized box of half-width `width`; the outer node on each side has the
/// fractional weight `width - radius + 1/2`. Output shrinks by `radius` on each side.
fn boxed(input: &[f64], output: &mut [f64], width: f64, radius: usize) -> usize {
    let edge = width - radius as f64 + 0.5;
    let mut sum: f64 = input[1..2 * radius].iter().sum();
    for (i, out) in output.iter_mut().enumerate() {
        let (a, b) = (input[i], input[i + 2 * radius]);
        *out = (sum + edge * (a + b)) / (2. * width);
        sum += b - input[i + 1];
    }
    output.len()
}
