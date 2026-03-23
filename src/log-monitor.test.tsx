import * as React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { LogMonitor } from "./log-monitor";
import { emitLogEvent, _resetListeners } from "./log-monitor-utils";

beforeAll(() => {
  global.URL.createObjectURL = jest.fn(() => "blob:mock-url");
  global.URL.revokeObjectURL = jest.fn();
});

afterEach(() => {
  _resetListeners();
});

describe("LogMonitor", () => {
  it("renders the filter input", () => {
    render(<LogMonitor />);
    expect(screen.getByPlaceholderText("Filter events...")).toBeInTheDocument();
  });

  it("shows empty state when no events have been emitted", () => {
    render(<LogMonitor />);
    expect(screen.getByText("Waiting for events\u2026")).toBeInTheDocument();
  });

  it("displays log entries when events are emitted", () => {
    render(<LogMonitor />);

    act(() => {
      emitLogEvent({ event: "page-view", data: { page: "/home" }, timestamp: 1000 });
    });

    expect(screen.getByText("page-view")).toBeInTheDocument();
  });

  it("displays newest entries first", () => {
    render(<LogMonitor />);

    act(() => {
      emitLogEvent({ event: "first", timestamp: 1000 });
      emitLogEvent({ event: "second", timestamp: 2000 });
    });

    const entries = screen.getAllByText(/first|second/);
    expect(entries[0]).toHaveTextContent("second");
    expect(entries[1]).toHaveTextContent("first");
  });

  it("filters entries by event name (case-insensitive)", () => {
    render(<LogMonitor />);

    act(() => {
      emitLogEvent({ event: "UserLogin", timestamp: 1000 });
      emitLogEvent({ event: "PageView", timestamp: 2000 });
    });

    const input = screen.getByPlaceholderText("Filter events...");
    fireEvent.change(input, { target: { value: "login" } });

    expect(screen.getByText("UserLogin")).toBeInTheDocument();
    expect(screen.queryByText("PageView")).not.toBeInTheDocument();
  });

  it("shows 'No matching events' when filter matches nothing", () => {
    render(<LogMonitor />);

    act(() => {
      emitLogEvent({ event: "something", timestamp: 1000 });
    });

    const input = screen.getByPlaceholderText("Filter events...");
    fireEvent.change(input, { target: { value: "zzz-no-match" } });

    expect(screen.getByText("No matching events")).toBeInTheDocument();
  });

  it("expands entry to show payload on click", () => {
    render(<LogMonitor />);

    act(() => {
      emitLogEvent({ event: "test", data: { key: "value" }, timestamp: 1000 });
    });

    expect(screen.queryByText(/"key": "value"/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("test"));
    expect(screen.getByText(/"key": "value"/)).toBeInTheDocument();
  });

  it("collapses entry on second click", () => {
    render(<LogMonitor />);

    act(() => {
      emitLogEvent({ event: "test", data: { x: 1 }, timestamp: 1000 });
    });

    const entry = screen.getByText("test");
    fireEvent.click(entry);
    expect(screen.getByText(/"x": 1/)).toBeInTheDocument();

    fireEvent.click(entry);
    expect(screen.queryByText(/"x": 1/)).not.toBeInTheDocument();
  });

  it("toggles aria-expanded on entry rows", () => {
    render(<LogMonitor />);

    act(() => {
      emitLogEvent({ event: "aria-test", data: { a: 1 }, timestamp: 1000 });
    });

    const entry = screen.getByRole("button", { name: /aria-test/ });
    expect(entry).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(entry);
    expect(entry).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(entry);
    expect(entry).toHaveAttribute("aria-expanded", "false");
  });

  it("expands entry via Enter key", () => {
    render(<LogMonitor />);

    act(() => {
      emitLogEvent({ event: "kb-test", data: { k: 1 }, timestamp: 1000 });
    });

    const entry = screen.getByRole("button", { name: /kb-test/ });
    fireEvent.keyDown(entry, { key: "Enter" });
    expect(screen.getByText(/"k": 1/)).toBeInTheDocument();

    fireEvent.keyDown(entry, { key: "Enter" });
    expect(screen.queryByText(/"k": 1/)).not.toBeInTheDocument();
  });

  it("expands entry via Space key", () => {
    render(<LogMonitor />);

    act(() => {
      emitLogEvent({ event: "space-test", data: { s: 2 }, timestamp: 1000 });
    });

    const entry = screen.getByRole("button", { name: /space-test/ });
    fireEvent.keyDown(entry, { key: " " });
    expect(screen.getByText(/"s": 2/)).toBeInTheDocument();
  });

  it("activates copy button via keyboard", async () => {
    const writeTextMock = jest.fn().mockResolvedValue(undefined);
    const originalClipboard = navigator.clipboard;
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    try {
      render(<LogMonitor />);

      act(() => {
        emitLogEvent({ event: "copy-kb", data: { v: 1 }, timestamp: 1000 });
      });

      fireEvent.click(screen.getByText("copy-kb"));

      const copyBtn = screen.getByRole("button", { name: /Copy event data/ });
      await act(async () => {
        fireEvent.keyDown(copyBtn, { key: "Enter" });
      });

      expect(writeTextMock).toHaveBeenCalled();
    } finally {
      Object.assign(navigator, { clipboard: originalClipboard });
    }
  });

  it("shows '(no extra data)' for entries without data", () => {
    render(<LogMonitor />);

    act(() => {
      emitLogEvent({ event: "bare", timestamp: 1000 });
    });

    fireEvent.click(screen.getByText("bare"));
    expect(screen.getByText("(no extra data)")).toBeInTheDocument();
  });

  it("clears all entries when Clear button is clicked", () => {
    render(<LogMonitor />);

    act(() => {
      emitLogEvent({ event: "evt1", timestamp: 1000 });
      emitLogEvent({ event: "evt2", timestamp: 2000 });
    });

    expect(screen.getByText("evt1")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Clear"));

    expect(screen.queryByText("evt1")).not.toBeInTheDocument();
    expect(screen.queryByText("evt2")).not.toBeInTheDocument();
    expect(screen.getByText("Waiting for events\u2026")).toBeInTheDocument();
  });

  it("applies the dark theme via data-theme attribute", () => {
    const { container } = render(<LogMonitor theme="dark" />);
    expect(container.querySelector('[data-theme="dark"]')).toBeInTheDocument();
  });

  it("defaults to light theme", () => {
    const { container } = render(<LogMonitor />);
    expect(container.querySelector('[data-theme="light"]')).toBeInTheDocument();
  });

  it("renders footer buttons (Clear, Copy, CSV, JSON)", () => {
    render(<LogMonitor />);
    expect(screen.getByText("Clear")).toBeInTheDocument();
    expect(screen.getByText("Copy")).toBeInTheDocument();
    expect(screen.getByText(/CSV/)).toBeInTheDocument();
    expect(screen.getByText(/JSON/)).toBeInTheDocument();
  });

  it("copies all entries as JSON when Copy button is clicked", async () => {
    const writeTextMock = jest.fn().mockResolvedValue(undefined);
    const originalClipboard = navigator.clipboard;
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    try {
      render(<LogMonitor />);

      act(() => {
        emitLogEvent({ event: "first", data: { a: 1 }, timestamp: 1000 });
        emitLogEvent({ event: "second", data: { b: 2 }, timestamp: 2000 });
      });

      await act(async () => {
        fireEvent.click(screen.getByText("Copy"));
      });

      expect(writeTextMock).toHaveBeenCalled();
      const copied = JSON.parse(writeTextMock.mock.calls[0][0]);
      expect(copied).toHaveLength(2);
      expect(copied[0].event).toBe("first");
      expect(copied[1].event).toBe("second");
    } finally {
      Object.assign(navigator, { clipboard: originalClipboard });
    }
  });

  it("triggers CSV download with correct content", () => {
    const blobParts: string[] = [];
    const OrigBlob = global.Blob;
    global.Blob = class MockBlob extends OrigBlob {
      constructor(parts?: BlobPart[], options?: BlobPropertyBag) {
        super(parts, options);
        if (parts) blobParts.push(...parts.map(String));
      }
    } as typeof Blob;

    render(<LogMonitor logFilePrefix="test-prefix" />);

    act(() => {
      emitLogEvent({ event: "csv-event", data: { x: 1 }, timestamp: 9000 });
    });

    const clickMock = jest.fn();
    const origCreateElement = document.createElement.bind(document);
    jest.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") {
        const el = { click: clickMock, href: "", download: "" } as unknown as HTMLElement;
        return el;
      }
      return origCreateElement(tag);
    });

    fireEvent.click(screen.getByText(/CSV/));

    expect(clickMock).toHaveBeenCalled();
    const csv = blobParts.join("");
    expect(csv).toContain("id,timestamp,event,data");
    expect(csv).toMatch(/\d+,9000,"csv-event"/);
    expect(csv).toContain("{\"\"x\"\":1}");

    (document.createElement as jest.Mock).mockRestore();
    global.Blob = OrigBlob;
  });

  it("triggers JSON download with correct content", () => {
    const blobParts: string[] = [];
    const OrigBlob = global.Blob;
    global.Blob = class MockBlob extends OrigBlob {
      constructor(parts?: BlobPart[], options?: BlobPropertyBag) {
        super(parts, options);
        if (parts) blobParts.push(...parts.map(String));
      }
    } as typeof Blob;

    render(<LogMonitor logFilePrefix="test-prefix" />);

    act(() => {
      emitLogEvent({ event: "json-event", data: { y: 2 }, timestamp: 9000 });
    });

    const clickMock = jest.fn();
    const origCreateElement = document.createElement.bind(document);
    jest.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") {
        const el = { click: clickMock, href: "", download: "" } as unknown as HTMLElement;
        return el;
      }
      return origCreateElement(tag);
    });

    fireEvent.click(screen.getByText(/JSON/));

    expect(clickMock).toHaveBeenCalled();
    const json = JSON.parse(blobParts.join(""));
    expect(json[0].event).toBe("json-event");
    expect(json[0].data).toEqual({ y: 2 });

    (document.createElement as jest.Mock).mockRestore();
    global.Blob = OrigBlob;
  });
});
