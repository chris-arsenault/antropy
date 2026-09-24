//! Restart diagnostics on the state volume, readable without container logs.
//! A minute heartbeat records progress and memory; a panic hook records the message before the
//! release build aborts; each boot records the previous process's last heartbeat and panic.
//! Memory near the container limit, a panic record, or neither distinguishes an out-of-memory
//! kill, a crash and an external restart.
use serde_json::{Value, json};
use std::{
    fs,
    io::Write,
    path::{Path, PathBuf},
    time::{Instant, SystemTime, UNIX_EPOCH},
};

pub const HEARTBEAT_SECONDS: u64 = 60;
const BOOTS_RETAINED: usize = 50;

pub struct Diagnostics {
    dir: PathBuf,
    started: Instant,
    boot: Value,
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_or(0, |d| d.as_millis() as u64)
}

fn read_json(path: &Path) -> Value {
    fs::read(path)
        .ok()
        .and_then(|b| serde_json::from_slice(&b).ok())
        .unwrap_or(Value::Null)
}

/// Replace a file through a synced temporary so readers never see a partial record.
fn write_atomic(path: &Path, value: &Value) -> std::io::Result<()> {
    let partial = path.with_extension("tmp");
    let mut file = fs::File::create(&partial)?;
    file.write_all(value.to_string().as_bytes())?;
    file.sync_all()?;
    fs::rename(&partial, path)
}

fn field(text: &str, key: &str) -> Option<u64> {
    text.lines()
        .find_map(|l| l.strip_prefix(key))
        .and_then(|rest| rest.split_whitespace().next()?.parse().ok())
}

/// Process and container memory. Container figures come from cgroup v2 when present.
pub fn memory() -> Value {
    let status = fs::read_to_string("/proc/self/status").unwrap_or_default();
    let cgroup = |name: &str| fs::read_to_string(format!("/sys/fs/cgroup/{name}")).ok();
    let events = cgroup("memory.events").unwrap_or_default();
    json!({
        "rssBytes": field(&status, "VmRSS:").map(|kb| kb * 1024),
        "peakRssBytes": field(&status, "VmHWM:").map(|kb| kb * 1024),
        "containerBytes": cgroup("memory.current").and_then(|v| v.trim().parse::<u64>().ok()),
        "containerLimit": cgroup("memory.max").map(|v| v.trim().to_string()),
        "containerOomKills": field(&events, "oom_kill "),
    })
}

impl Diagnostics {
    /// Records this boot with the previous process's evidence, then installs the panic hook.
    pub fn start(state_dir: &Path) -> std::io::Result<std::sync::Arc<Self>> {
        let diagnostics = Self::open(state_dir)?;
        diagnostics.install_panic_hook();
        Ok(diagnostics)
    }
    /// Records this boot with the previous process's last heartbeat and panic.
    pub fn open(state_dir: &Path) -> std::io::Result<std::sync::Arc<Self>> {
        let dir = state_dir.join("diagnostics");
        fs::create_dir_all(&dir)?;
        let previous_panic = read_json(&dir.join("panic.json"));
        let boot = json!({
            "bootAt": now_ms(),
            "pid": std::process::id(),
            "previousHeartbeat": read_json(&dir.join("heartbeat.json")),
            "previousPanic": previous_panic,
            "memoryAtBoot": memory(),
        });
        let _ = fs::remove_file(dir.join("panic.json"));
        let boots = dir.join("boots.jsonl");
        let mut lines: Vec<String> = fs::read_to_string(&boots)
            .unwrap_or_default()
            .lines()
            .map(String::from)
            .collect();
        lines.push(boot.to_string());
        let keep = lines.len().saturating_sub(BOOTS_RETAINED);
        fs::write(&boots, lines[keep..].join("\n") + "\n")?;
        Ok(std::sync::Arc::new(Self {
            dir,
            started: Instant::now(),
            boot,
        }))
    }
    /// Writes a panic record before the release build aborts; the next boot reports it.
    pub fn install_panic_hook(&self) {
        let panic_path = self.dir.join("panic.json");
        let default = std::panic::take_hook();
        std::panic::set_hook(Box::new(move |info| {
            let record = json!({
                "at": now_ms(),
                "message": info.to_string(),
                "thread": std::thread::current().name().map(String::from),
                "memory": memory(),
                "backtrace": std::backtrace::Backtrace::force_capture().to_string(),
            });
            let _ = write_atomic(&panic_path, &record);
            default(info);
        }));
    }
    pub fn uptime(&self) -> u64 {
        self.started.elapsed().as_secs()
    }
    /// Latest progress and memory; overwritten each heartbeat, read by the next boot.
    pub fn heartbeat(&self, progress: Value) {
        let record = json!({"at": now_ms(), "uptimeSeconds": self.uptime(),
            "pid": std::process::id(), "progress": progress, "memory": memory()});
        if let Err(e) = write_atomic(&self.dir.join("heartbeat.json"), &record) {
            eprintln!("Heartbeat write failed: {e}");
        }
    }
    pub fn report(&self) -> Value {
        let boots: Vec<Value> = fs::read_to_string(self.dir.join("boots.jsonl"))
            .unwrap_or_default()
            .lines()
            .rev()
            .take(20)
            .filter_map(|l| serde_json::from_str(l).ok())
            .collect();
        json!({"boot": self.boot, "uptimeSeconds": self.uptime(), "memory": memory(),
            "heartbeat": read_json(&self.dir.join("heartbeat.json")),
            "heartbeatSeconds": HEARTBEAT_SECONDS, "recentBoots": boots})
    }
}
