import { NextRequest, NextResponse } from "next/server";
import { SnapshotService } from "@/lib/services/snapshot-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const skip = searchParams.get("skip") ? parseInt(searchParams.get("skip")!, 10) : undefined;
  const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;
  const sortKey = searchParams.get("sortKey") || undefined;
  const sortOrder = (searchParams.get("sortOrder") as 'asc' | 'desc') || undefined;

  console.log(`🔌 [API] Fetching snapshot data for ID: ${id} (skip=${skip}, limit=${limit}, sort=${sortKey}:${sortOrder})`);

  if (!id) {
    console.error(`❌ [API] Missing Snapshot ID in params`);
    return NextResponse.json({ error: "Missing Snapshot ID" }, { status: 400 });
  }

  const data = SnapshotService.getSnapshotData(id, { skip, limit, sortKey, sortOrder });

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
