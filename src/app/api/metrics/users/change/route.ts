import { NextRequest, NextResponse } from "next/server";
import { MetricsService, type BreakdownMetricKey } from "@/lib/services/metrics-service";
import { parseFilters } from "../../summary/route";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const metricKey = (searchParams.get("metricKey") || "interactions") as BreakdownMetricKey;

    const compareStart = searchParams.get("compareStart");
    const compareEnd = searchParams.get("compareEnd");

    if (!compareStart || !compareEnd) {
      return NextResponse.json({ error: "Missing compareStart/compareEnd parameters" }, { status: 400 });
    }

    const currentFilters = parseFilters(searchParams);
    const compareFilters = {
      ...currentFilters,
      startDate: new Date(compareStart),
      endDate: new Date(compareEnd),
    };

    const results = await MetricsService.getUserChange(metricKey, currentFilters, compareFilters);
    return NextResponse.json(results);
  } catch (error) {
    console.error("API Error (Users Change):", error);
    return NextResponse.json({ error: "Failed to fetch users change" }, { status: 500 });
  }
}
