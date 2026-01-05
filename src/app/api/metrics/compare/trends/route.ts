import { NextRequest, NextResponse } from "next/server";
import { MetricsService, CompareEntityConfig } from "@/lib/services/metrics-service";
import { parseFilters } from "../../summary/route";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filters = parseFilters(searchParams);
    
    const queriesRaw = searchParams.get("queries");
    const metricKey = (searchParams.get("metricKey") || "interactions") as "interactions" | "loc_added" | "acceptance_rate" | "acceptances" | "suggestions";

    if (!queriesRaw) {
      return NextResponse.json({ error: "Missing queries parameter" }, { status: 400 });
    }

    const entities: CompareEntityConfig[] = JSON.parse(queriesRaw);
    
    const data = await MetricsService.getMultiSeriesTrends(entities, metricKey, filters);
    return NextResponse.json(data);
  } catch (error) {
    console.error("API Error (Compare Trends):", error);
    return NextResponse.json({ error: "Failed to fetch comparison trends" }, { status: 500 });
  }
}
