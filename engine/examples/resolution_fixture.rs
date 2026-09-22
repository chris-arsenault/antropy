//! Generate matched material/population states; no simulation advancement.
use antropy_engine::{commands, config::Config, diagnostics, field::Field, world::World};
use std::{fs, path::Path};

fn main() {
    let output = std::env::args().nth(1).expect("Provide a new directory");
    fs::create_dir(&output).unwrap();
    for (population, growth) in [(48, false), (2000, false), (2000, true)] {
        let mut coarse = World::new(
            101,
            Config {
                mesh: 4.,
                founders: 0,
                source_count: 0,
                ..Config::default()
            },
        )
        .unwrap();
        commands::execute(
            &mut coarse,
            &serde_json::json!({"op":"loadFixture", "population":population, "growth":growth}),
        )
        .unwrap();
        let fine = refine(&coarse);
        for world in [coarse, fine] {
            world.validate().unwrap();
            let name = format!("{population}-{growth}-h{}", world.config.mesh);
            fs::write(
                Path::new(&output).join(format!("{name}-initial.antropy")),
                world.snapshot().unwrap(),
            )
            .unwrap();
            println!("{name}: held={:?}", world.held());
        }
    }
}

fn refine(coarse: &World) -> World {
    let mut fine = coarse.clone();
    fine.config.mesh = 2.;
    fine.field = Field::new(fine.config.width, fine.config.height, fine.config.mesh);
    let nx = fine.field.nx;
    fine.field.replace_material(&fine.chemistry, |i| {
        let (x, y) = (i / 256 % nx, i / 256 / nx);
        let source = ((y / 2) * coarse.field.nx + x / 2) * 256;
        coarse.field.amounts()[source + i % 256] * 0.25
    });
    diagnostics::initialize(&mut fine);
    let before = coarse.held();
    let after = fine.held();
    assert!((before.0 - after.0).abs() < 1e-8);
    assert!((before.1 - after.1).abs() < 1e-8);
    fine
}
