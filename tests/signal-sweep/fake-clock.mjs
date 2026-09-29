export class FakeClock {
  current = 0;
  now = () => this.current;
  nextId = 1;
  tasks = new Map();

  setTimeout(callback, delayMs) {
    const id = this.nextId++;
    this.tasks.set(id, { at: this.current + Math.max(0, delayMs), callback });
    return id;
  }

  clearTimeout(id) {
    this.tasks.delete(id);
  }

  advance(durationMs) {
    const end = this.current + durationMs;
    for (;;) {
      const next = [...this.tasks.entries()]
        .filter(([, task]) => task.at <= end)
        .sort((left, right) => left[1].at - right[1].at || left[0] - right[0])[0];
      if (!next) break;
      const [id, task] = next;
      this.tasks.delete(id);
      this.current = task.at;
      task.callback();
    }
    this.current = end;
  }
}
