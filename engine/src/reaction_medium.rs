//! Kinetic engagement and externally funded work share chemistry, with distinct inputs.
#[derive(Clone, Copy, Debug)]
pub struct Medium {
    pub signal: [f64; 2],
    pub drive: [f64; 2],
    pub light: f64,
}
impl Medium {
    pub fn illuminated(signal: [f64; 2], light: f64) -> Self {
        Self {
            signal,
            drive: crate::illumination::drive(signal, light),
            light,
        }
    }
    pub fn funded(signal: [f64; 2], exposure: crate::optics::Exposure) -> Self {
        Self {
            signal,
            drive: crate::illumination::drive(signal, exposure.drive()),
            light: exposure.light(),
        }
    }
}
impl From<[f64; 2]> for Medium {
    fn from(signal: [f64; 2]) -> Self {
        Self {
            signal,
            drive: signal,
            light: 1.,
        }
    }
}
