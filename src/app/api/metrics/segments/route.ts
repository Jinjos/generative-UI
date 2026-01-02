import { NextResponse } from "next/server";
import { MetricsService } from "@/lib/services/metrics-service";

export async function GET() {
  try {
    const segments = await MetricsService.getSegments();
    return NextResponse.json(segments);
  } catch (error) {
    console.error("API Error (Segments):", error);
    return NextResponse.json({ error: "Failed to discover segments" }, { status: 500 });
  }
}
