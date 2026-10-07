use super::{
    display::ViewKey,
    runtime::Runtime,
    socket::{authenticated, read_only},
};
use antropy_engine::config::Config;
use serde_json::json;

fn fixture() -> Runtime {
    Runtime::new(
        27,
        Config {
            width: 24.,
            height: 24.,
            founders: 4,
            source_count: 2,
            ..Default::default()
        },
        1,
    )
    .unwrap()
}
fn unpack(bytes: &[u8]) -> (Vec<u8>, serde_json::Value) {
    use std::io::Read;
    let mut raw = Vec::new();
    flate2::read::GzDecoder::new(bytes)
        .read_to_end(&mut raw)
        .unwrap();
    let length = u32::from_le_bytes(raw[8..12].try_into().unwrap()) as usize;
    let metadata = serde_json::from_slice(&raw[16..16 + length]).unwrap();
    (raw, metadata)
}

#[test]
fn common_projection_is_shared_and_does_not_advance_world() {
    let mut r = fixture();
    let before = r.world.snapshot().unwrap();
    let p = r.publish(vec![ViewKey::default(); 16], 0.).unwrap();
    assert_eq!(p.scenes.len(), 1);
    assert_eq!(p.projections, 1);
    let mut keys = vec![ViewKey::default(); 31];
    keys.push(ViewKey {
        species: 1,
        ..ViewKey::default()
    });
    let next = r.publish(keys, 0.).unwrap();
    assert_eq!(next.scenes.len(), 2);
    assert_eq!(p.terrain.as_ptr(), next.terrain.as_ptr());
    assert_eq!(p.terrain_revision, next.terrain_revision);
    assert!(p.terrain.len() <= 32 + 256 * 256 * 16);
    assert_eq!(
        u32::from_le_bytes(p.terrain[0..4].try_into().unwrap()),
        0x42545452
    );
    assert_eq!(before, r.world.snapshot().unwrap());
    assert_eq!(p.status["summary"]["tick"], 0);
    let key = ViewKey::default();
    let (packet, baseline) = super::wire::encode(&p, key, 0, false, None).unwrap();
    let (shared, _) = super::wire::encode(&p, key, 0, false, None).unwrap();
    assert_eq!(packet.as_ptr(), shared.as_ptr());
    let (_, first) = unpack(&packet);
    assert_eq!(first["terrainRevision"], p.terrain_revision);
    let (packet, _) = super::wire::encode(&next, key, 0, false, Some(&baseline)).unwrap();
    let (raw, delta) = unpack(&packet);
    assert!(raw.len() < 1024);
    assert!(delta["definition"].is_null());
    assert!(delta["status"]["history"].is_null());
    assert!(delta["status"]["population"].is_null());
    assert_eq!(delta["base"], p.sequence);
    assert_eq!(delta["reset"], false);
    assert_eq!(u32::from_le_bytes(raw[12..16].try_into().unwrap()), 0);
}
#[test]
fn controls_apply_between_ticks_and_restart_replaces_generation() {
    let mut r = fixture();
    let before = r.publish(vec![ViewKey::default()], 0.).unwrap();
    r.command("step", json!({})).unwrap();
    assert_eq!(r.world.tick, 1);
    assert!(!r.running);
    r.command(
        "restart",
        json!({"seed":28,"config":{"width":24.,"height":24.,"founders":4,"sourceCount":2}}),
    )
    .unwrap();
    assert_eq!(r.generation, 2);
    assert_eq!(r.world.tick, 0);
    assert!(r.world.config.terrain.elevation && r.world.config.terrain.seasons);
    let after = r.publish(vec![ViewKey::default()], 0.).unwrap();
    assert_ne!(before.terrain_revision, after.terrain_revision);
    assert_eq!(
        u32::from_le_bytes(after.terrain[8..12].try_into().unwrap()),
        2
    );
}
#[test]
fn spectator_allowlist_excludes_physical_and_cohort_mutations() {
    for op in [
        "running",
        "step",
        "restart",
        "task",
        "strategyAblation",
        "save",
        "intervene",
        "frame",
        "assayFrame",
        "field",
        "loadFixture",
    ] {
        assert!(!read_only(op, &json!({})), "{op}");
    }
    assert!(read_only("chemicalWeb", &json!({})));
    assert!(read_only("inspectReservoir", &json!({"source":0})));
    assert!(!read_only("mortalityAssay", &json!({"cells":[1]})));
    assert!(read_only("phenotype", &json!({"action":"panel"})));
    assert!(!read_only("phenotype", &json!({"action":"select"})));
    assert!(!authenticated(None, ""));
    assert!(!authenticated(Some("secret"), "wrong"));
    assert!(authenticated(Some("secret"), "secret"));
}

#[test]
fn reservoir_queries_and_recovery_publication_are_bounded_and_read_only() {
    let mut r = fixture();
    let before = r.world.snapshot().unwrap();
    let source = r.command("inspectReservoir", json!({"source":0})).unwrap();
    assert!(source.to_string().len() < 1024);
    assert_eq!(source["tick"], 0);
    let p = r.publish(vec![ViewKey::default()], 0.).unwrap();
    assert_eq!(p.status["summary"]["mortality"]["response"], 0.);
    assert_eq!(r.world.snapshot().unwrap(), before);
}

#[tokio::test]
async fn socket_spectators_share_world_and_slow_viewer_cannot_stall_it() {
    use axum::{Router, routing::get};
    use futures_util::{SinkExt, StreamExt};
    use std::{sync::Arc, time::Duration};
    use tokio_tungstenite::{connect_async, tungstenite::Message};
    let host = super::runtime::start(27, fixture().world.config, 1, None).unwrap();
    host.command(1, "speed", json!({"value":30})).await.unwrap();
    let state = super::socket::State {
        host: host.clone(),
        token: Some("test-operator-credential-32-characters".into()),
        origins: vec![],
        permits: Arc::new(tokio::sync::Semaphore::new(32)),
    };
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let url = format!("ws://{}/stream", listener.local_addr().unwrap());
    let server = tokio::spawn(async move {
        axum::serve(
            listener,
            Router::new()
                .route("/stream", get(super::socket::upgrade))
                .with_state(state),
        )
        .await
        .unwrap();
    });
    let (mut slow, _) = connect_async(&url).await.unwrap();
    let (mut active, _) = connect_async(&url).await.unwrap();
    active
        .send(Message::Text(
            json!({"id":1,"generation":1,"op":"running","payload":{"value":false}})
                .to_string()
                .into(),
        ))
        .await
        .unwrap();
    let mut first = None;
    let mut rejected = false;
    let mut frames = 0;
    let mut terrains = 0;
    let mut last_sequence = 0;
    tokio::time::timeout(Duration::from_secs(5), async {
        while let Some(Ok(message)) = active.next().await {
            match message {
                Message::Text(text) => {
                    let v: serde_json::Value = serde_json::from_str(&text).unwrap();
                    if v["kind"] == "reply" && v["id"] == 1 {
                        rejected = v["ok"] == false;
                    }
                }
                Message::Binary(b) => {
                    let (raw, metadata) = unpack(&b);
                    if u32::from_le_bytes(raw[12..16].try_into().unwrap()) > 0 {
                        terrains += 1;
                    }
                    assert_eq!(terrains, 1);
                    let tick = metadata["tick"].as_u64().unwrap();
                    let seq = metadata["sequence"].as_u64().unwrap();
                    assert_eq!(metadata["base"], last_sequence);
                    last_sequence = seq;
                    if let Some(before) = first {
                        assert!(tick > before);
                    } else {
                        first = Some(tick);
                    }
                    frames += 1;
                    active
                        .send(Message::Text(
                            json!({"id":10 + frames,"op":"ack","payload":{"sequence":seq}})
                                .to_string()
                                .into(),
                        ))
                        .await
                        .unwrap();
                    if frames == 3 {
                        break;
                    }
                }
                Message::Ping(b) => {
                    active.send(Message::Pong(b)).await.unwrap();
                }
                _ => (),
            }
        }
    })
    .await
    .unwrap();
    assert!(rejected);
    assert_eq!(frames, 3);
    assert_eq!(terrains, 1);
    let publication = host.publications.borrow().clone();
    assert_eq!(publication.scenes.len(), 1);
    assert!(publication.status["running"] == true);
    // The unacknowledged consumer receives only its initial combined publication.
    let mut slow_frames = 0;
    let _ = tokio::time::timeout(Duration::from_millis(100), async {
        while let Some(Ok(message)) = slow.next().await {
            if message.is_binary() {
                slow_frames += 1;
            }
        }
    })
    .await;
    assert_eq!(slow_frames, 1);
    let tick = host.publications.borrow().status["summary"]["tick"]
        .as_u64()
        .unwrap();
    drop(slow);
    drop(active);
    tokio::time::sleep(Duration::from_millis(650)).await;
    assert!(
        host.publications.borrow().status["summary"]["tick"]
            .as_u64()
            .unwrap()
            > tick
    );
    server.abort();
}

#[test]
fn cropped_display_preserves_seam_neighbors_and_bounds_grid_work() {
    let mut r = fixture();
    r.world.cells[0].x = 23.9;
    r.world.cells[0].y = 3.;
    let mut key = ViewKey::default();
    key.viewport = Some([0, 0, 4, 6]);
    let window = key.window(&r.world);
    assert!(window.contains(&r.world, 23.9, 3., 1.));
    let p = r.publish(vec![key], 0.).unwrap();
    assert_eq!(p.scenes.len(), 1);
    let scene = p.scenes.values().next().unwrap();
    assert!(scene.raw_bytes() < 65536 * 32 + 4096);
}

#[test]
#[ignore = "registered bounded publication benchmark; run explicitly in release mode"]
fn publication_cost_envelope() {
    use std::time::Instant;
    for threads in [1, 4] {
        let pool = rayon::ThreadPoolBuilder::new()
            .num_threads(threads)
            .build()
            .unwrap();
        for (viewers, distinct) in [(0, false), (1, false), (4, false), (16, false), (16, true)] {
            pool.install(|| {
                let mut r = Runtime::new(27, Config::default(), threads).unwrap();
                antropy_engine::commands::load_fixture(&mut r.world, 2000).unwrap();
                let keys: Vec<_> = (0..viewers).map(|i| ViewKey { species: if distinct { i } else { 0 }, ..ViewKey::default() }).collect();
                let started = Instant::now();
                let mut bytes = 0;
                let mut publications = 0;
                let mut projections = 0;
                for tick in 0..100 {
                    r.world.step();
                    if viewers > 0 && tick % 25 == 0 {
                        let p = r.publish(keys.clone(), 0.).unwrap();
                        bytes += p.scenes.values().map(|s| s.raw_bytes()).sum::<usize>();
                        projections = p.projections;
                        publications += 1;
                    }
                }
                println!("threads={threads} viewers={viewers} distinct={distinct} ticks=100 wall={:.3}s tps={:.1} projections={} bytes={} publications={publications}",
                    started.elapsed().as_secs_f64(), 100. / started.elapsed().as_secs_f64(), projections, bytes);
                assert!(started.elapsed().as_secs() < 60);
            });
        }
    }
}
