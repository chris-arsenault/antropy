import { dense, type DirectionalParameters } from "./directionalModel";

type Model = DirectionalParameters & { readonly version: number };

export function recurrentHidden(
  model: Model,
  context: ArrayLike<number>,
  state: Float32Array,
  additional: Float32Array | null
): Float32Array {
  const hidden = dense(context, model.context, false);
  const previous = dense(state.subarray(0, model.hidden), model.recurrence, false);
  for (let i = 0; i < hidden.length; i++)
    hidden[i] = Math.tanh(hidden[i] + (model.recurrent ? previous[i] : 0) + (additional?.[i] ?? 0));
  state.set(hidden);
  return hidden;
}

export function directionalReadout(
  model: Model,
  embeddings: Float32Array[],
  hidden: Float32Array
): Float32Array {
  const scores = [0, 1, 7].map((offset, i) => {
    const local =
      model.version !== 2
        ? [
            ...embeddings[(offset + 7) % 8],
            ...embeddings[offset],
            ...embeddings[(offset + 1) % 8],
            ...[0, 1, 2].map((motor) => Number(motor === i)),
          ]
        : [...embeddings[offset]];
    const score = dense([...local, ...hidden], model.scorer, true);
    return dense(score, model.direction, false)[0] + model.motorBias[i];
  });
  const care = dense(hidden, model.care, false);
  return Float32Array.from([care[0], scores[1], scores[2], scores[0], ...care.slice(1)]);
}
