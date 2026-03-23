import { emitLogEvent, onLogEvent, createLogWrapper, LogEntry, _resetListeners } from "./log-monitor-utils";

afterEach(() => {
  _resetListeners();
});

describe("onLogEvent / emitLogEvent", () => {
  it("delivers emitted events to listeners", () => {
    const received: LogEntry[] = [];
    const unsub = onLogEvent(entry => received.push(entry));

    const entry: LogEntry = { event: "click", data: { x: 1 }, timestamp: 1000 };
    emitLogEvent(entry);

    expect(received).toEqual([entry]);
    unsub();
  });

  it("supports multiple listeners", () => {
    const a: LogEntry[] = [];
    const b: LogEntry[] = [];
    const unsubA = onLogEvent(e => a.push(e));
    const unsubB = onLogEvent(e => b.push(e));

    const entry: LogEntry = { event: "test", timestamp: 2000 };
    emitLogEvent(entry);

    expect(a).toEqual([entry]);
    expect(b).toEqual([entry]);
    unsubA();
    unsubB();
  });

  it("unsubscribe removes only that listener", () => {
    const a: LogEntry[] = [];
    const b: LogEntry[] = [];
    const unsubA = onLogEvent(e => a.push(e));
    const unsubB = onLogEvent(e => b.push(e));

    unsubA();

    emitLogEvent({ event: "after-unsub", timestamp: 3000 });
    expect(a).toHaveLength(0);
    expect(b).toHaveLength(1);
    unsubB();
  });

  it("unsubscribing twice is a no-op", () => {
    const received: LogEntry[] = [];
    const unsub = onLogEvent(e => received.push(e));
    unsub();
    unsub();

    emitLogEvent({ event: "test", timestamp: 4000 });
    expect(received).toHaveLength(0);
  });

  it("handles entries without data", () => {
    const received: LogEntry[] = [];
    const unsub = onLogEvent(e => received.push(e));

    emitLogEvent({ event: "no-data", timestamp: 5000 });
    expect(received[0].data).toBeUndefined();
    unsub();
  });
});

describe("createLogWrapper", () => {
  it("calls the original log function with event and data", () => {
    const calls: Array<[string, Record<string, unknown> | undefined]> = [];
    const original = (event: string, data?: Record<string, unknown>) => {
      calls.push([event, data]);
    };

    const wrapped = createLogWrapper(original);
    wrapped("my-event", { key: "value" });

    expect(calls).toEqual([["my-event", { key: "value" }]]);
  });

  it("emits a LogEntry to subscribers", () => {
    const original = jest.fn();
    const wrapped = createLogWrapper(original);

    const received: LogEntry[] = [];
    const unsub = onLogEvent(e => received.push(e));

    const beforeTs = Date.now();
    wrapped("test-event", { foo: "bar" });
    const afterTs = Date.now();

    expect(received).toHaveLength(1);
    expect(received[0].event).toBe("test-event");
    expect(received[0].data).toEqual({ foo: "bar" });
    expect(received[0].timestamp).toBeGreaterThanOrEqual(beforeTs);
    expect(received[0].timestamp).toBeLessThanOrEqual(afterTs);
    unsub();
  });

  it("works without data argument", () => {
    const original = jest.fn();
    const wrapped = createLogWrapper(original);

    const received: LogEntry[] = [];
    const unsub = onLogEvent(e => received.push(e));

    wrapped("bare-event");

    expect(original).toHaveBeenCalledWith("bare-event", undefined);
    expect(received[0].data).toBeUndefined();
    unsub();
  });
});
