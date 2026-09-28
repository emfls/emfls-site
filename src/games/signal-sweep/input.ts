export interface InputClockSample {
  readonly now: number;
  readonly timeOrigin: number;
}

export function normalizeInputTimestamp(eventTimestamp: number, sample: InputClockSample): number {
  const now = Number.isFinite(sample.now) && sample.now >= 0 ? sample.now : 0;
  if (!Number.isFinite(eventTimestamp) || eventTimestamp < 0) return now;

  if (Number.isFinite(sample.timeOrigin) && sample.timeOrigin > 0 && eventTimestamp > sample.timeOrigin) {
    const monotonicTimestamp = eventTimestamp - sample.timeOrigin;
    return Number.isFinite(monotonicTimestamp) && monotonicTimestamp >= 0 ? monotonicTimestamp : now;
  }
  return eventTimestamp;
}

export function inputBeatsDeadline(
  eventTimestamp: number,
  deadline: number,
  sample: InputClockSample,
): { timestamp: number; beatsDeadline: boolean } {
  const timestamp = normalizeInputTimestamp(eventTimestamp, sample);
  return Object.freeze({ timestamp, beatsDeadline: timestamp < deadline });
}
