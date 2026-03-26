import React, { useState, useRef, useCallback, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { LogMonitor, emitLogEvent } from "../src";

// --- Payload generators ---

const payloads: Record<string, () => Record<string, unknown> | undefined> = {
  none: () => undefined,
  small: () => ({ userId: 42, action: "click" }),
  medium: () => ({
    userId: 42,
    action: "submit",
    form: "settings",
    fields: { theme: "dark", language: "en", notifications: true },
    timestamp: new Date().toISOString(),
  }),
  large: () => ({
    userId: 42,
    sessionId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    action: "experiment-snapshot",
    context: {
      page: "/simulation/thermal-equilibrium",
      viewport: { width: 1920, height: 1080 },
      devicePixelRatio: 2,
    },
    model: {
      temperature: [22.5, 23.1, 24.8, 26.2, 27.0, 25.5, 24.1, 23.3],
      pressure: 101.325,
      volume: 0.0224,
      particles: Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 500,
        y: Math.random() * 500,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
      })),
    },
    metadata: {
      runId: "run-20260326-001",
      iteration: 1547,
      elapsed: 32450,
      tags: ["thermal", "equilibrium", "v2", "classroom-pilot"],
    },
  }),
  "x-large": () => ({
    userId: 42,
    sessionId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    action: "full-state-export",
    context: {
      page: "/simulation/thermal-equilibrium",
      viewport: { width: 1920, height: 1080 },
      devicePixelRatio: 2,
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      locale: "en-US",
      timezone: "America/New_York",
    },
    model: {
      temperature: Array.from({ length: 50 }, () => 20 + Math.random() * 15),
      pressure: Array.from({ length: 50 }, () => 95 + Math.random() * 15),
      volume: 0.0224,
      particles: Array.from({ length: 100 }, (_, i) => ({
        id: i,
        x: Math.random() * 500,
        y: Math.random() * 500,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        mass: 1 + Math.random() * 4,
        radius: 2 + Math.random() * 8,
        color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
      })),
      grid: Array.from({ length: 10 }, (_, row) =>
        Array.from({ length: 10 }, (_, col) => ({
          row, col,
          value: Math.random() * 100,
          active: Math.random() > 0.3,
        }))
      ),
    },
    history: Array.from({ length: 20 }, (_, i) => ({
      step: i,
      timestamp: Date.now() - (20 - i) * 1000,
      event: ["tick", "collision", "boundary-hit", "equilibrium-check"][i % 4],
      delta: { temperature: (Math.random() - 0.5) * 2, pressure: (Math.random() - 0.5) * 0.5 },
    })),
    metadata: {
      runId: "run-20260326-001",
      iteration: 1547,
      elapsed: 32450,
      tags: ["thermal", "equilibrium", "v2", "classroom-pilot", "large-dataset", "benchmark"],
      config: {
        stepSize: 0.01,
        maxIterations: 10000,
        convergenceThreshold: 0.001,
        boundaryConditions: "periodic",
        integrator: "velocity-verlet",
      },
    },
  }),
};

const payloadSizes = ["none", "small", "medium", "large", "x-large"] as const;
payloads.random = () => payloads[payloadSizes[Math.floor(Math.random() * payloadSizes.length)]]();

// --- Event name generators ---

const nameLengths = ["short", "medium", "long"] as const;

const eventNames: Record<string, () => string> = {
  short: () => "click",
  medium: () => "model-parameter-changed",
  long: () => "interactive-simulation-thermal-equilibrium-particle-collision-detected",
  random: () => eventNames[nameLengths[Math.floor(Math.random() * nameLengths.length)]](),
};

// --- Settings persistence ---

const STORAGE_KEY = "logMonitorDemoSettings";

interface DemoSettings {
  payloadSize: string;
  count: number;
  delayMs: number;
  theme: "light" | "dark";
}

const defaultSettings: DemoSettings = {
  payloadSize: "small",
  count: 1,
  delayMs: 0,
  theme: "light",
};

const loadSettings = (): DemoSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...defaultSettings, ...JSON.parse(stored) };
  } catch { /* ignore */ }
  return defaultSettings;
};

const saveSettings = (settings: DemoSettings) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};

// --- Demo App ---

const App = () => {
  const initial = useRef(loadSettings()).current;
  const [payloadSize, setPayloadSize] = useState(initial.payloadSize);
  const [count, setCount] = useState(initial.count);
  const [delayMs, setDelayMs] = useState(initial.delayMs);
  const [theme, setTheme] = useState<"light" | "dark">(initial.theme);
  const [sending, setSending] = useState(false);
  const cancelRef = useRef(false);

  useEffect(() => {
    saveSettings({ payloadSize, count, delayMs, theme });
  }, [payloadSize, count, delayMs, theme]);

  const sendEvents = useCallback(
    async (nameLength: string) => {
      cancelRef.current = false;
      setSending(true);
      for (let i = 0; i < count; i++) {
        if (cancelRef.current) break;
        const data = payloads[payloadSize]();
        emitLogEvent({
          event: eventNames[nameLength](),
          data,
          timestamp: Date.now(),
        });
        if (delayMs > 0 && i < count - 1) {
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }
      setSending(false);
    },
    [payloadSize, count, delayMs]
  );

  const sendAllCombos = useCallback(async () => {
    cancelRef.current = false;
    setSending(true);
    for (const size of payloadSizes) {
      for (const name of nameLengths) {
        if (cancelRef.current) break;
        emitLogEvent({
          event: eventNames[name](),
          data: payloads[size](),
          timestamp: Date.now(),
        });
        if (delayMs > 0) {
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }
    }
    setSending(false);
  }, [delayMs]);

  const cancel = () => {
    cancelRef.current = true;
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif" }}>
      {/* Controls panel */}
      <div style={{ flex: 1, padding: 16, overflow: "auto" }}>
        <h1 style={{ margin: "0 0 24px" }}>Log Monitor Demo</h1>

        {/* Payload size */}
        <fieldset style={{ marginBottom: 16, border: "1px solid #ccc", padding: 12, borderRadius: 4 }}>
          <legend><strong>Payload Size</strong></legend>
          {Object.keys(payloads).map((size) => (
            <label key={size} style={{ marginRight: 16, cursor: "pointer" }}>
              <input
                type="radio"
                name="payloadSize"
                value={size}
                checked={payloadSize === size}
                onChange={() => setPayloadSize(size)}
              />{" "}
              {size}
            </label>
          ))}
        </fieldset>

        {/* Batch controls */}
        <fieldset style={{ marginBottom: 16, border: "1px solid #ccc", padding: 12, borderRadius: 4 }}>
          <legend><strong>Batch</strong></legend>
          <label style={{ marginRight: 16 }}>
            Count:{" "}
            <input
              type="number"
              min={1}
              value={count}
              onChange={(e) => setCount(Math.max(1, parseInt(e.target.value) || 1))}
              style={{ width: 70, padding: "4px 8px" }}
            />
          </label>
          <label>
            Delay (ms):{" "}
            <input
              type="number"
              min={0}
              step={50}
              value={delayMs}
              onChange={(e) => setDelayMs(Math.max(0, parseInt(e.target.value) || 0))}
              style={{ width: 70, padding: "4px 8px" }}
            />
          </label>
        </fieldset>

        {/* Send buttons */}
        <fieldset style={{ marginBottom: 16, border: "1px solid #ccc", padding: 12, borderRadius: 4 }}>
          <legend><strong>Send Events</strong> (by event name length)</legend>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Object.entries(eventNames).map(([length, getName]) => (
              <button
                key={length}
                disabled={sending}
                onClick={() => sendEvents(length)}
                style={{ padding: "8px 16px", cursor: sending ? "not-allowed" : "pointer" }}
                title={getName()}
              >
                {length === "random" ? "random" : `${length} name`}
              </button>
            ))}
            <button
              disabled={sending}
              onClick={sendAllCombos}
              style={{ padding: "8px 16px", cursor: sending ? "not-allowed" : "pointer" }}
              title="Send one event for every payload size × name length combination"
            >
              all combos
            </button>
            {sending && (
              <button onClick={cancel} style={{ padding: "8px 16px", color: "red" }}>
                Cancel
              </button>
            )}
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
            <div><strong>short:</strong> {eventNames.short()}</div>
            <div><strong>medium:</strong> {eventNames.medium()}</div>
            <div><strong>long:</strong> {eventNames.long()}</div>
            <div><strong>random:</strong> random pick from above</div>
            <div><strong>all combos:</strong> one event per payload size × name length ({payloadSizes.length * nameLengths.length} events)</div>
          </div>
        </fieldset>

        {/* Theme toggle */}
        <fieldset style={{ border: "1px solid #ccc", padding: 12, borderRadius: 4 }}>
          <legend><strong>Theme</strong></legend>
          <label style={{ cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={theme === "dark"}
              onChange={() => setTheme(theme === "light" ? "dark" : "light")}
            />{" "}
            Dark mode
          </label>
        </fieldset>
      </div>

      {/* Monitor sidebar */}
      <LogMonitor theme={theme} />
    </div>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
