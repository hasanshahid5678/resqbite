import { describe, expect, it } from "vitest";

import { discountPct, formatPrice, formatTime, statusColor, toLocalInputValue } from "@/lib/format";

describe("discountPct", () => {
  it("calculates discount correctly", () => {
    expect(discountPct(100, 50)).toBe(50);
    expect(discountPct(200, 80)).toBe(60);
    expect(discountPct(180, 80)).toBe(56);
  });
  it("returns 0 for zero or invalid original", () => {
    expect(discountPct(0, 0)).toBe(0);
    expect(discountPct(0, 10)).toBe(0);
  });
  it("handles string inputs", () => {
    expect(discountPct("100", "30")).toBe(70);
  });
});

describe("formatPrice", () => {
  it("returns — for null/undefined/empty", () => {
    expect(formatPrice(null)).toBe("—");
    expect(formatPrice(undefined)).toBe("—");
    expect(formatPrice("")).toBe("—");
  });
  it("formats numbers as USD", () => {
    expect(formatPrice(80)).toMatch(/\$/);
    expect(formatPrice(12.5)).toContain("12.50");
  });
  it("accepts strings", () => {
    expect(formatPrice("80")).toContain("80");
  });
});

describe("formatTime", () => {
  it("returns — for null/undefined", () => {
    expect(formatTime(null)).toBe("—");
    expect(formatTime(undefined)).toBe("—");
  });
  it("slices HH:MM", () => {
    expect(formatTime("11:30:00")).toBe("11:30");
    expect(formatTime("23:45:10")).toBe("23:45");
  });
});

describe("statusColor", () => {
  it("maps available → brand", () => {
    expect(statusColor("available")).toBe("badge-brand");
  });
  it("maps sold_out → yellow", () => {
    expect(statusColor("sold_out")).toBe("badge-yellow");
  });
  it("maps expired → red", () => {
    expect(statusColor("expired")).toBe("badge-red");
  });
  it("maps picked_up → brand", () => {
    expect(statusColor("picked_up")).toBe("badge-brand");
  });
  it("falls back to gray", () => {
    expect(statusColor("unknown_status")).toBe("badge-gray");
  });
});

describe("toLocalInputValue", () => {
  it("returns empty string for undefined", () => {
    expect(toLocalInputValue(undefined)).toBe("");
  });
  it("returns yyyy-MM-ddTHH:mm format", () => {
    const result = toLocalInputValue("2026-07-18T15:30:00Z");
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });
});