import { NextRequest, NextResponse } from "next/server";
import { MetricsService, type BreakdownDimension, type BreakdownMetricKey } from "@/lib/services/metrics-service";
import { parseFilters } from "../../summary/route";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const by = searchParams.get("by") as BreakdownDimension | null;
    const metricKey = (searchParams.get("metricKey") || "interactions") as BreakdownMetricKey;

    if (!by) {
      return NextResponse.json({ error: "Missing 'by' parameter" }, { status: 400 });
    }

    const filters = parseFilters(searchParams);
    const stability = await MetricsService.getBreakdownStability(by, metricKey, filters);
    return NextResponse.json(stability);
  } catch (error) {
    console.error("API Error (Breakdown Stability):", error);
    return NextResponse.json({ error: "Failed to fetch breakdown stability" }, { status: 500 });
  }
}
