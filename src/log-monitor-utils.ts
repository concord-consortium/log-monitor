// --- Types ---

export interface LogEntry {
  event: string;
  data?: Record<string, unknown>;
  timestamp: number;
}

// --- Pub/Sub Event Emitter ---

type LogListener = (entry: LogEntry) => void;
const listeners: LogListener[] = [];

export const onLogEvent = (listener: LogListener): (() => void) => {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx !== -1) listeners.splice(idx, 1);
  };
};

export const emitLogEvent = (entry: LogEntry) => {
  listeners.forEach(fn => fn(entry));
};

/** @internal Test-only: remove all listeners. */
export const _resetListeners = () => {
  listeners.length = 0;
};

// --- Log Wrapper ---

// Returns a wrapped log function that calls the original
// and emits to the monitor.
export const createLogWrapper = (
  originalLog: (
    event: string,
    data?: Record<string, unknown>
  ) => void
) => {
  return (
    event: string,
    data?: Record<string, unknown>
  ) => {
    originalLog(event, data);
    emitLogEvent({ event, data, timestamp: Date.now() });
  };
};
