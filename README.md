# @concord-consortium/log-monitor

A real-time log event monitor sidebar for Concord Consortium applications. Displays log events as they fire, with filtering, expandable payloads, and CSV/JSON export. Supports light and dark themes.

## Installation

```bash
npm install @concord-consortium/log-monitor
```

During development, use [yalc](https://github.com/wclr/yalc) for local linking:

```bash
# In the log-monitor repo:
yalc publish

# In the consuming app:
yalc add @concord-consortium/log-monitor
```

## Usage

There are two ways to connect the LogMonitor to your app's logging:

### Direct log wrapper

For apps that call `log()` directly (e.g., simulation models using `@concord-consortium/lara-interactive-api`):

```ts
import { log as originalLog } from "@concord-consortium/lara-interactive-api";
import { createLogWrapper } from "@concord-consortium/log-monitor";

const log = enabled ? createLogWrapper(originalLog) : originalLog;
```

### Listener/subscriber

For apps with a centralized Logger that has a listener API or event emitter:

```ts
import { emitLogEvent } from "@concord-consortium/log-monitor";

Logger.registerLogListener((logMessage) => {
  const { event, ...data } = logMessage;
  emitLogEvent({ event, data, timestamp: Date.now() });
});
```

### Rendering the sidebar

```tsx
import { LogMonitor } from "@concord-consortium/log-monitor";

{enabled && <LogMonitor logFilePrefix="my-app-log-events" theme="dark" />}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `logFilePrefix` | `string` | `"log-events"` | Prefix for exported CSV/JSON filenames |
| `theme` | `"light" \| "dark"` | `"light"` | Color theme for the sidebar |

## Exports

| Export | Type | Description |
|--------|------|-------------|
| `LogMonitor` | React component | The sidebar UI |
| `createLogWrapper` | `(originalLog) => wrappedLog` | Wraps a log function to also emit to the monitor |
| `emitLogEvent` | `(entry: LogEntry) => void` | Manually push an event into the monitor |
| `onLogEvent` | `(listener) => unsubscribe` | Subscribe to log events (used internally by `LogMonitor`) |
| `LogEntry` | TypeScript type | `{ event: string; data?: Record<string, unknown>; timestamp: number }` |
| `LogMonitorProps` | TypeScript type | Props for the `LogMonitor` component |

## Integrations

See [integrations.md](integrations.md) for detailed integration guides with code examples for each Concord Consortium application:

- **hurricane-model** / **wildfire-model** / **flooding-model** — direct log wrapper
- **activity-player** — Logger/LARA Events subscriber (sees all embedded interactives)
- **question-interactives demo** — postMessage subscriber (replaces `console.log`)
- **collaborative-learning (CLUE)** — `Logger.registerLogListener()` (100+ event types)
- **CODAP v3** — `Logger.registerLogListener()`

## Development

```bash
git clone https://github.com/concord-consortium/log-monitor.git
cd log-monitor
npm install
npm test
npm run build
```

### Demo

An internal demo app is included for developing and testing the LogMonitor component in isolation:

```bash
npm run demo
```

This starts a Vite dev server with a control panel that lets you:

- Select **payload size** (none, small, medium, large) to test the payload viewer at different data volumes
- Send events with **short, medium, or long event names** to test name layout/truncation
- Set the **number of events** to send in a batch and the **delay** between them
- Toggle **light/dark theme**

The demo is excluded from the published npm package (`"files": ["dist"]`) and from the library's TypeScript build.

### Testing in a consuming app

To test changes in a consuming app locally:

```bash
npm run build && yalc push
```

## Publishing

1. Update the `version` constant in `src/index.ts` and `version` in `package.json`
2. Run `npm publish`

The `prepublishOnly` script automatically runs the build before publishing.

## Requirements

- React >= 16.8 (peer dependency)
- No other dependencies

# License

Copyright 2026 (c) by the Concord Consortium and is distributed under the [MIT license](http://www.opensource.org/licenses/MIT).