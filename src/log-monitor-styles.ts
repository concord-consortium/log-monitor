// Injected at runtime via <style> tag — no CSS loader required for consumers.
// Theme switching via data-theme attribute on root element toggles CSS custom properties.

const STYLE_ID = "log-monitor-styles";

export const injectStyles = () => {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
};

const CSS = `
/* --- Theme Variables --- */

.log-monitor[data-theme="dark"] {
  --lm-bg: #1e1e1e;
  --lm-bg-secondary: #2d2d2d;
  --lm-bg-hover: #2a2d2e;
  --lm-bg-active: #4e4e4e;
  --lm-border: #333;
  --lm-border-subtle: #2d2d2d;
  --lm-text: #d4d4d4;
  --lm-text-muted: #888;
  --lm-text-event: #4ec9b0;
  --lm-text-payload: #ce9178;
  --lm-accent: #007acc;
  --lm-btn-bg: #2d2d2d;
  --lm-btn-border: #444;
  --lm-btn-hover: #3e3e3e;
}

.log-monitor[data-theme="light"] {
  --lm-bg: #ebebeb;
  --lm-bg-secondary: #f5f5f5;
  --lm-bg-hover: #dfe3e6;
  --lm-bg-active: #a0a0a0;
  --lm-border: #9c9c9c;
  --lm-border-subtle: #d0d0d0;
  --lm-text: #262626;
  --lm-text-muted: #666666;
  --lm-text-event: #0e7c6b;
  --lm-text-payload: #a44a1f;
  --lm-accent: #007acc;
  --lm-btn-bg: #f5f5f5;
  --lm-btn-border: #999;
  --lm-btn-hover: #d0d0d0;
}

/* --- Layout --- */

.log-monitor {
  width: 300px;
  min-width: 300px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--lm-bg);
  color: var(--lm-text);
  font-family: "Courier New", Consolas, monospace;
  font-size: 11px;
  border-left: 1px solid var(--lm-border);
  overflow: hidden;
  box-sizing: border-box;
}

.log-monitor *, .log-monitor *::before, .log-monitor *::after {
  box-sizing: border-box;
}

/* --- Header --- */

.log-monitor-title-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
  font-size: 12px;
  color: var(--lm-text);
}

.log-monitor-version {
  color: var(--lm-text-muted);
  font-size: 11px;
}

.log-monitor-header {
  padding: 8px;
  border-bottom: 1px solid var(--lm-border);
  flex-shrink: 0;
}

.log-monitor-filter {
  width: 100%;
  padding: 4px 8px;
  background: var(--lm-bg-secondary);
  border: 1px solid var(--lm-btn-border);
  border-radius: 3px;
  color: var(--lm-text);
  font-family: inherit;
  font-size: inherit;
  box-sizing: border-box;
}

.log-monitor-filter::placeholder {
  color: var(--lm-text-muted);
}

.log-monitor-filter:focus {
  outline: 2px solid var(--lm-accent);
  outline-offset: -2px;
  border-color: var(--lm-accent);
}

/* --- Entries --- */

.log-monitor-entries {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.log-monitor-empty {
  padding: 16px 8px;
  text-align: center;
  color: var(--lm-text-muted);
  font-style: italic;
}

.log-monitor-entry {
  padding: 4px 8px;
  border-bottom: 1px solid var(--lm-border-subtle);
  cursor: pointer;
}

.log-monitor-entry:hover {
  background: var(--lm-bg-hover);
}

.log-monitor-entry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.log-monitor-event-name {
  color: var(--lm-text-event);
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.log-monitor-timestamp {
  color: var(--lm-text-muted);
  margin-left: 8px;
  flex-shrink: 0;
}

.log-monitor-payload-wrapper {
  position: relative;
}

.log-monitor-payload-empty .log-monitor-copy-btn {
  top: 2px;
}

.log-monitor-copy-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  cursor: pointer;
  color: var(--lm-text-muted);
  opacity: 0.6;
  transition: opacity 0.2s;
  user-select: none;
  z-index: 1;
  line-height: 1;
}

.log-monitor-copy-btn svg {
  width: 16px;
  height: 16px;
}

.log-monitor-copy-btn:hover {
  opacity: 1;
}

.log-monitor-copy-btn-copied {
  opacity: 1;
}

.log-monitor-payload {
  margin: 4px 0 0;
  padding: 4px 24px 4px 8px;
  background: var(--lm-bg-secondary);
  border-radius: 3px;
  color: var(--lm-text-payload);
  font-size: 10px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
}

/* --- Footer --- */

.log-monitor-footer {
  padding: 8px;
  border-top: 1px solid var(--lm-border);
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.log-monitor-btn {
  flex: 1;
  padding: 4px 8px;
  background: var(--lm-btn-bg);
  border: 1px solid var(--lm-btn-border);
  border-radius: 3px;
  color: var(--lm-text);
  font-family: inherit;
  font-size: inherit;
  cursor: pointer;
  white-space: nowrap;
}

.log-monitor-btn:hover {
  background: var(--lm-btn-hover);
}

.log-monitor-btn:active {
  background: var(--lm-bg-active);
}

.log-monitor-btn svg {
  display: inline;
  vertical-align: -2px;
  margin-right: 2px;
}
`;
