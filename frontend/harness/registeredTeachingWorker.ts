import { createInterface } from "node:readline";
import { writeFileSync } from "node:fs";
import { loadColonyModel, physicsDigest } from "./lib/colonyArtifacts";
import { createRegisteredWorld, stepWorld } from "../src/sim/world";
import { programmedColony } from "../src/sim/policies/colony";
import { actRegistered, encodeRegisteredFrame } from "../src/sim/controller/registeredNetwork";
import { colonyMotor } from "../src/sim/controller/colonyEncoding";
import { rememberMotor } from "../src/sim/controller/directionalEncoding";
import { deterministicJitter } from "../src/sim/random";
import { colonyOutcomePoint } from "./lib/colonyOutcome";
import { type RegisteredModel } from "../src/sim/controller/registeredModel";
import { TaskTelemetry } from "./lib/taskTelemetry";
import { validateWorldCases, type ColonyWorldCase } from "./lib/colonyWorlds";
import { FloatRows } from "./lib/floatRows";

interface Request {
  model: string;
  output: string;
  worlds: ColonyWorldCase[];
  ticks: number;
  assistance: number;
}
const physics = physicsDigest();

function collectWorld(
  entry: ColonyWorldCase,
  request: Request,
  model: RegisteredModel,
  rows: FloatRows,
  tasks: TaskTelemetry
) {
  const { seed } = entry;
  const world = createRegisteredWorld(seed, model, entry.config);
  let assistedActions = 0;
  for (let tick = 0; tick < request.ticks; tick++) {
    stepWorld(world, (frame, ant) => {
      const history = ant.controllerState.subarray(model.hidden, model.hidden + 8 * model.history);
      const inputs = encodeRegisteredFrame(model, frame, history);
      const previous = [...ant.controllerState.subarray(0, model.hidden)],
        oldHistory = history.slice();
      // Permuted labels are a temporary training convention; inference contains no corresponding rules.
      const reference = programmedColony({ ...frame, task: 255 });
      const target = [0, 5, 2, 7][reference.task!];
      const teacher = { ...reference, task: target === frame.task ? null : target };
      const learned = actRegistered(model, frame, ant.controllerState);
      const draw = (deterministicJitter(seed ^ 0x391e, world.tick, ant.id) + 1) / 2;
      const assisted = draw < request.assistance;
      assistedActions += Number(assisted);
      const action = assisted ? teacher : learned;
      history.set(oldHistory);
      rememberMotor(history, colonyMotor(action));
      rows.append([
        ...inputs,
        ...previous,
        colonyMotor(teacher),
        teacher.task === null ? 0 : teacher.task + 1,
        teacher.pheromoneA,
        teacher.pheromoneB,
        entry.id,
        ant.id,
        world.tick,
      ]);
      tasks.observe(frame, action);
      return action;
    });
    if (world.tick % 2000 === 0)
      writeFileSync(
        `${request.output}.progress.json`,
        JSON.stringify({ caseId: entry.id, rows: rows.rows, final: colonyOutcomePoint(world) })
      );
  }
  return {
    ...entry,
    assistedActions,
    independent: assistedActions === 0,
    final: colonyOutcomePoint(world),
  };
}

function collect(request: Request, model: RegisteredModel) {
  const columns = model.inputs + model.hidden + 7;
  const rows = new FloatRows(request.output, columns),
    outcomes = [],
    tasks = new TaskTelemetry();
  try {
    for (const entry of validateWorldCases(request.worlds))
      outcomes.push(collectWorld(entry, request, model, rows, tasks));
  } finally {
    rows.close();
  }
  return {
    rows: rows.rows,
    columns,
    outcomes,
    tasks: tasks.counts,
    assistance: request.assistance,
    physics,
  };
}

for await (const line of createInterface({ input: process.stdin })) {
  const request = JSON.parse(line) as Request,
    model = loadColonyModel(request.model);
  if (model.version !== 5 || model.tasks !== 8)
    throw new Error("teaching convention requires eight register values");
  console.log(JSON.stringify(collect(request, model)));
}
