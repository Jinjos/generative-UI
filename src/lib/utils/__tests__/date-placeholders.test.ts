import { describe, it, expect } from "vitest";
import { resolveDatePlaceholders, startOfDayUTC } from "../date-placeholders";

describe("resolveDatePlaceholders", () => {
  it("replaces known tokens with deterministic UTC dates", () => {
    const baseDate = startOfDayUTC(new Date(Date.UTC(2026, 0, 17)));
    const result = resolveDatePlaceholders(
      "/api/metrics/trends?startDate={7_days_ago}&endDate={today}",
      baseDate
    );

    expect(result.endpoint).toBe(
      "/api/metrics/trends?startDate=2026-01-10&endDate=2026-01-17"
    );
    expect(result.resolvedTokens.sort()).toEqual(["7_days_ago", "today"]);
    expect(result.unresolvedTokens).toEqual([]);
  });

  it("tracks unresolved tokens without modifying them", () => {
    const baseDate = startOfDayUTC(new Date(Date.UTC(2026, 0, 17)));
    const result = resolveDatePlaceholders("/api/metrics/users?startDate={query_date}", baseDate);

    expect(result.endpoint).toBe("/api/metrics/users?startDate={query_date}");
    expect(result.resolvedTokens).toEqual([]);
    expect(result.unresolvedTokens).toEqual(["query_date"]);
  });
});
