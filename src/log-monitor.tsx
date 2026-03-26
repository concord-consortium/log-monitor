import * as React from "react";
import { onLogEvent, LogEntry } from "./log-monitor-utils";
import { version } from "./index";
import { injectStyles } from "./log-monitor-styles";

// --- Export Helpers ---

const getTimestampSuffix = () => {
  return new Date().toISOString().replace(/[:.]/g, "-");
};

const downloadFile = (
  content: string,
  filename: string,
  mimeType: string
) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const exportAsJSON = (
  entries: LogEntry[],
  prefix: string
) => {
  const sorted = [...entries].reverse();
  const filename = `${prefix}-${getTimestampSuffix()}.json`;
  downloadFile(
    JSON.stringify(sorted, null, 2),
    filename,
    "application/json"
  );
};

const exportAsCSV = (
  entries: LogEntryWithId[],
  prefix: string
) => {
  const sorted = [...entries].reverse();
  const header = "id,timestamp,event,data";
  const rows = sorted.map(e => {
    const data = e.data
      ? JSON.stringify(e.data).replace(/"/g, '""')
      : "";
    return `${e.id},${e.timestamp},"${e.event.replace(/"/g, '""')}","${data}"`;
  });
  const filename = `${prefix}-${getTimestampSuffix()}.csv`;
  downloadFile(
    [header, ...rows].join("\n"),
    filename,
    "text/csv"
  );
};

// --- Icons (Heroicons outline, 24px viewBox) ---

const iconProps = {
  width: 14,
  height: 14,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ClipboardIcon = () => (
  <svg {...iconProps}>
    <path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
    <rect x="8" y="2" width="8" height="4" rx="1" />
  </svg>
);

const ClipboardCheckIcon = () => (
  <svg {...iconProps} strokeWidth={1.5}>
    <path d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3 1.5 1.5 3-3.75" />
  </svg>
);

const DownloadIcon = () => (
  <svg {...iconProps} strokeWidth={1.5}>
    <path d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0 3-3m-3 3V2.25" />
  </svg>
);

// --- Copy Button ---

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = React.useState(false);

  const handleClick = React.useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation(); // don't toggle expand/collapse
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    },
    [text]
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick(e);
      }
    },
    [handleClick]
  );

  return (
    <span
      className={`log-monitor-copy-btn ${
        copied ? "log-monitor-copy-btn-copied" : ""
      }`}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={copied ? "Copied!" : "Copy event data to clipboard"}
      title={copied ? "Copied!" : "Copy event data to clipboard"}
    >
      {copied ? <ClipboardCheckIcon /> : <ClipboardIcon />}
    </span>
  );
};

// --- Footer Buttons ---

interface FooterButtonsProps {
  entries: LogEntryWithId[];
  logFilePrefix: string;
  onClear: () => void;
}

const FooterButtons: React.FC<FooterButtonsProps> = ({
  entries,
  logFilePrefix,
  onClear
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopyAll = React.useCallback(() => {
    const sorted = [...entries].reverse();
    const text = JSON.stringify(sorted, null, 2);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [entries]);

  return (
    <div className="log-monitor-footer">
      <button className="log-monitor-btn" onClick={onClear} title="Clear all log entries">
        Clear
      </button>
      <button
        className="log-monitor-btn"
        onClick={handleCopyAll}
        title="Copy all log entries as JSON to clipboard"
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <button
        className="log-monitor-btn"
        onClick={() => exportAsCSV(entries, logFilePrefix)}
        title="Export log entries as CSV file"
      >
        <DownloadIcon /> CSV
      </button>
      <button
        className="log-monitor-btn"
        onClick={() =>
          exportAsJSON(entries, logFilePrefix)
        }
        title="Export log entries as JSON file"
      >
        <DownloadIcon /> JSON
      </button>
    </div>
  );
};

// --- LogMonitor UI Component ---

interface LogEntryWithId extends LogEntry {
  id: string;
}

let nextId = 1;

export interface LogMonitorProps {
  logFilePrefix?: string;
  theme?: "light" | "dark";
}

export const LogMonitor: React.FC<LogMonitorProps> = ({
  logFilePrefix = "log-events",
  theme = "light"
}) => {
  const [entries, setEntries] =
    React.useState<LogEntryWithId[]>([]);
  const [filter, setFilter] = React.useState("");
  const [expandedIds, setExpandedIds] =
    React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    injectStyles();
  }, []);

  React.useEffect(() => {
    return onLogEvent(entry => {
      setEntries(prev => [
        { ...entry, id: String(nextId++) },
        ...prev
      ]);
    });
  }, []);

  const handleClear = React.useCallback(() => {
    setEntries([]);
    setExpandedIds(new Set());
  }, []);

  const toggleExpanded = React.useCallback(
    (id: string) => {
      setExpandedIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    },
    []
  );

  const filtered = filter
    ? entries.filter(e =>
        e.event.toLowerCase().includes(filter.toLowerCase())
      )
    : entries;

  return (
    <div
      className="log-monitor"
      data-theme={theme}
      data-log-monitor={true}
      onMouseEnter={e => e.stopPropagation()}
      onMouseLeave={e => e.stopPropagation()}
    >
      <div className="log-monitor-header">
        <div className="log-monitor-title-bar">
          <strong>Log Monitor</strong>
          <span className="log-monitor-version">{version}</span>
        </div>
        <input
          className="log-monitor-filter"
          type="text"
          placeholder="Filter events..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
        />
      </div>
      <div className="log-monitor-entries">
        {filtered.length === 0 && (
          <div className="log-monitor-empty">
            {entries.length === 0
              ? "Waiting for events\u2026"
              : "No matching events"}
          </div>
        )}
        {filtered.map(entry => (
          <div
            key={entry.id}
            className="log-monitor-entry"
            role="button"
            tabIndex={0}
            aria-expanded={expandedIds.has(entry.id)}
            onClick={() => toggleExpanded(entry.id)}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleExpanded(entry.id);
              }
            }}
          >
            <div className="log-monitor-entry-header">
              <span className="log-monitor-event-name">
                {entry.event}
              </span>
              <span className="log-monitor-timestamp">
                {new Date(
                  entry.timestamp
                ).toLocaleTimeString()}
              </span>
            </div>
            {expandedIds.has(entry.id) && (
              <div className={`log-monitor-payload-wrapper${entry.data ? "" : " log-monitor-payload-empty"}`}>
                <CopyButton
                  text={JSON.stringify(entry, null, 2)}
                />
                <pre className="log-monitor-payload">
                  {entry.data
                    ? JSON.stringify(entry.data, null, 2)
                    : "(no extra data)"}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
      <FooterButtons
        entries={entries}
        logFilePrefix={logFilePrefix}
        onClear={handleClear}
      />
    </div>
  );
};
