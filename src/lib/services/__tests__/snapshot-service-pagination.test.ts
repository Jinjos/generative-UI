import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SnapshotService } from '../../services/snapshot-service';

vi.mock('crypto', () => ({
  randomUUID: vi.fn(() => 'test-uuid-123'),
}));

describe('SnapshotService Pagination and Sorting', () => {
  let snapshotId: string;
  const mockData = Array.from({ length: 100 }, (_, i) => ({ id: i, name: `Item ${i}`, value: i * 10 }));

  beforeEach(async () => {
    snapshotId = await SnapshotService.saveSnapshot(mockData, {});
  });

  it('should return paginated data with metadata', async () => {
    const result = await SnapshotService.getSnapshotData(snapshotId, { skip: 10, limit: 5 }); // Remove direct type cast here
    
    // Assert against the actual structure
    expect(result).toHaveProperty('data');
    expect(result).toHaveProperty('pagination');
    
    const paginatedResult = result as { data: Record<string, unknown>[]; pagination: Record<string, unknown> };

    expect(paginatedResult.data).toHaveLength(5);
    expect(paginatedResult.data[0].id).toBe(10);
    expect(paginatedResult.pagination).toEqual({ total: 100, skip: 10, limit: 5 });
  });

  it('should return all data if no pagination options provided', async () => {
    const result = await SnapshotService.getSnapshotData(snapshotId) as Record<string, unknown>[];
    expect(result).toHaveLength(100);
  });
});
