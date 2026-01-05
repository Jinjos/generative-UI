import { NextRequest, NextResponse } from "next/server";
import { MetricsService, CompareEntityConfig } from "@/lib/services/metrics-service";
import { parseFilters } from "../../summary/route";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filters = parseFilters(searchParams);
    
    const entityARaw = searchParams.get("entityA");
    const entityBRaw = searchParams.get("entityB");
    const metricKey = (searchParams.get("metricKey") || "total_interactions") as "total_interactions" | "total_loc_added" | "acceptance_rate";

    if (!entityARaw || !entityBRaw) {
      return NextResponse.json({ error: "Missing entity parameters" }, { status: 400 });
    }

    const entityA: CompareEntityConfig = JSON.parse(entityARaw);
    const entityB: CompareEntityConfig = JSON.parse(entityBRaw);
    
    const data = await MetricsService.getComparisonSummary(entityA, entityB, metricKey, filters);
    return NextResponse.json(data);
  } catch (error) {
    console.error("API Error (Compare Summary):", error);
    return NextResponse.json({ error: "Failed to fetch comparison summary" }, { status: 500 });
  }
}
