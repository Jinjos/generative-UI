import { NextResponse } from "next/server";
import { MetricsService } from "@/lib/services/metrics-service";

export async function GET() {
  try {
    const dailyMetrics = await MetricsService.getDailyTrends();
    const summary = await MetricsService.getSummary();

    return NextResponse.json({
      summary,
      daily_metrics: dailyMetrics,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to fetch usage metrics" }, { status: 500 });
  }
}
