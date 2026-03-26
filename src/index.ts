export const version = "1.0.0-pre.0";

export { LogMonitor } from "./log-monitor";
export type { LogMonitorProps } from "./log-monitor";
export type { LogEntry } from "./log-monitor-utils";
export {
  emitLogEvent,
  onLogEvent,
  createLogWrapper
} from "./log-monitor-utils";
