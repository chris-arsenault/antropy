//! HTTP work joins the same bounded queue and tick boundary as socket commands.
use super::{
    runtime::{Host, Runtime},
    store::{Capture, Reason},
};
use antropy_engine::world::{VERSION, World};
use axum::body::Bytes;
use serde::Deserialize;
use serde_json::{Value, json};
use std::{io::Write, time::Duration};
use tokio::sync::{OwnedSemaphorePermit, oneshot};

pub const MAX_CHECKPOINT_BYTES: usize = 256 * 1024 * 1024;

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Control {
    pub generation: u64,
    pub op: String,
    #[serde(default)]
    pub payload: Value,
}
pub enum Operation {
    Status,
    Control(Control),
    Checkpoint {
        generation: u64,
        permit: OwnedSemaphorePermit,
    },
    /// Capture for the volume store; `None` skips the generation check (shutdown).
    Save {
        generation: Option<u64>,
        reason: Reason,
        permit: OwnedSemaphorePermit,
    },
    /// Replace the world with stored, already decompressed checkpoint bytes.
    Load {
        generation: u64,
        raw: Vec<u8>,
    },
}
pub enum Reply {
    Json(Value),
    Captured {
        capture: Capture,
        permit: OwnedSemaphorePermit,
    },
    Checkpoint {
        bytes: Bytes,
        generation: u64,
        tick: u64,
        permit: OwnedSemaphorePermit,
    },
}
#[derive(Debug)]
pub enum Error {
    Invalid(String),
    Conflict,
    Busy,
    Unavailable,
    Timeout,
    Export(String),
    NotFound,
    Storage(String),
    Disabled,
}
pub struct Request {
    operation: Operation,
    reply: oneshot::Sender<Result<Reply, Error>>,
}
impl Host {
    pub async fn manage(&self, operation: Operation) -> Result<Reply, Error> {
        let (reply, received) = oneshot::channel();
        self.commands
            .try_send(super::runtime::Request::Management(Request {
                operation,
                reply,
            }))
            .map_err(|_| Error::Busy)?;
        tokio::time::timeout(Duration::from_secs(30), received)
            .await
            .map_err(|_| Error::Timeout)?
            .map_err(|_| Error::Unavailable)?
    }
}
impl Request {
    pub fn execute(self, runtime: &mut Runtime) {
        if !self.reply.is_closed() {
            let _ = self.reply.send(execute(runtime, self.operation));
        }
    }
}
fn status(r: &Runtime) -> Value {
    json!({"generation":r.generation,"tick":r.world.tick,"seed":r.world.seed,
        "config":r.world.config,"running":r.running,"speed":r.speed,
        "threads":r.threads,"population":r.world.cells.len(),"stopReason":r.world.stop_reason})
}
fn execute(r: &mut Runtime, operation: Operation) -> Result<Reply, Error> {
    let generation = match &operation {
        Operation::Status => return Ok(Reply::Json(status(r))),
        Operation::Control(c) => c.generation,
        Operation::Checkpoint { generation, .. } | Operation::Load { generation, .. } => {
            *generation
        }
        Operation::Save { generation, .. } => generation.unwrap_or(r.generation),
    };
    if generation != r.generation {
        return Err(Error::Conflict);
    }
    match operation {
        Operation::Control(c) => {
            if !matches!(
                c.op.as_str(),
                "running" | "step" | "speed" | "restart" | "task" | "phenotype"
            ) {
                return Err(Error::Invalid("Unsupported management operation".into()));
            }
            let value = r.command(&c.op, c.payload).map_err(Error::Invalid)?;
            Ok(Reply::Json(json!({"status":status(r),"value":value})))
        }
        Operation::Checkpoint { permit, .. } => Ok(Reply::Checkpoint {
            bytes: checkpoint(&r.world, MAX_CHECKPOINT_BYTES)
                .map_err(Error::Export)?
                .into(),
            generation: r.generation,
            tick: r.world.tick,
            permit,
        }),
        Operation::Save { reason, permit, .. } => Ok(Reply::Captured {
            capture: r.capture(reason).map_err(Error::Export)?,
            permit,
        }),
        Operation::Load { raw, .. } => {
            let world = World::restore(&raw).map_err(Error::Invalid)?;
            r.replace(world).map_err(Error::Invalid)?;
            Ok(Reply::Json(json!({"status":status(r)})))
        }
        Operation::Status => unreachable!(),
    }
}

/// Encode the ordinary physical checkpoint without cloning World or allocating beyond the cap.
pub fn checkpoint(world: &World, limit: usize) -> Result<Vec<u8>, String> {
    let mut writer = LimitedWriter {
        bytes: Vec::new(),
        limit,
    };
    writer
        .write_all(format!("ANTROPY{VERSION}\0").as_bytes())
        .map_err(|e| e.to_string())?;
    postcard::to_io(world, writer)
        .map(|w| w.bytes)
        .map_err(|_| "Checkpoint exceeds export budget or allocation failed".into())
}
struct LimitedWriter {
    bytes: Vec<u8>,
    limit: usize,
}
impl Write for LimitedWriter {
    fn write(&mut self, bytes: &[u8]) -> std::io::Result<usize> {
        let needed = self.bytes.len().saturating_add(bytes.len());
        if needed > self.limit {
            return Err(std::io::Error::other("Checkpoint exceeds export budget"));
        }
        if needed > self.bytes.capacity() {
            let capacity = needed
                .max(self.bytes.capacity().saturating_mul(2))
                .min(self.limit);
            self.bytes
                .try_reserve_exact(capacity - self.bytes.len())
                .map_err(std::io::Error::other)?;
        }
        self.bytes.extend_from_slice(bytes);
        Ok(bytes.len())
    }
    fn flush(&mut self) -> std::io::Result<()> {
        Ok(())
    }
}
