# Integration Guide

How to integrate `@concord-consortium/log-monitor` into each Concord Consortium application.

There are two integration patterns depending on how the app handles logging:

1. **Direct log wrapper** — The app calls `log()` directly. Wrap it with `createLogWrapper` so calls also emit to the monitor.
2. **Listener/subscriber** — The app has a centralized Logger with a listener API. Register a listener that forwards events to `emitLogEvent`.

---

## hurricane-model

**Pattern:** Direct log wrapper (class components use a module-level `src/log.ts` wrapper)

**Log source:** `log()` from `@concord-consortium/lara-interactive-api`, called directly in components and `simulation.ts`

**URL param:** `logMonitor` in `DEFAULT_CONFIG` (`src/config.ts`)

**Status:** Implemented

### `src/log.ts`

```ts
import { log as laraLog } from "@concord-consortium/lara-interactive-api";
import { createLogWrapper } from "@concord-consortium/log-monitor";
import config from "./config";

export const log = config.logMonitor
  ? createLogWrapper(laraLog)
  : laraLog;
```

All components import `log` from `../log` instead of directly from the LARA API.

### `src/components/index-page.tsx`

```tsx
import { LogMonitor } from "@concord-consortium/log-monitor";

// In render:
{config.logMonitor && <LogMonitor logFilePrefix="hurricane-log-events" />}
```

### Notes

- Hurricane-model uses class components with `@inject/@observer`, so hooks like `useLog()` can't be used directly. The `src/log.ts` module-level wrapper avoids this problem entirely.
- All 12+ component files keep `import { log } from "../log"` unchanged.

---

## wildfire-model

**Pattern:** Direct log wrapper (functional components can use `useLog()` hook or module-level wrapper)

**Log source:** `log()` from `@concord-consortium/lara-interactive-api`

**URL param:** Add `logMonitor: false` to `DEFAULT_CONFIG` in `src/config.ts`

### Option A: Module-level wrapper (same as hurricane-model)

Create `src/log.ts` and update all `log` imports — identical to the hurricane-model approach.

### Option B: React context (if preferred)

```tsx
// In app entry:
import { LogMonitorProvider } from "@concord-consortium/log-monitor";
import { log } from "@concord-consortium/lara-interactive-api";

<LogMonitorProvider log={log} enabled={config.logMonitor}>
  <AppComponent />
</LogMonitorProvider>

// In each component:
import { useLog } from "@concord-consortium/log-monitor";
const { log } = useLog();
```

### Render

```tsx
import { LogMonitor } from "@concord-consortium/log-monitor";

{config.logMonitor && <LogMonitor logFilePrefix="wildfire-log-events" />}
```

---

## flooding-model

**Pattern:** Same as wildfire-model — functional components, same options.

**Log source:** `log()` from `@concord-consortium/lara-interactive-api`

**URL param:** Add `logMonitor: false` to `DEFAULT_CONFIG` in `src/config.ts`

Follow the wildfire-model integration (Option A or B above), using `logFilePrefix="flooding-log-events"`.

---

## activity-player

**Pattern:** Listener/subscriber — subscribe to the LARA Events `onLog` bus which carries all log events (app-level and iframe interactives).

**Log source:** `Logger` class in `src/lib/logger.ts` processes every log from embedded iframes. `LARA.Events.emitLog()` in `src/lara-plugin/events/index.ts` publishes each event internally via an EventEmitter2 instance.

**URL param:** Uses the existing `queryValueBoolean()` system in `src/utilities/url-query.ts`.

### `src/lib/logger.ts`

Subscribe to the LARA Events `onLog` bus at module level. This captures both app-level events and iframe interactive events, since `Logger.log()` calls `LARA.Events.emitLog()` for all log messages.

```ts
import { emitLogEvent } from "@concord-consortium/log-monitor";
import { onLog } from "../lara-plugin/events";
import { queryValueBoolean } from "../utilities/url-query";

const logMonitorEnabled = queryValueBoolean("logMonitor");
if (logMonitorEnabled) {
  onLog((logData: any) => {
    const { event, ...data } = logData;
    emitLogEvent({ event, data, timestamp: Date.now() });
  });
}
```

### `src/components/app.tsx`

Render the `LogMonitor` as a sibling of the `.app` div (inside the `#app` flex container) so it appears as a sidebar on the right.

```tsx
import { LogMonitor } from "@concord-consortium/log-monitor";

const logMonitorEnabled = queryValueBoolean("logMonitor");

// In render, after the closing </div> of .app:
{logMonitorEnabled && <LogMonitor logFilePrefix="activity-player-log-events" />}
```

### `src/components/app.scss`

CSS adjustments so the LogMonitor renders beside the app content rather than below it:

- `#app`: Change `overflow: auto` to `overflow: hidden`, add `> .app { overflow: auto; }` so scrolling is scoped to the app content.
- `#app`: Add `&:has(.log-monitor) > .app { height: 100%; }` so the app gets a scrollbar only when the sidebar is present.
- `.app`: Add `flex: 1;` and `min-width: 0;` so it shrinks to make room for the 300px sidebar.

### Value

This is the most powerful integration — researchers see the full enriched log stream for an entire activity session across all embedded interactives, exactly as it would be sent to the logging service. Each log includes user info, session ID, activity/page context, and interactive URL.

---

## question-interactives demo

**Pattern:** Listener/subscriber — the demo intercepts log messages from embedded iframes via postMessage.

**Log source:** postMessage `"log"` events in `DemoComponent` (`packages/helpers/src/components/demo.tsx`), currently handled with `console.log`.

**URL param:** `logMonitor=true` query parameter, read from `URLSearchParams` at module level.

### Integration

#### `packages/helpers/src/components/demo.tsx`

```tsx
import { LogMonitor, emitLogEvent } from "@concord-consortium/log-monitor";

// At module level, after existing params setup:
const logMonitorEnabled = params.get("logMonitor") === "true";

// In the message handler, add emitLogEvent alongside existing console.log:
case "log":
  if (rootDemo) {
    console.log("DEMO LOG:", JSON.stringify(data.content));
    if (logMonitorEnabled) {
      emitLogEvent({
        event: data.content.action,
        data: data.content.data,
        timestamp: Date.now()
      });
    }
  }
  break;

// In the default (root demo) render, wrap header+split in a demoContent div
// so the LogMonitor renders as a sidebar:
default:
  return (
    <div className={`${css.demo} ${logMonitorEnabled ? css.withLogMonitor : ""}`}>
      <div className={css.demoContent}>
        <div className={css.header}><h1>{title}</h1></div>
        <div className={css.split}>
          <div className={css.authoring}>...</div>
          <div className={css.runtime}>...</div>
        </div>
      </div>
      {logMonitorEnabled && <LogMonitor logFilePrefix={`${title.toLowerCase().replace(/\s+/g, "-")}-log-events`} />}
    </div>
  );
```

#### `packages/helpers/src/components/demo.scss`

Add sidebar layout styles inside `.demo`:

```scss
&.withLogMonitor {
  flex-direction: row;

  .demoContent {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  :global(.log-monitor) {
    width: 300px;
    flex-shrink: 0;
  }
}
```

### Value

Every question-interactive's demo page gets a built-in log viewer for free. Since `DemoComponent` is in the shared helpers package, all interactives (open-response, drawing-tool, bar-graph, etc.) benefit automatically.

---

## collaborative-learning (CLUE)

**Pattern:** Listener/subscriber — Logger has a built-in `registerLogListener()` API.

**Log source:** `Logger` class in `src/lib/logger.ts` with 100+ log event types. `Logger.Instance.registerLogListener()` accepts listeners that receive full `LogMessage` objects in real time.

**URL param:** Add `logMonitor?: boolean` to `QueryParams` in `src/utilities/url-params.ts`. Check via `urlParams.logMonitor`.

### Integration

**URL param:** Add `logMonitor?: boolean` to `QueryParams` and to the `booleanParams` array in `src/utilities/url-params.ts`.

**Listener registration** in `src/lib/misc.ts` (inside `problemLoaded`, after Logger is initialized):

```ts
import { emitLogEvent } from "@concord-consortium/log-monitor";
import { urlParams } from "../utilities/url-params";
import { Logger, LogMessage } from "./logger";

// In problemLoaded(), after existing registerLogListener calls:
if (urlParams.logMonitor) {
  Logger.Instance?.registerLogListener((logMessage: LogMessage) => {
    const { event, ...data } = logMessage;
    emitLogEvent({ event, data, timestamp: Date.now() });
  });
}
```

**Render** in `src/components/app.tsx` (in `renderApp`, as a sibling of `.app`):

```tsx
import { LogMonitor } from "@concord-consortium/log-monitor";

private renderApp(children: JSX.Element | JSX.Element[]) {
  return (
    <>
      <div className="app">
        {children}
      </div>
      {urlParams.logMonitor && <LogMonitor logFilePrefix="clue-log-events" />}
    </>
  );
}
```

**CSS adjustments** in `src/components/app.scss` — scope layout overrides inside `&:has(.log-monitor)` so normal rendering is unaffected:

```scss
#app {
  // ... existing styles ...

  &:has(.log-monitor) {
    overflow: hidden;

    > .app {
      flex: 1;
      min-width: 0;
      height: 100%;
      overflow: auto;

      > .progress, > .error {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
      }
    }

    .clue-app-content {
      width: 100%;
    }
  }
}
```

### Notes

- `.clue-app-content` normally uses `width: 100vw` which ignores flex layout. The `&:has(.log-monitor)` override switches it to `width: 100%` so it shrinks for the sidebar.
- Loading/error states (`.progress`, `.error`) need explicit centering inside `.app` since the parent `#app` centering no longer applies when `.app` has `flex: 1`.

### Value

CLUE generates a high volume of fine-grained events (tile CRUD, undo/redo, chat, navigation). The LogMonitor lets developers and researchers see the full event stream during a collaborative session — especially useful for debugging undo/redo sequences and multi-user interactions.

---

## CODAP v3

**Pattern:** Listener/subscriber — same `Logger.registerLogListener()` infrastructure as CLUE. CODAP even has a `log-message-monitor-handler.ts` file (`src/data-interactive/handlers/log-message-monitor-handler.ts`) stubbed as "not implemented yet."

**Log source:** `Logger` class in `src/lib/logger.ts`.

**URL param:** Add `logMonitor` to `UrlParams` in `src/utilities/url-params.ts`.

### Prerequisites

**Fix `Logger.formatAndSend`:** The `registerLogListener` method and `logListeners` array exist but `formatAndSend` never notifies listeners. Add the following line in `formatAndSend` (after `createLogMessage`, before `sendToLoggingService`):

```ts
this.logListeners.forEach(listener => listener(logMessage))
```

### Integration

#### `src/components/app.tsx`

```tsx
import { LogMonitor, emitLogEvent } from "@concord-consortium/log-monitor";
import { booleanParam, urlParams } from "../utilities/url-params";

// At module level:
const logMonitorEnabled = booleanParam(urlParams.logMonitor);

// After Logger.initializeLogger() in App's useEffect:
if (logMonitorEnabled) {
  Logger.Instance.registerLogListener((logMessage) => {
    const { event, ...data } = logMessage;
    emitLogEvent({ event, data, timestamp: Date.now() });
  });
}

// In render, as a sibling of the .codap-app div (inside the ProgressContext.Provider):
{logMonitorEnabled && <LogMonitor logFilePrefix="codap-log-events" />}
```

#### `src/components/app.scss`

The LogMonitor renders as a sibling of `.codap-app` inside the `#codap-app-id` flex container. CSS adjustments:

```scss
#codap-app-id {
  &:has(.log-monitor) {
    .codap-app {
      flex: 1;
      min-width: 0;
    }

    > .log-monitor {
      padding-top: vars.$menu-bar-height;
    }
  }
}
```

### Value

CODAP v3 logs document operations, formula editing, graph/table manipulations, plugin interactions, and data imports. The LogMonitor is especially useful for debugging data interactive plugins and for researchers verifying that student interactions with datasets are being captured correctly.

---

## Summary

| App | Pattern | Log source | Filename prefix |
|-----|---------|-----------|----------------|
| hurricane-model | Direct wrapper | LARA `log()` | `hurricane-log-events` |
| wildfire-model | Direct wrapper | LARA `log()` | `wildfire-log-events` |
| flooding-model | Direct wrapper | LARA `log()` | `flooding-log-events` |
| activity-player | Listener | `Logger` / LARA Events | `activity-player-log-events` |
| question-interactives | Listener | postMessage | `{title}-log-events` |
| collaborative-learning | Listener | `Logger.registerLogListener()` | `clue-log-events` |
| CODAP v3 | Listener | `Logger.registerLogListener()` | `codap-log-events` |
