use antropy_engine::{diagnostics, observation};

fn main() {
    for interval in [0.8, 0.4, 0.2] {
        for supply in [false, true] {
            let mut w = diagnostics::nutrition(interval, 2., supply, false);
            for _ in 0..300 {
                w.step();
                if w.stop_reason.is_some() {
                    break;
                }
            }
            println!(
                "{}",
                serde_json::json!({"interval":interval,"supply":supply,"summary":observation::summary(&w)})
            );
        }
    }
}
