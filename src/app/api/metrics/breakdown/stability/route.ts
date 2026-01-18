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

    if (!by || !allowed.includes(by as BreakdownDimension)) {
      return NextResponse.json({ error: "Missing or invalid 'by' parameter", allowed }, { status: 400 });
    }

    const filters = parseFilters(searchParams);
    const stability = await MetricsService.getBreakdownStability(by as BreakdownDimension, metricKey, filters);
    return NextResponse.json(stability);
  } catch (error) {
    console.error("API Error (Breakdown Stability):", error);
    return NextResponse.json({ error: "Failed to fetch breakdown stability" }, { status: 500 });
  }
}
