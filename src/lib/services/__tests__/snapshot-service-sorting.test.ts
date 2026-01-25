import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SnapshotService } from '../../services/snapshot-service';

vi.mock('crypto', () => ({
  randomUUID: vi.fn(() => 'test-uuid-sorting'),
}));

describe('SnapshotService Sorting', () => {
  const mockData = [
    { id: 1, name: 'Charlie', score: 50 },
    { id: 2, name: 'Alice', score: 100 },
    { id: 3, name: 'Bob', score: 75 },
  ];

  let snapshotId: string;

  beforeEach(async () => {
    snapshotId = await SnapshotService.saveSnapshot(mockData, {});
  });

  it('should sort ascending by string', async () => {
    const result = await SnapshotService.getSnapshotData(snapshotId, { sortKey: 'name', sortOrder: 'asc' }) as { name: string }[];
    expect(result[0].name).toBe('Alice');
    expect(result[1].name).toBe('Bob');
    expect(result[2].name).toBe('Charlie');
  });

  it('should sort descending by number', async () => {
    const result = await SnapshotService.getSnapshotData(snapshotId, { sortKey: 'score', sortOrder: 'desc' }) as { score: number }[];
    expect(result[0].score).toBe(100); // Alice
    expect(result[1].score).toBe(75);  // Bob
    expect(result[2].score).toBe(50);  // Charlie
  });

  it('should combine sorting and pagination', async () => {
    // Sort by name ASC (Alice, Bob, Charlie) -> Skip 1, Limit 1 -> Should be Bob
    const result = await SnapshotService.getSnapshotData(snapshotId, { 
      sortKey: 'name', 
      sortOrder: 'asc',
      skip: 1,
      limit: 1
    });
    
    // getSnapshotData returns { data, pagination } when paginated
    const paginatedResult = result as { data: { name: string; }[]; pagination: { total: number; } };

    expect(paginatedResult.data).toHaveLength(1);
    expect(paginatedResult.data[0].name).toBe('Bob');
    expect(paginatedResult.pagination.total).toBe(3);
  });
});
