import { NextRequest, NextResponse } from "next/server";
import { MetricsService } from "@/lib/services/metrics-service";
import { parseFilters } from "../../summary/route";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filters = parseFilters(searchParams);

    const usageRates = await MetricsService.getUsersUsageRates(filters);
    return NextResponse.json(usageRates);
  } catch (error) {
    console.error("API Error (Users Usage Rate):", error);
    return NextResponse.json({ error: "Failed to fetch user usage rates" }, { status: 500 });
  }
}
