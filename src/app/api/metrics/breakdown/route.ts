import { NextRequest, NextResponse } from "next/server";
import { MetricsService } from "@/lib/services/metrics-service";
import { parseFilters } from "../summary/route";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filters = parseFilters(searchParams);
    const by = searchParams.get("by") as "model" | "ide" | null;

    if (!by || (by !== "model" && by !== "ide")) {
      return NextResponse.json({ error: "Missing or invalid 'by' parameter (must be 'model' or 'ide')" }, { status: 400 });
    }
    
    const breakdown = await MetricsService.getBreakdown(by, filters);
    return NextResponse.json(breakdown);
  } catch (error) {
    console.error("API Error (Breakdown):", error);
    return NextResponse.json({ error: "Failed to fetch breakdown metrics" }, { status: 500 });
  }
}
