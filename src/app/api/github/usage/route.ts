import { NextResponse } from "next/server";
import { UsageService } from "@/lib/services/usage-service";

export async function GET() {
  try {
    const data = await UsageService.getMetrics(30);
    return NextResponse.json(data);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to fetch usage metrics" }, { status: 500 });
  }
}
