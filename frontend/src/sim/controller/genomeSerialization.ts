type CopyMigration = (copy: Float32Array) => Float32Array | null;

/** Split a serialized haploid/diploid payload and migrate each copy. */
export function deserializeGenomeCopies(
  data: Float32Array,
  supportedCopyLengths: readonly number[],
  migrate: CopyMigration
): Float32Array[] {
  const copyLength = supportedCopyLengths.find(
    (length) => data.length === length || data.length === length * 2
  );
  if (copyLength === undefined) {
    throw new Error(`rnn genome payload has unsupported length ${data.length}`);
  }
  const copies: Float32Array[] = [];
  for (let offset = 0; offset < data.length; offset += copyLength) {
    const copy = migrate(data.subarray(offset, offset + copyLength));
    if (copy === null) throw new Error(`cannot migrate rnn genome copy of length ${copyLength}`);
    copies.push(copy);
  }
  return copies;
}
