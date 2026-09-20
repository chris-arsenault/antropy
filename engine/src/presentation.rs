use crate::{
    genetics::{Chromosome, Compiled},
    organism::Cell,
    world::World,
};
use std::collections::BTreeMap;

#[derive(Default)]
pub struct Colors {
    selection: Option<(u32, u64, Option<u64>)>,
    genomes: BTreeMap<u64, [f32; 3]>,
    cells: BTreeMap<u64, [f32; 3]>,
    ancestors: BTreeMap<u64, u64>,
}
pub fn hue_rgb(h: f64) -> [f32; 3] {
    std::array::from_fn(|i| {
        let k = (h * 6. + [0., 4., 2.][i]).rem_euclid(6.);
        (0.9 - 0.65 * k.min(4. - k).clamp(0., 1.)) as f32
    })
}
fn heat(f: f64) -> [f32; 3] {
    hue_rgb((220. - 190. * f.clamp(0., 1.)) / 360.)
}
pub fn family(w: &World, c: &Cell) -> u64 {
    let mut id = c.id;
    for _ in 0..c.generation % 4 {
        if let Some(p) = w.ancestry[id as usize - 1].parent() {
            id = p;
        }
    }
    id
}
pub fn ancestor_path(w: &World, mut id: u64) -> BTreeMap<u64, u64> {
    let mut path = BTreeMap::new();
    let mut depth = 0;
    while let Some(a) = id.checked_sub(1).and_then(|i| w.ancestry.get(i as usize)) {
        path.insert(id, depth);
        depth += 1;
        let Some(p) = a.parent() else {
            break;
        };
        id = p;
    }
    path
}
pub fn links(w: &World, reference: u64, id: u64, path: &BTreeMap<u64, u64>) -> Option<(u64, u64)> {
    let a = w.ancestry.get(reference.checked_sub(1)? as usize)?;
    let b = w.ancestry.get(id.checked_sub(1)? as usize)?;
    if a.lineage != b.lineage {
        return None;
    }
    let mut cursor = id;
    let mut steps = 0;
    loop {
        if let Some(n) = path.get(&cursor) {
            return Some((cursor, steps + n));
        }
        cursor = w.ancestry.get(cursor as usize - 1)?.parent()?;
        steps += 1;
    }
}
fn physical(g: &Chromosome) -> Vec<f64> {
    let mut out: Vec<_> = g.physical.iter().map(|v| *v as f64).collect();
    let m = &g.chemistry;
    out.extend(m.inward);
    out.extend(m.programs.map(f64::from));
    for r in &m.receptors {
        out.extend([r.x / 15., r.y / 15.]);
    }
    for t in &m.transporters {
        out.extend([t.x / 15., t.y / 15.]);
    }
    for e in &m.enzymes {
        out.extend([e.x / 15., e.y / 15., e.center_x / 15., e.center_y / 15.]);
    }
    out.extend([m.membrane.x / 15., m.membrane.y / 15.]);
    out
}
pub fn physical_distance(a: &Chromosome, b: &Chromosome) -> f64 {
    let left = physical(a);
    let right = physical(b);
    let angles: f64 = a
        .chemistry
        .enzymes
        .iter()
        .zip(&b.chemistry.enzymes)
        .map(|(a, b)| {
            (crate::genetics::angles::difference(a.angle, b.angle) / std::f64::consts::TAU).powi(2)
        })
        .sum();
    ((angles
        + left
            .iter()
            .zip(&right)
            .map(|(x, y)| (x - y).powi(2))
            .sum::<f64>())
        / (left.len() + crate::organism::MAX_ENZYMES) as f64)
        .sqrt()
}
fn genotype_color(g: &Compiled, reference: Option<&Compiled>, mode: u32) -> [f32; 3] {
    let m = &g.chromosome.chemistry;
    let b = &g.body;
    let fraction = match mode {
        6 => m.membrane.x / 15.,
        7 => m.membrane.y / 15.,
        8 => b[1] / b[0] / 0.16,
        9 => {
            m.transporters
                .iter()
                .enumerate()
                .map(|(i, _)| b[7 + i])
                .sum::<f64>()
                / b[0]
                / 0.32
        }
        10 => {
            (0..crate::organism::MAX_ENZYMES)
                .map(|s| b[crate::organism::enzyme_stock(s)])
                .sum::<f64>()
                / b[0]
                / 0.32
        }
        12 | 13 => {
            let Some(r) = reference else {
                return [0.3, 0.35, 0.4];
            };
            if mode == 12 {
                physical_distance(&g.chromosome, &r.chromosome) / 0.1
            } else {
                crate::controller::genome_distance(&g.chromosome.behavior, &r.chromosome.behavior)
                    / 0.01
            }
        }
        _ => {
            return hue_rgb(
                (m.transporters[0].x / 15. * 0.65
                    + m.transporters[0].y / 15. * 0.25
                    + m.membrane.y / 15. * 0.1)
                    .fract(),
            );
        }
    };
    heat(fraction)
}
impl Colors {
    pub fn prepare(&mut self, w: &World, mode: u32, selected: u64) {
        let reference = selected
            .checked_sub(1)
            .and_then(|i| w.ancestry.get(i as usize))
            .map(|a| a.genome)
            .filter(|id| w.genomes.contains_key(id));
        if self.selection != Some((mode, selected, reference)) {
            self.genomes.clear();
            self.cells.clear();
            self.ancestors = if mode == 11 {
                ancestor_path(w, selected)
            } else {
                BTreeMap::new()
            };
            self.selection = Some((mode, selected, reference));
        }
        if self.cells.len() > w.config.max_population * 2 {
            self.cells.clear();
        }
        if self.genomes.len() > w.config.max_population * 2 {
            self.genomes.retain(|id, _| w.genomes.contains_key(id));
        }
    }
    pub fn color(
        &mut self,
        w: &World,
        c: &Cell,
        mode: u32,
        selected: u64,
        energy: f64,
    ) -> [f32; 3] {
        match mode {
            1 => hue_rgb((c.lineage as f64 * 0.618033988749895).fract()),
            2 => hue_rgb((c.genome as f64 * 0.618033988749895).fract()),
            3 => heat(energy),
            4 => hue_rgb(c.brain.task as f64 / 256.),
            5 => hue_rgb((family(w, c) as f64 * 0.618033988749895).fract()),
            14 | 15 => crate::chemical_roles::color(c, mode == 15),
            11 => *self.cells.entry(c.id).or_insert_with(|| {
                links(w, selected, c.id, &self.ancestors)
                    .map(|(_, n)| heat(n as f64 / 16.))
                    .unwrap_or([0.3, 0.35, 0.4])
            }),
            _ => *self.genomes.entry(c.genome).or_insert_with(|| {
                let reference = selected
                    .checked_sub(1)
                    .and_then(|i| w.ancestry.get(i as usize))
                    .and_then(|a| w.genomes.get(&a.genome))
                    .and_then(|g| g.compiled.as_ref());
                genotype_color(
                    w.genomes[&c.genome].compiled.as_ref().unwrap(),
                    reference,
                    mode,
                )
            }),
        }
    }
}
