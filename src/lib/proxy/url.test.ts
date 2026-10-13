import { describe, expect, it } from "vitest";
import { normalizeUserInput, toProxyPath } from "./url";

describe("Study search URL input", () => {
  it("opens a typed URL through the embedded proxy", () => {
    const url = normalizeUserInput("https://example.com/math?project=1");
    expect(url).toBe("https://example.com/math?project=1");
    if (!url) throw new Error("Expected a valid URL");
    expect(toProxyPath(url)).toBe("/api/public/p/https/example.com/math?project=1");
  });
  it("accepts a website address without its scheme", () => {
    expect(normalizeUserInput("example.com")).toBe("https://example.com/");
  });
});