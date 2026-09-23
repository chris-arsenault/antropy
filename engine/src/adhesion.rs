//! Compatibility-weighted contact adhesion: touching cells share part of their intended motion.
//! Each pass replaces a displacement by a convex combination of itself and its contacting
//! neighbours', so relative motion inside a compatible group decays while the group can still
//! move together. Nothing exceeds the displacements the motors and passive response produced,
//! and no work is credited.
use crate::{movement::geometry::Contacts, organism::Cell};

/// Jacobi passes per step; the group relaxes toward shared motion over a few contact hops.
pub const PASSES: usize = 4;

/// Pair affinity from installed membrane profiles [a, b, impedance], by the same product rule
/// as the shared response: like attraction properties bind, like repulsion properties oppose.
pub fn compatibility(a: [f64; 3], b: [f64; 3]) -> f64 {
    (a[0] * b[0] - a[1] * b[1]).clamp(0., 1.)
}

/// Blend intended displacements across overlapping contacts with weight `strength × c_ij`.
pub fn blend(displacements: &mut [[f64; 2]], cells: &[Cell], contacts: &Contacts, strength: f64) {
    if strength <= 0. || contacts.edges.is_empty() {
        return;
    }
    let n = displacements.len();
    let profile = |i: usize| cells[i].operators.as_ref().map_or([0.; 3], |o| o.profile);
    let mut offsets = vec![0usize; n + 1];
    let edges: Vec<_> = contacts
        .edges
        .iter()
        .filter(|e| e.i < n && e.j < n && e.weight() > 0.)
        .map(|e| {
            (
                e.i,
                e.j,
                strength * compatibility(profile(e.i), profile(e.j)),
            )
        })
        .filter(|&(_, _, w)| w > 0.)
        .collect();
    if edges.is_empty() {
        return;
    }
    for &(i, j, _) in &edges {
        offsets[i + 1] += 1;
        offsets[j + 1] += 1;
    }
    for k in 0..n {
        offsets[k + 1] += offsets[k];
    }
    let mut next = offsets.clone();
    let mut neighbours = vec![(0usize, 0f64); offsets[n]];
    for &(i, j, w) in &edges {
        neighbours[next[i]] = (j, w);
        next[i] += 1;
        neighbours[next[j]] = (i, w);
        next[j] += 1;
    }
    let mut current = displacements.to_vec();
    for _ in 0..PASSES {
        let previous = current.clone();
        let cost = crate::parallel::cost::CELL_READ;
        crate::parallel::for_each(&mut current, cost, |i, d| {
            let range = &neighbours[offsets[i]..offsets[i + 1]];
            if range.is_empty() {
                return;
            }
            let mut sum = previous[i];
            let mut total = 1.;
            for &(j, w) in range {
                sum[0] += w * previous[j][0];
                sum[1] += w * previous[j][1];
                total += w;
            }
            *d = sum.map(|v| v / total);
        });
    }
    displacements.copy_from_slice(&current);
}
