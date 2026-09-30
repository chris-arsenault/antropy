//! Bounded geography observations and existing display lanes; no physical map serialization.
use crate::world::World;

pub fn season_angle(w: &World) -> (f64, f64) {
    let g = &w.shade.geography;
    (std::f64::consts::TAU * w.tick as f64 * w.config.dt / g.config.season_period + g.phase)
        .sin_cos()
}

pub fn map(w: &World, n: usize, kind: u32, (sin, cos): (f64, f64)) -> [f64; 2] {
    let g = &w.shade.geography;
    let h = g.height.get(n).copied().unwrap_or(0.);
    let q = g.conductance.get(n).copied().unwrap_or(1.);
    let [c, d] = g.seasons.get(n).copied().unwrap_or([0.; 2]);
    let amplitude = c.hypot(d);
    let value = match kind {
        10 => 0.5 + 2. * h / w.config.terrain.feature_wavelength,
        11 => q,
        12 => {
            let slope = node_slope(w, n);
            slope / (1. + slope)
        }
        13 => {
            if g.config.seasons {
                (1. + c * cos - d * sin).clamp(0., 2.) / 2.
            } else {
                0.5
            }
        }
        14 => amplitude,
        15 => (d.atan2(c) + g.phase).rem_euclid(std::f64::consts::TAU) / std::f64::consts::TAU,
        _ => w.shade.ceiling.get(n).map_or(1., |k| k / (1. + k)),
    };
    [value, amplitude]
}

fn node_slope(w: &World, n: usize) -> f64 {
    let g = &w.shade.geography;
    if g.height.is_empty() {
        return 0.;
    }
    let (x, y) = (n % g.nx, n / g.nx);
    let dx = g.height[y * g.nx + (x + 1) % g.nx] - g.height[y * g.nx + (x + g.nx - 1) % g.nx];
    let dy = g.height[(y + 1) % g.ny * g.nx + x] - g.height[(y + g.ny - 1) % g.ny * g.nx + x];
    dx.hypot(dy) / (2. * g.spacing)
}

fn slope(w: &World, p: [f64; 2]) -> f64 {
    let mesh = w.config.mesh;
    let g = &w.shade.geography;
    let x = (g.sample([p[0] + mesh, p[1]])[0] - g.sample([p[0] - mesh, p[1]])[0]) / (2. * mesh);
    let y = (g.sample([p[0], p[1] + mesh])[0] - g.sample([p[0], p[1] - mesh])[0]) / (2. * mesh);
    x.hypot(y)
}

pub fn local(w: &World, p: [f64; 2]) -> serde_json::Value {
    let g = &w.shade.geography;
    let [height, conductance, c, d] = g.sample(p);
    serde_json::json!({"height":height,"conductance":conductance,"slope":slope(w,p),
        "supplyMultiplier":g.season(p,w.tick as f64*w.config.dt),"seasonAmplitude":c.hypot(d)})
}
