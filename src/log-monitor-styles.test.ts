import { injectStyles } from "./log-monitor-styles";

describe("injectStyles", () => {
  beforeEach(() => {
    const existing = document.getElementById("log-monitor-styles");
    if (existing) existing.remove();
  });

  it("injects a <style> element into document.head", () => {
    injectStyles();

    const style = document.getElementById("log-monitor-styles");
    expect(style).not.toBeNull();
    expect(style!.tagName).toBe("STYLE");
    expect(document.head.contains(style)).toBe(true);
  });

  it("includes theme CSS custom properties", () => {
    injectStyles();

    const style = document.getElementById("log-monitor-styles") as HTMLStyleElement;
    expect(style.textContent).toContain("data-theme=\"dark\"");
    expect(style.textContent).toContain("data-theme=\"light\"");
    expect(style.textContent).toContain("--lm-bg:");
  });

  it("does not inject a second style element on repeated calls", () => {
    injectStyles();
    injectStyles();

    const styles = document.querySelectorAll("#log-monitor-styles");
    expect(styles).toHaveLength(1);
  });
});
