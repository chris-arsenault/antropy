//! Reusable presentation buffers. They are derived, never checkpointed or read by physics.
use crate::world::World;

pub const STRIDE: usize = 12;
#[derive(Default)]
pub struct Buffers {
    pub cells: Vec<f32>,
    pub field: Vec<f32>,
    body_signal: Vec<[f64; 2]>,
    illumination: crate::illumination::Illumination,
    pub markers: Vec<f32>,
    pub descriptor: [u32; 13],
    selection: Option<(u32, usize)>,
    pub colors: crate::presentation::Colors,
}
impl Buffers {
    pub fn prepare(
        &mut self,
        w: &World,
        kind: u32,
        species: usize,
        color: u32,
        field: bool,
        selected: u64,
    ) -> Result<(), String> {
        self.prepare_window(
            w,
            (kind, species, color, field, selected),
            crate::render_window::Window::full(w),
        )
    }
    pub fn prepare_window(
        &mut self,
        w: &World,
        selection: (u32, usize, u32, bool, u64),
        window: crate::render_window::Window,
    ) -> Result<(), String> {
        let (kind, species, color, field, selected) = selection;
        if kind > 9 || species >= 256 || color > 15 {
            return Err("Invalid render selection".into());
        }
        self.colors.prepare(w, color, selected);
        self.cells.clear();
        self.cells.reserve(w.cells.len() * STRIDE);
        for c in &w.cells {
            if !window.contains(w, c.x, c.y, (c.radius(&w.config) * 3.5).max(2.)) {
                continue;
            }
            let energy = (c.energy / c.energy_capacity(&w.config).max(1e-12)).clamp(0., 1.);
            let rgb = self.colors.color(w, c, color, selected, energy);
            self.cells.extend([
                c.x as f32,
                c.y as f32,
                c.radius(&w.config) as f32,
                c.heading as f32,
                rgb[0],
                rgb[1],
                rgb[2],
                energy as f32,
                c.damage as f32,
                c.id as f32,
                u8::from(c.born > 0 && w.tick - c.born < 50) as f32,
                w.observer
                    .as_ref()
                    .filter(|o| o.highlight)
                    .map_or(-1., |o| u8::from(o.selected(c)) as f32),
            ]);
        }
        self.markers.clear();
        for cell in &w.cells {
            let power = w.incident.emitters.get(&cell.id).copied().unwrap_or(0.);
            let radius = 3. * w.config.optical_reach;
            if power > 0. && window.contains(w, cell.x, cell.y, radius) {
                let reference = w.config.optical_power_density * w.config.mesh.powi(2);
                self.markers.extend([
                    cell.x as f32,
                    cell.y as f32,
                    radius as f32,
                    0.,
                    1.,
                    0.8,
                    0.3,
                    (power / (power + reference)) as f32,
                    2.,
                    -1.,
                    0.,
                    0.,
                ]);
            }
        }
        for s in &w.sources {
            if !window.contains(w, s.habitat.x, s.habitat.y, s.habitat.radius) {
                continue;
            }
            let active = s.amount > 0.;
            let h = &s.habitat;
            self.markers.extend([
                h.x as f32,
                h.y as f32,
                h.radius as f32,
                0.,
                0.6,
                0.85,
                0.67,
                if active { 1. } else { 0. },
                0.,
                -1.,
                0.,
                0.,
            ]);
        }
        for e in &w.events {
            if e.kind != "death" || w.tick.saturating_sub(e.tick) > 50 {
                continue;
            }
            if let Some([x, y, r]) = e.location {
                if !window.contains(w, x, y, r) {
                    continue;
                }
                self.markers.extend([
                    x as f32, y as f32, r as f32, 0., 1., 0.5, 0.35, 1., 1., -1., 0., 0.,
                ]);
            }
        }
        let channels = if kind >= 5 { 8 } else { 1 };
        if field
            || self.selection != Some((kind, species))
            || self.field.len() != window.nx * window.ny * channels
        {
            let area = w.field.spacing * w.field.spacing;
            if kind >= 5 {
                self.illumination.shade = w.shade.clone();
                self.illumination.cover = w.field.illumination.cover.clone();
                self.illumination.emission = w.incident.lateral.clone();
                self.illumination
                    .prepare(w.seed, w.tick, &w.config, w.field.nx, w.field.ny);
            }
            if kind == 5 {
                self.body_signal.resize(w.field.nx * w.field.ny, [0.; 2]);
                self.body_signal.fill([0.; 2]);
                crate::footprint::visit_current(w, |node, p| {
                    for (k, value) in p.into_iter().enumerate() {
                        self.body_signal[node][k] += value;
                    }
                });
            }
            self.field.clear();
            for n in 0..window.nx * window.ny {
                let i = window.node(w, n);
                // One regional read gives the row and its feature projection.
                let (node, _, p) = w.field.amounts().site(i);
                let impedance = p[2] / area + w.field.source_load()[i];
                let stress = p[3] / area;
                if kind >= 5 {
                    let light = self.illumination.node(i);
                    let opacity =
                        -(-self.illumination.cover.get(&i).copied().unwrap_or(0.)).exp_m1();
                    let [matter, energy] = match kind {
                        6 => [light, 0.],
                        7 => [w.shade.transmission[i], 0.],
                        8 => [opacity, 0.],
                        9 => [w.incident.lateral.get(&i).copied().unwrap_or(0.), 0.],
                        _ => [p[0] / area, p[1] / area],
                    };
                    self.field.extend([
                        matter as f32,
                        energy as f32,
                        light as f32,
                        opacity as f32,
                        node[species] / area as f32,
                        (1. - crate::movement::mobility(impedance, w.config.movement_impedance))
                            as f32,
                        (stress / (w.config.stress_k + stress)) as f32,
                        if kind >= 6 {
                            0.
                        } else {
                            crate::weathering::exposure(
                                crate::weathering::strength(crate::weathering::signal(
                                    std::array::from_fn(|k| {
                                        p[4 + k] / area
                                            + self.body_signal[i][k]
                                            + w.field.source_signal()[i][k]
                                    }),
                                )),
                                impedance,
                                w.config.habitat_feedback,
                                w.config.diffusion_impedance,
                            ) as f32
                                * light as f32
                        },
                    ]);
                    continue;
                }
                let value = match kind {
                    0 | 1 => p[kind as usize] / area,
                    2 => impedance,
                    3 => stress,
                    _ => node[species] as f64 / area,
                };
                self.field.push(value as f32);
            }
            self.selection = Some((kind, species));
        }
        self.descriptor = [
            2,
            (self.cells.len() / STRIDE) as u32,
            self.cells.as_ptr() as usize as u32,
            self.cells.len() as u32,
            self.field.as_ptr() as usize as u32,
            self.field.len() as u32,
            window.nx as u32,
            window.ny as u32,
            w.tick as u32,
            (w.tick >> 32) as u32,
            self.markers.as_ptr() as usize as u32,
            self.markers.len() as u32,
            (self.markers.len() / STRIDE) as u32,
        ];
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn optical_maps_and_emitters_are_physical_and_observation_is_pure() {
        let mut w = crate::diagnostics::nutrition(0.8, 2., true, false);
        w.cover
            .replace_material(&w.chemistry, |i| if i == 0 { 0.4 } else { 0. });
        crate::cover::refresh(&mut w);
        w.incident.emitters.insert(w.cells[0].id, 0.02);
        w.incident.lateral = std::sync::Arc::new([(0, 0.5)].into());
        let before = w.snapshot().unwrap();
        let mut b = Buffers::default();
        for kind in 6..=9 {
            b.prepare(&w, kind, 0, 0, true, 0).unwrap();
            let expected = match kind {
                6 => b.illumination.node(0),
                7 => w.shade.transmission[0],
                8 => 1. - (-1_f64).exp(),
                _ => 0.5,
            };
            assert!((b.field[0] as f64 - expected).abs() < 1e-6);
            assert!(
                b.markers
                    .chunks_exact(STRIDE)
                    .any(|m| m[8] == 2. && m[7] > 0.)
            );
        }
        let inspected = crate::observation::inspect(&w, w.cells[0].id).unwrap();
        assert_eq!(inspected["optics"]["paidPower"], 0.02);
        assert_eq!(before, w.snapshot().unwrap());
        let restored = World::restore(&before).unwrap();
        assert_eq!(restored.incident.emitters, w.incident.emitters);
    }
    #[test]
    fn rendering_cannot_change_a_world_or_its_continuation() {
        let mut w = crate::diagnostics::nutrition(0.8, 2., true, false);
        let mut control = w.clone();
        let mut buffers = Buffers::default();
        for color in 0..16 {
            w.config.illumination_contrast = 0.8;
            control.config.illumination_contrast = 0.8;
            buffers.prepare(&w, 6, 0, color, true, 1).unwrap();
            buffers.prepare(&w, 5, 0, color, true, 1).unwrap();
            buffers.prepare(&w, 4, 0, color, true, 1).unwrap();
            w.step();
            control.step();
        }
        buffers.prepare(&w, 5, 0, 0, true, 1).unwrap();
        let mut restored_buffers = Buffers::default();
        let restored = World::restore(&w.snapshot().unwrap()).unwrap();
        restored_buffers
            .prepare(&restored, 5, 0, 0, true, 1)
            .unwrap();
        assert_eq!(buffers.field, restored_buffers.field);
        buffers.prepare(&w, 4, 0, 0, true, 1).unwrap();
        assert_eq!(w.snapshot().unwrap(), control.snapshot().unwrap());
        assert_eq!(buffers.cells.len(), w.cells.len() * STRIDE);
        assert_eq!(buffers.field.len(), 144);
    }

    #[test]
    fn display_encodes_physical_responses_and_retains_dormant_sites() {
        let mut w = World::new(
            101,
            crate::config::Config {
                width: 24.,
                height: 24.,
                founders: 2,
                source_count: 2,
                ..crate::config::Config::default()
            },
        )
        .unwrap();
        w.field
            .replace_material(&w.chemistry, |i| if i == 0 { 4. } else { 0. });
        // Features derive from the deposited material rather than injected arrays.
        let impedance = w.field.impedance_at(0) + w.field.source_load()[0];
        let stress = w.field.stress_at(0);
        let mut buffers = Buffers::default();
        buffers.prepare(&w, 5, 0, 6, true, 0).unwrap();
        assert_eq!(buffers.markers.len(), 2 * STRIDE);
        assert!(buffers.markers.chunks_exact(STRIDE).all(|m| m[7] == 1.));
        assert!(
            (buffers.field[5] as f64
                - (1. - crate::movement::mobility(impedance, w.config.movement_impedance)))
            .abs()
                < 1e-6
        );
        assert!((buffers.field[6] as f64 - stress / (w.config.stress_k + stress)).abs() < 1e-6);
        let light = crate::illumination::at(&w, w.field.spacing / 2., w.field.spacing / 2.);
        assert!((buffers.field[2] as f64 - light).abs() < 1e-6);
        assert_eq!(buffers.field[3], 0.);
        let ambient =
            crate::weathering::strength(crate::weathering::signal(std::array::from_fn(|k| {
                w.field.material_signal(0)[k]
                    + buffers.body_signal[0][k]
                    + w.field.source_signal()[0][k]
            })));
        let expected =
            crate::weathering::exposure(ambient, impedance, true, w.config.diffusion_impedance)
                * light;
        assert!((buffers.field[7] as f64 - expected).abs() < 1e-7);
        assert_eq!(buffers.field[4], 4. / w.field.spacing.powi(2) as f32);
        assert!(
            (buffers.field[1] / buffers.field[0] - w.chemistry.properties[0].potential as f32)
                .abs()
                < 1e-6
        );
        for site in &mut w.sources {
            site.amount = 0.;
        }
        buffers.prepare(&w, 5, 0, 6, false, 0).unwrap();
        assert_eq!(buffers.markers.len(), w.sources.len() * STRIDE);
        assert!(buffers.markers.chunks_exact(STRIDE).all(|m| m[7] == 0.));
    }
}
