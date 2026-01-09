import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SnapshotService } from '../snapshot-service';

describe('SnapshotService', () => {
  beforeEach(() => {
    // Clear the internal cache if possible (or just rely on the fact that it's a singleton for this run)
    // In a real app, we might add a clearCache method for testing
    vi.useFakeTimers();
  });

  it('should save and retrieve a snapshot', () => {
    const data = { items: [1, 2, 3] };
    const summary = { count: 3 };
    
    const id = SnapshotService.saveSnapshot(data, summary);
    const retrieved = SnapshotService.getSnapshot(id);

    expect(retrieved?.data).toEqual(data);
    expect(retrieved?.summary).toEqual(summary);
  });

  it('should return null for non-existent IDs', () => {
    expect(SnapshotService.getSnapshot('invalid-id')).toBeNull();
  });

  it('should expire snapshots after the TTL', () => {
    const id = SnapshotService.saveSnapshot({ test: true }, {});
    
    // Advance time by 11 minutes (TTL is 10)
    vi.advanceTimersByTime(11 * 60 * 1000);

    expect(SnapshotService.getSnapshot(id)).toBeNull();
  });

  it('should evict the oldest snapshot when the cache is full (LRU)', () => {
    // MAX_SNAPSHOTS is 50. Fill it up.
    const firstId = SnapshotService.saveSnapshot({ id: 1 }, {});
    
    for (let i = 2; i <= 51; i++) {
      SnapshotService.saveSnapshot({ id: i }, {});
    }

    // The 1st one should be gone
    expect(SnapshotService.getSnapshot(firstId)).toBeNull();
    
    // Let's just verify the cache size logic works via eviction
  });
});
