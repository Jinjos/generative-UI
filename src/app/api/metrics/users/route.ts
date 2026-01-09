import { NextRequest, NextResponse } from "next/server";
import { MetricsService } from "@/lib/services/metrics-service";
import { parseFilters } from "../summary/route";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filters = parseFilters(searchParams);
    
    const users = await MetricsService.getUsersList(filters);
    return NextResponse.json(users);
  } catch (error) {
    console.error("API Error (Users):", error);
    return NextResponse.json({ error: "Failed to fetch users metrics" }, { status: 500 });
  }
}
