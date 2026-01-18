import { NextRequest, NextResponse } from "next/server";
import { MetricsService, type BreakdownDimension, type BreakdownMetricKey } from "@/lib/services/metrics-service";
import { parseFilters } from "../../summary/route";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const allowed: BreakdownDimension[] = ["model", "ide", "feature", "language_model", "language_feature", "model_feature"];
    const rawBy = searchParams.get("by");
    const by = rawBy === "team" ? "feature" : rawBy;
    const metricKey = (searchParams.get("metricKey") || "interactions") as BreakdownMetricKey;

    const compareStart = searchParams.get("compareStart");
    const compareEnd = searchParams.get("compareEnd");

    if (!by || !allowed.includes(by as BreakdownDimension)) {
      return NextResponse.json({ error: "Missing or invalid 'by' parameter", allowed }, { status: 400 });
    }

    if (!compareStart || !compareEnd) {
      return NextResponse.json({ error: "Missing compareStart/compareEnd parameters" }, { status: 400 });
    }

    const currentFilters = parseFilters(searchParams);
    const compareFilters = {
      ...currentFilters,
      startDate: new Date(compareStart),
      endDate: new Date(compareEnd),
    };

    const comparison = await MetricsService.getBreakdownComparison(by as BreakdownDimension, metricKey, currentFilters, compareFilters);
    return NextResponse.json(comparison);
  } catch (error) {
    console.error("API Error (Breakdown Compare):", error);
    return NextResponse.json({ error: "Failed to fetch breakdown comparison" }, { status: 500 });
  }
}
