/**
 * ARCHITECTURE NOTE: THE SNAPSHOT PATTERN
 * 
 * The SnapshotService is the bridge between the Agent's decision and the User's view.
 * 
 * WHY USE SNAPSHOTS?
 * 1. Token Efficiency: We never send raw data arrays to the LLM. We only send 
 *    summaries. The heavy data is "parked" here in a snapshot.
 * 2. Data Integrity: When an Agent generates an insight based on data it saw 
 *    at T=0, we want the UI to render that exact same data, even if the database 
 *    changes at T+1.
 * 3. Performance: The client fetches the heavy payload directly via a standard 
 *    REST endpoint (/api/snapshots/[id]), bypassing the LLM stream entirely.
 * 
 * In this implementation, we use an in-memory Map with an LRU eviction policy 
 * and TTL. For production, this should be backed by Redis.
 */

import { DashboardTool } from "../genui/schemas";
import { redisClient } from "../db/redis"; // Import the Redis client

interface SnapshotEntry {
  id: string;
  createdAt: number; // Keep this for potential future debugging/info, even if Redis handles TTL
  data: Record<string, unknown> | unknown[];
  summary: Record<string, unknown>;
  config?: DashboardTool;
}

const SNAPSHOT_TTL_SECONDS = 10 * 60; // 10 Minutes (Redis uses seconds)

export class SnapshotService {
  /**
   * Stores a data snapshot in Redis and returns a unique ID.
   */
  static async saveSnapshot(
    data: Record<string, unknown> | unknown[], 
    summary: Record<string, unknown>, 
    config?: DashboardTool
  ): Promise<string> { // Changed return type to Promise<string> as Redis operations are async
    const id = crypto.randomUUID();
    
    const entry: SnapshotEntry = {
      id,
      createdAt: Date.now(),
      data,
      summary,
      config
    };

    // Store in Redis with expiration
    await redisClient.setex(id, SNAPSHOT_TTL_SECONDS, JSON.stringify(entry));

    console.log(`📸 [SnapshotService] Created snapshot ${id}`);
    console.log(`📊 [SnapshotService] Summary:`, JSON.stringify(summary));
    return id;
  }

  /**
   * Retrieves a snapshot by ID from Redis. Returns null if expired or missing.
   */
  static async getSnapshot(id: string): Promise<SnapshotEntry | null> { // Changed return type to Promise<SnapshotEntry | null>
    const entryJson = await redisClient.get(id);
    
    if (!entryJson) {
      console.warn(`⚠️ [SnapshotService] Miss: Snapshot ${id} not found or expired`);
      return null;
    }

    console.log(`✅ [SnapshotService] Hit: Snapshot ${id} retrieved`);
    return JSON.parse(entryJson) as SnapshotEntry;
  }

  /**
   * Returns data for the Client API, optionally paginated.
   */
  static async getSnapshotData(id: string, options?: { skip?: number; limit?: number; sortKey?: string; sortOrder?: 'asc' | 'desc'; key?: string }) { // Changed to async
    const entry = await this.getSnapshot(id); // Await the async call
    if (!entry) return null;

    let { data } = entry;

    // 0. Select Sub-Key (for composite dashboards)
    if (options?.key && data && typeof data === 'object' && !Array.isArray(data)) {
      const compositeData = data as Record<string, unknown>;
      if (compositeData[options.key]) {
        data = compositeData[options.key] as Record<string, unknown> | unknown[];
      }
    }

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
