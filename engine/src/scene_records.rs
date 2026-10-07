//! Read-only semantic observations shared by local rendering and remote transport.
use crate::{presentation::Colors, render_window::Window, world::World};

pub struct Organism {
    pub id: u64,
    pub position: [f32; 2],
    pub radius: f32,
    pub heading: f32,
    pub color: [f32; 3],
    pub energy: f32,
    pub damage: f32,
    pub newborn: bool,
    pub highlight: i8,
}
impl Organism {
    pub fn attributes(&self) -> [f32; 11] {
        [
            self.position[0],
            self.position[1],
            self.radius,
            self.heading,
            self.color[0],
            self.color[1],
            self.color[2],
            self.energy,
            self.damage,
            u8::from(self.newborn) as f32,
            self.highlight as f32,
        ]
    }
    pub fn render_record(&self) -> [f32; 12] {
        let a = self.attributes();
        [
            a[0],
            a[1],
            a[2],
            a[3],
            a[4],
            a[5],
            a[6],
            a[7],
            a[8],
            self.id as f32,
            a[9],
            a[10],
        ]
    }
}
pub struct Marker {
    /// Namespaces: reservoir index * 4, death cell ID * 4 + 1, emitter ID * 4 + 2.
    pub id: u64,
    pub position: [f32; 2],
    pub radius: f32,
    pub season: f32,
    pub color: [f32; 3],
    pub strength: f32,
    pub kind: u8,
    pub output: f32,
    pub recovery: f32,
    pub seasonal: bool,
}
impl Marker {
    pub fn attributes(&self) -> [f32; 12] {
        [
            self.position[0],
            self.position[1],
            self.radius,
            self.season,
            self.color[0],
            self.color[1],
            self.color[2],
            self.strength,
            self.kind as f32,
            self.output,
            self.recovery,
            u8::from(self.seasonal) as f32,
        ]
    }
}

pub fn organisms(
    w: &World,
    window: Window,
    colors: &mut Colors,
    color: u32,
    selected: u64,
    mut visit: impl FnMut(Organism),
) {
    for c in &w.cells {
        let radius = c.radius(&w.config);
        if !window.contains(w, c.x, c.y, (radius * 3.5).max(2.)) {
            continue;
        }
        let energy = (c.energy / c.energy_capacity(&w.config).max(1e-12)).clamp(0., 1.);
        visit(Organism {
            id: c.id,
            position: [c.x as f32, c.y as f32],
            radius: radius as f32,
            heading: c.heading as f32,
            color: colors.color(w, c, color, selected, energy),
            energy: energy as f32,
            damage: c.damage as f32,
            newborn: c.born > 0 && w.tick - c.born < 50,
            highlight: w
                .observer
                .as_ref()
                .filter(|o| o.highlight)
                .map_or(-1, |o| i8::from(o.selected(c))),
        });
    }
}

pub fn markers(w: &World, window: Window, mut visit: impl FnMut(Marker)) {
    emitters(w, window, &mut visit);
    reservoirs(w, window, &mut visit);
    for e in &w.events {
        if e.kind != "death" || w.tick.saturating_sub(e.tick) > 50 {
            continue;
        }
        if let Some([x, y, r]) = e.location
            && window.contains(w, x, y, r)
        {
            visit(Marker {
                id: e.cell * 4 + 1,
                position: [x as f32, y as f32],
                radius: r as f32,
                season: 0.,
                color: [1., 0.5, 0.35],
                strength: 1.,
                kind: 1,
                output: -1.,
                recovery: 0.,
                seasonal: false,
            });
        }
    }
}
fn emitters(w: &World, window: Window, visit: &mut impl FnMut(Marker)) {
    for cell in &w.cells {
        let power = w.incident.emitters.get(&cell.id).copied().unwrap_or(0.);
        let radius = 3. * w.config.optical_reach;
        if power > 0. && window.contains(w, cell.x, cell.y, radius) {
            let reference = w.config.optical_power_density * w.config.mesh.powi(2);
            visit(Marker {
                id: cell.id * 4 + 2,
                position: [cell.x as f32, cell.y as f32],
                radius: radius as f32,
                season: 0.,
                color: [1., 0.8, 0.3],
                strength: (power / (power + reference)) as f32,
                kind: 2,
                output: -1.,
                recovery: 0.,
                seasonal: false,
            });
        }
    }
}
fn reservoirs(w: &World, window: Window, visit: &mut impl FnMut(Marker)) {
    for (id, s) in w.sources.iter().enumerate() {
        let h = &s.habitat;
        if !window.contains(w, h.x, h.y, h.radius * 1.25) {
            continue;
        }
        let recovery = s.recent_recovery / (s.recent_recovery + s.amount).max(f64::MIN_POSITIVE);
        let output = s.recent_output
            / (s.recent_output + s.rate * w.config.mortality_memory).max(f64::MIN_POSITIVE);
        visit(Marker {
            id: id as u64 * 4,
            position: [h.x as f32, h.y as f32],
            radius: h.radius as f32,
            season: w
                .shade
                .geography
                .season([h.x, h.y], w.tick as f64 * w.config.dt) as f32,
            color: [0.6, 0.85, 0.67],
            strength: u8::from(s.amount > 0.) as f32,
            kind: 0,
            output: (-1. - output) as f32,
            recovery: recovery as f32,
            seasonal: w.config.terrain.seasons,
        });
    }
}
