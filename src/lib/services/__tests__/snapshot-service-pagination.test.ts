import { describe, it, expect, beforeEach } from 'vitest';
import { SnapshotService } from '../snapshot-service';

describe('SnapshotService Pagination', () => {
  beforeEach(() => {
    // No explicit clear needed if we use fresh IDs
  });

  it('should return sliced data and pagination metadata when skip/limit are provided', () => {
    const fullData = Array.from({ length: 100 }, (_, i) => ({ id: i }));
    const id = SnapshotService.saveSnapshot(fullData, {});

    const result = SnapshotService.getSnapshotData(id, { skip: 10, limit: 5 }) as { data: Record<string, unknown>[]; pagination: Record<string, unknown> };

    expect(result).toBeDefined();
    expect(result.data).toHaveLength(5);
    expect(result.data[0].id).toBe(10); // Should start at index 10
    expect(result.data[4].id).toBe(14); // 10, 11, 12, 13, 14
    expect(result.pagination).toEqual({
      total: 100,
      skip: 10,
      limit: 5
    });
  });

  it('should return raw data when no pagination options are provided', () => {
    const fullData = [1, 2, 3];
    const id = SnapshotService.saveSnapshot(fullData, {});

    const result = SnapshotService.getSnapshotData(id);

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(3);
    expect((result as { pagination?: unknown }).pagination).toBeUndefined();
  });
});
