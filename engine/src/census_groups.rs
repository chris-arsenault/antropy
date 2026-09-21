//! Observer-only density connectivity at finite spatial resolution, independent of cell density.
use crate::world::World;
use std::collections::{BTreeMap, HashMap};

const REACH: f64 = 6.;
const MINIMUM: usize = 3;

pub(super) fn groups(w: &World) -> Vec<Vec<usize>> {
    let extent = [w.config.width, w.config.height];
    let shape = extent.map(|v| (v / (REACH / 4.)).ceil().max(1.) as usize);
    let spacing: [f64; 2] = std::array::from_fn(|k| extent[k] / shape[k] as f64);
    let mut bins = BTreeMap::<[usize; 2], Vec<usize>>::new();
    for (i, c) in w.cells.iter().enumerate() {
        let position = [c.x, c.y];
        let key = std::array::from_fn(|k| {
            ((position[k].rem_euclid(extent[k]) / spacing[k]) as usize).min(shape[k] - 1)
        });
        bins.entry(key).or_default().push(i);
    }
    let (keys, members): (Vec<_>, Vec<_>) = bins.into_iter().unzip();
    let index: HashMap<_, _> = keys.iter().enumerate().map(|(i, &k)| (k, i)).collect();
    let offsets = stencil(shape, spacing);
    let neighbors: Vec<Vec<usize>> = keys
        .iter()
        .map(|key| {
            offsets
                .iter()
                .filter_map(|offset| {
                    let k = std::array::from_fn(|a| (key[a] + offset[a]) % shape[a]);
                    index.get(&k).copied()
                })
                .collect()
        })
        .collect();
    let core: Vec<_> = neighbors
        .iter()
        .map(|row| row.iter().map(|&i| members[i].len()).sum::<usize>() >= MINIMUM)
        .collect();
    let mut assigned = vec![false; keys.len()];
    let mut result = vec![];
    for i in 0..keys.len() {
        if assigned[i] || !core[i] {
            continue;
        }
        let mut queue = vec![i];
        let mut group = vec![];
        assigned[i] = true;
        let mut cursor = 0;
        while cursor < queue.len() {
            let j = queue[cursor];
            group.extend_from_slice(&members[j]);
            if core[j] {
                for &k in &neighbors[j] {
                    if !assigned[k] {
                        assigned[k] = true;
                        queue.push(k);
                    }
                }
            }
            cursor += 1;
        }
        result.push(group);
    }
    result
}

fn stencil(shape: [usize; 2], spacing: [f64; 2]) -> Vec<[usize; 2]> {
    // Wrapped offsets are unique even when the observation reach exceeds the world.
    let reach = spacing.map(|s| (REACH / s).ceil() as isize);
    let mut offsets = std::collections::BTreeSet::new();
    for y in -reach[1]..=reach[1] {
        for x in -reach[0]..=reach[0] {
            if (x as f64 * spacing[0]).powi(2) + (y as f64 * spacing[1]).powi(2) <= REACH * REACH {
                offsets.insert([
                    x.rem_euclid(shape[0] as isize) as usize,
                    y.rem_euclid(shape[1] as isize) as usize,
                ]);
            }
        }
    }
    offsets.into_iter().collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn dense_colonies_have_bounded_observation_work_and_unique_members() {
        let mut w = World::new(101, crate::config::Config::default()).unwrap();
        let cell = w.cells[0].clone();
        w.cells = vec![cell; 10_000];
        for (i, cell) in w.cells.iter_mut().enumerate() {
            cell.x = if i < 5000 { 2. } else { 40. };
            cell.y = 2.;
        }
        let groups = groups(&w);
        assert_eq!(groups.len(), 2);
        assert!(groups.iter().all(|g| g.len() == 5000));
        let unique: std::collections::BTreeSet<_> = groups.into_iter().flatten().collect();
        assert_eq!(unique.len(), w.cells.len());
        assert!(stencil([214, 160], [320. / 214., 1.5]).len() < 100);
    }

    #[test]
    fn tiny_periodic_world_does_not_count_neighbors_twice() {
        assert_eq!(stencil([1, 1], [1., 1.]), vec![[0, 0]]);
        assert_eq!(stencil([2, 2], [1., 1.]).len(), 4);
    }
}
