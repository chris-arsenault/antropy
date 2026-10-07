//! Transport-owned semantic samples. No GPU record layout crosses the socket.
use super::display::ViewKey;
use antropy_engine::{render::Buffers, scene_records, world::World};
use std::collections::BTreeMap;

#[derive(Default)]
pub struct Scene {
    pub nx: usize,
    pub ny: usize,
    pub extent: [f32; 4],
    pub kind: u32,
    pub solar: [f64; 7],
    pub axes: [Vec<[f64; 2]>; 2],
    pub organisms: BTreeMap<u64, [u32; 11]>,
    pub markers: BTreeMap<u64, [u32; 12]>,
    pub environment: [Vec<u32>; 16],
}
impl Scene {
    pub fn prepare(w: &World, b: &mut Buffers, key: ViewKey) -> Self {
        let window = key.window(w);
        b.colors.prepare(w, key.color, key.selected);
        b.prepare_environment(w, key.kind, key.species, true, window);
        let mut scene = Self {
            nx: window.nx,
            ny: window.ny,
            extent: window.extent(w),
            kind: key.kind,
            ..Self::default()
        };
        scene_records::organisms(w, window, &mut b.colors, key.color, key.selected, |c| {
            scene
                .organisms
                .insert(c.id, c.attributes().map(f32::to_bits));
        });
        scene_records::markers(w, window, |m| {
            scene.markers.insert(m.id, m.attributes().map(f32::to_bits));
        });
        scene.prepare_solar(w, window);
        for (sample_index, sample) in b.field.chunks_exact(8).enumerate() {
            let node = window.node(w, sample_index);
            for (lane, value) in sample.iter().enumerate() {
                let value = match lane {
                    2 => 0.,
                    0 if key.kind == 6 => 0.,
                    7 if key.kind == 5 => b.weathering(w, node) as f32,
                    _ => *value,
                };
                scene.environment[lane].push(value.to_bits());
            }
            let tau = w.field.illumination.cover.get(&node).copied().unwrap_or(0.);
            let optics = [
                w.shade.transmission[node],
                w.shade.ceiling.get(node).copied().unwrap_or(f64::INFINITY),
                (-tau).exp(),
                w.incident.lateral.get(&node).copied().unwrap_or(0.),
            ];
            for (i, value) in optics.iter().enumerate() {
                let bits = value.to_bits();
                scene.environment[8 + i * 2].push(bits as u32);
                scene.environment[9 + i * 2].push((bits >> 32) as u32);
            }
        }
        scene
    }
    fn prepare_solar(&mut self, w: &World, window: antropy_engine::render_window::Window) {
        let periods = [
            w.config.illumination_fast_period,
            w.config.illumination_slow_period,
            w.config.illumination_modulation_period,
        ];
        for (i, angle) in
            antropy_engine::illumination::phases(w.seed, w.tick as f64 * w.config.dt, periods)
                .iter()
                .enumerate()
        {
            let (sin, cos) = angle.sin_cos();
            self.solar[i * 2] = cos;
            self.solar[i * 2 + 1] = sin;
        }
        self.solar[6] = w.config.illumination_contrast;
        for x in 0..window.nx {
            let node = window.node(w, x) % w.field.nx;
            let (sin, cos) =
                (std::f64::consts::TAU * (node as f64 + 0.5) / w.field.nx as f64).sin_cos();
            self.axes[0].push([cos, sin]);
        }
        for y in 0..window.ny {
            let node = window.node(w, y * window.nx) / w.field.nx;
            let (sin, cos) =
                (std::f64::consts::TAU * (node as f64 + 0.5) / w.field.ny as f64).sin_cos();
            self.axes[1].push([cos, sin]);
        }
    }
    pub fn same_grid(&self, other: &Self) -> bool {
        self.nx == other.nx && self.ny == other.ny && self.extent == other.extent
    }
    pub fn raw_bytes(&self) -> usize {
        64 + self.nx * self.ny * 32 + (self.organisms.len() + self.markers.len()) * 48
    }
    pub fn encode(&self, previous: Option<&Self>, out: &mut Vec<u8>) {
        records(&self.organisms, previous.map(|p| &p.organisms), out);
        records(&self.markers, previous.map(|p| &p.markers), out);
        for (lane, values) in self.environment.iter().enumerate() {
            values_delta(
                values,
                previous.map(|p| p.environment[lane].as_slice()),
                out,
            );
        }
    }
    #[cfg(test)]
    pub fn section_bytes(&self, previous: &Self) -> Vec<usize> {
        use std::io::Write;
        let mut sections = Vec::new();
        let mut organisms = Vec::new();
        records(&self.organisms, Some(&previous.organisms), &mut organisms);
        sections.push(organisms);
        let mut markers = Vec::new();
        records(&self.markers, Some(&previous.markers), &mut markers);
        sections.push(markers);
        for (lane, values) in self.environment.iter().enumerate() {
            let mut out = Vec::new();
            values_delta(values, Some(&previous.environment[lane]), &mut out);
            sections.push(out);
        }
        sections
            .iter()
            .map(|s| {
                let mut gzip =
                    flate2::write::GzEncoder::new(Vec::new(), flate2::Compression::fast());
                gzip.write_all(s).unwrap();
                gzip.finish().unwrap().len()
            })
            .collect()
    }
}
pub fn integer(mut n: u64, out: &mut Vec<u8>) {
    while n >= 128 {
        out.push((n as u8 & 127) | 128);
        n >>= 7;
    }
    out.push(n as u8);
}
fn records<const N: usize>(
    current: &BTreeMap<u64, [u32; N]>,
    previous: Option<&BTreeMap<u64, [u32; N]>>,
    out: &mut Vec<u8>,
) {
    let mut patches = Vec::new();
    for (&id, values) in current {
        let old = previous.and_then(|p| p.get(&id));
        let mask = values.iter().enumerate().fold(0u64, |mask, (i, v)| {
            mask | (u64::from(old.is_none_or(|p| p[i] != *v)) << i)
        });
        if mask != 0 {
            patches.push((id, values, old, mask));
        }
    }
    integer(patches.len() as u64, out);
    let mut last = 0;
    for (id, values, old, mask) in patches {
        integer(id - last, out);
        last = id;
        integer(mask, out);
        for (i, value) in values.iter().enumerate() {
            if mask & (1 << i) != 0 {
                integer((value ^ old.map_or(0, |p| p[i])) as u64, out);
            }
        }
    }
    let removed: Vec<_> = previous
        .into_iter()
        .flat_map(|p| p.keys())
        .filter(|id| !current.contains_key(id))
        .copied()
        .collect();
    integer(removed.len() as u64, out);
    last = 0;
    for id in removed {
        integer(id - last, out);
        last = id;
    }
}
fn values_delta(current: &[u32], previous: Option<&[u32]>, out: &mut Vec<u8>) {
    let changed = |i: usize| current[i] ^ previous.map_or(0, |p| p[i]);
    integer(
        (0..current.len()).filter(|&i| changed(i) != 0).count() as u64,
        out,
    );
    let mut last = 0;
    for (i, _) in current.iter().enumerate().filter(|(i, _)| changed(*i) != 0) {
        integer((i - last) as u64, out);
        last = i;
        integer(changed(i) as u64, out);
    }
}
