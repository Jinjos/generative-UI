import { NextRequest, NextResponse } from "next/server";
import { MetricsService, MetricsFilter } from "@/lib/services/metrics-service";

export function parseFilters(searchParams: URLSearchParams): MetricsFilter {
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const segment = searchParams.get("segment");
  const userLogin = searchParams.get("userLogin");
  const model = searchParams.get("model");
  const language = searchParams.get("language");

  const filters: MetricsFilter = {};
  if (startDate) filters.startDate = new Date(startDate);
  if (endDate) filters.endDate = new Date(endDate);
  if (segment) filters.segment = segment;
  if (userLogin) filters.userLogin = userLogin;
  if (model) filters.model = model;
  if (language) filters.language = language;

  return filters;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filters = parseFilters(searchParams);
    
    const summary = await MetricsService.getSummary(filters);
    return NextResponse.json(summary);
  } catch (error) {
    console.error("API Error (Summary):", error);
    return NextResponse.json({ error: "Failed to fetch summary metrics" }, { status: 500 });
  }
}
