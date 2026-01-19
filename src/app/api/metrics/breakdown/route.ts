import { NextRequest, NextResponse } from "next/server";
import { MetricsService } from "@/lib/services/metrics-service";
import type { BreakdownDimension } from "@/lib/types/metrics";
import { parseFilters } from "../summary/route";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filters = parseFilters(searchParams);
    const by = searchParams.get("by") as BreakdownDimension | null;
    const allowed: BreakdownDimension[] = ["model", "ide", "feature", "language_model", "language_feature", "model_feature"];

    if (!by || !allowed.includes(by)) {
      return NextResponse.json({ error: "Missing or invalid 'by' parameter" }, { status: 400 });
    }
    
    const breakdown = await MetricsService.getBreakdown(by, filters);
    return NextResponse.json(breakdown);
  } catch (error) {
    console.error("API Error (Breakdown):", error);
    return NextResponse.json({ error: "Failed to fetch breakdown metrics" }, { status: 500 });
  }
}
