use antropy_engine::render::Buffers;
use antropy_engine::{render_window::Window, world::World};
use axum::body::Bytes;
use serde_json::Value;

#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct ViewKey {
    pub kind: u32,
    pub species: usize,
    pub color: u32,
    pub selected: u64,
    pub viewport: Option<[i32; 4]>,
}
impl Default for ViewKey {
    fn default() -> Self {
        Self {
            kind: 5,
            species: 0,
            color: 3,
            selected: 0,
            viewport: None,
        }
    }
}
impl ViewKey {
    pub fn parse(p: &Value) -> Result<Self, String> {
        let species = p["species"]
            .as_u64()
            .filter(|x| *x < 256)
            .ok_or("Invalid chemical")? as usize;
        let color = p["color"]
            .as_u64()
            .filter(|x| *x <= 15)
            .ok_or("Invalid cell color")? as u32;
        let layers = p["layers"]
            .as_array()
            .filter(|v| v.len() == 8 && v.iter().all(Value::is_boolean))
            .ok_or("Invalid layers")?;
        let selected = if (11..=13).contains(&color) {
            p["selected"].as_u64().unwrap_or(0)
        } else {
            0
        };
        let viewport = if let Some(v) = p.get("viewport") {
            let rect: [i32; 4] =
                serde_json::from_value(v.clone()).map_err(|_| "Invalid viewport")?;
            if rect[2] <= 0 || rect[3] <= 0 || rect.iter().any(|v| v.unsigned_abs() > 1_000_000) {
                return Err("Invalid viewport bounds".into());
            }
            Some(rect)
        } else {
            None
        };
        Ok(Self {
            species,
            color,
            selected,
            viewport,
            kind: if layers[6] == true { 6 } else { 5 },
        })
    }
    pub fn window(&self, w: &World) -> Window {
        let [x, y, width, height] = self.viewport.unwrap_or([
            0,
            0,
            w.config.width.ceil() as i32,
            w.config.height.ceil() as i32,
        ]);
        let spacing = w.field.spacing;
        let left = (x as f64 / spacing)
            .floor()
            .clamp(0., w.field.nx as f64 - 1.) as i32;
        let top = (y as f64 / spacing)
            .floor()
            .clamp(0., w.field.ny as f64 - 1.) as i32;
        let right = ((x + width) as f64 / spacing)
            .ceil()
            .clamp(left as f64 + 1., w.field.nx as f64) as i32;
        let bottom = ((y + height) as f64 / spacing)
            .ceil()
            .clamp(top as f64 + 1., w.field.ny as f64) as i32;
        let step = (((right - left + 2) * (bottom - top + 2)) as f64 / 65536.)
            .sqrt()
            .ceil()
            .max(1.) as usize;
        Window {
            x: left - step as i32,
            y: top - step as i32,
            nx: (right - left) as usize / step + 3,
            ny: (bottom - top) as usize / step + 3,
            step,
        }
    }
}

/// Independent little-endian display packet. Native pointers never cross the boundary.
pub fn encode(b: &Buffers, sequence: u64, generation: u64, tick: u64, extent: [f32; 4]) -> Bytes {
    let mut out = Vec::with_capacity(64 + (b.cells.len() + b.field.len() + b.markers.len()) * 4);
    for n in [
        0x42545250,
        1,
        generation as u32,
        sequence as u32,
        tick as u32,
        (tick >> 32) as u32,
        b.descriptor[6],
        b.descriptor[7],
        b.cells.len() as u32,
        b.field.len() as u32,
        b.markers.len() as u32,
        0,
    ] {
        out.extend(n.to_le_bytes());
    }
    for v in extent {
        out.extend(v.to_le_bytes());
    }
    for v in b.cells.iter().chain(&b.field).chain(&b.markers) {
        out.extend(v.to_le_bytes());
    }
    Bytes::from(out)
}
