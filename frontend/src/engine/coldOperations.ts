/** Bound peak memory by admitting one snapshot/compression/restore operation at a time. */
export class ColdOperations {
  private tail: Promise<void> = Promise.resolve();
  private pending = 0;
  get busy() {
    return this.pending > 0;
  }
  async run<T>(operation: () => Promise<T>): Promise<T> {
    if (this.pending >= 4) throw new Error("Storage is busy; wait for the current operation");
    this.pending++;
    const previous = this.tail;
    let release!: () => void;
    this.tail = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await operation();
    } finally {
      this.pending--;
      release();
    }
  }
}
