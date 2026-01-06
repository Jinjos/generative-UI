import { DashboardTool } from "../genui/schemas";

// In-memory cache for the prototype
// In production, use Redis or a database
interface SnapshotEntry {
  id: string;
  createdAt: number;
  data: Record<string, unknown> | unknown[];      // The heavy data (e.g., chart series)
  summary: Record<string, unknown>;   // The high-level summary (for AI context)
  config?: DashboardTool; // Optional: The UI config associated with this snapshot
}

const SNAPSHOT_TTL_MS = 10 * 60 * 1000; // 10 Minutes
const MAX_SNAPSHOTS = 50; // Keep memory footprint low

const cache = new Map<string, SnapshotEntry>();

export class SnapshotService {
  /**
   * Stores a data snapshot and returns a unique ID.
   * Evicts old entries if cache is full.
   */
  static saveSnapshot(
    data: Record<string, unknown> | unknown[], 
    summary: Record<string, unknown>, 
    config?: DashboardTool
  ): string {
    const id = crypto.randomUUID();
    
    // Eviction Policy (Simple LRU-ish: Delete oldest if full)
    if (cache.size >= MAX_SNAPSHOTS) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey) {
        cache.delete(oldestKey);
        console.warn(`🗑️ [SnapshotService] Evicted snapshot ${oldestKey} (Cache Full)`);
      }
    }

    cache.set(id, {
      id,
      createdAt: Date.now(),
      data,
      summary,
      config
    });

    console.log(`📸 [SnapshotService] Created snapshot ${id}`);
    console.log(`📊 [SnapshotService] Summary:`, JSON.stringify(summary));
    return id;
  }

  /**
   * Retrieves a snapshot by ID. Returns null if expired or missing.
   */
  static getSnapshot(id: string): SnapshotEntry | null {
    const entry = cache.get(id);
    
    if (!entry) {
      console.warn(`⚠️ [SnapshotService] Miss: Snapshot ${id} not found`);
      return null;
    }

    // Check expiration
    if (Date.now() - entry.createdAt > SNAPSHOT_TTL_MS) {
      cache.delete(id);
      console.warn(`⏳ [SnapshotService] Expired: Snapshot ${id} deleted`);
      return null;
    }

    console.log(`✅ [SnapshotService] Hit: Snapshot ${id} retrieved`);
    return entry;
  }

  /**
   * Returns only the heavy data for the Client API.
   */
  static getSnapshotData(id: string) {
    const entry = this.getSnapshot(id);
    return entry ? entry.data : null;
  }
}
