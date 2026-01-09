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

// Global cache persistence for HMR
const globalForCache = global as unknown as { snapshotCache: Map<string, SnapshotEntry> };
const cache = globalForCache.snapshotCache || new Map<string, SnapshotEntry>();
if (process.env.NODE_ENV !== "production") globalForCache.snapshotCache = cache;

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
   * Returns data for the Client API, optionally paginated.
   */
  static getSnapshotData(id: string, options?: { skip?: number; limit?: number; sortKey?: string; sortOrder?: 'asc' | 'desc' }) {
    const entry = this.getSnapshot(id);
    if (!entry) return null;

    let { data } = entry;

    // Handle Pagination and Sorting for Arrays
    if (Array.isArray(data)) {
      // 1. Sort (if requested)
      if (options?.sortKey) {
        const { sortKey, sortOrder = 'asc' } = options;
        // Clone array to avoid mutating the cached snapshot
        data = ([...data] as Record<string, unknown>[]).sort((a, b) => {
          const valA = a[sortKey];
          const valB = b[sortKey];

          if (valA === valB) return 0;
          
          // Handle nulls/undefined (always last)
          if (valA === undefined || valA === null) return 1;
          if (valB === undefined || valB === null) return -1;

          let comparison = 0;
          if (typeof valA === 'string' && typeof valB === 'string') {
            comparison = valA.localeCompare(valB);
          } else {
            comparison = (valA < valB) ? -1 : 1;
          }

          return sortOrder === 'asc' ? comparison : -comparison;
        });
      }

      // 2. Paginate (if requested)
      if (options && (options.skip !== undefined || options.limit !== undefined)) {
        const skip = options.skip || 0;
        const limit = options.limit || data.length;
        
        return {
          data: data.slice(skip, skip + limit),
          pagination: {
            total: data.length,
            skip,
            limit
          }
        };
      }
    }

    return data;
  }
}
