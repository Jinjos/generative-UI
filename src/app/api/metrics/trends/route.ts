import { NextRequest, NextResponse } from "next/server";
import { MetricsService } from "@/lib/services/metrics-service";
import { parseFilters } from "../summary/route";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filters = parseFilters(searchParams);
    
    const trends = await MetricsService.getDailyTrends(filters);
    return NextResponse.json(trends);
  } catch (error) {
    console.error("API Error (Trends):", error);
    return NextResponse.json({ error: "Failed to fetch trend metrics" }, { status: 500 });
  }
}
