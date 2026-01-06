import { NextRequest, NextResponse } from "next/server";
import { SnapshotService } from "@/lib/services/snapshot-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  console.log(`🔌 [API] Fetching snapshot data for ID: ${id}`);

  if (!id) {
    console.error(`❌ [API] Missing Snapshot ID in params`);
    return NextResponse.json({ error: "Missing Snapshot ID" }, { status: 400 });
  }

  const data = SnapshotService.getSnapshotData(id);

  if (!data) {
    console.warn(`⚠️ [API] Snapshot ${id} not found or expired during hydration`);
    return NextResponse.json(
      { error: "Snapshot not found or expired" },
      { status: 404 }
    );
  }

  console.log(`📦 [API] Successfully served payload for ${id}`);
  return NextResponse.json(data);
}
