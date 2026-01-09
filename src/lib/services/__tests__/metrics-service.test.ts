import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MetricsService, type SummaryResponse } from '../metrics-service';
import { UserMetric } from '../../db/models';

// Mock the UserMetric model
vi.mock('../../db/models', () => ({
  UserMetric: {
    aggregate: vi.fn(),
    distinct: vi.fn(),
  },
}));

describe('MetricsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSummary', () => {
    it('should correctly aggregate metric totals and calculate acceptance rate', async () => {
      const mockResult = [{
        total_interactions: 100,
        total_suggestions: 50,
        total_acceptances: 25,
        total_loc_added: 500,
        total_loc_deleted: 100,
        unique_users: ['user1', 'user2'],
        active_days: 10,
        uses_agent: true,
        uses_chat: true,
        active_users_count: 2,
        acceptance_rate: 0.5
      }];

      (UserMetric.aggregate as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue(mockResult);

      const summary = await MetricsService.getSummary();

      expect(summary.total_interactions).toBe(100);
      expect(summary.acceptance_rate).toBe(0.5);
      expect(summary.active_users_count).toBe(2);
      expect(UserMetric.aggregate).toHaveBeenCalled();
    });

    it('should return defaults when no data is found', async () => {
      (UserMetric.aggregate as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue([]);

      const summary = await MetricsService.getSummary();

      expect(summary.total_interactions).toBe(0);
      expect(summary.acceptance_rate).toBe(0);
    });
  });

  describe('getComparisonSummary', () => {
    it('should calculate the gap between two entities correctly', async () => {
      // Mock getSummary internal calls
      const getSummarySpy = vi.spyOn(MetricsService, 'getSummary');
      
      getSummarySpy
        .mockResolvedValueOnce({ total_interactions: 100 } as unknown as SummaryResponse) // Entity A
        .mockResolvedValueOnce({ total_interactions: 150 } as unknown as SummaryResponse); // Entity B

      const comparison = await MetricsService.getComparisonSummary(
        { label: 'Team A', segment: 'Backend' },
        { label: 'Team B', segment: 'Frontend' },
        'total_interactions'
      );

      expect(comparison.gap).toBe(50); // (150-100)/100 * 100
      expect(comparison.entityB.isHigher).toBe(true);
      expect(comparison.entityA.isHigher).toBe(false);
    });

    it('should handle zero values gracefully in gap calculation', async () => {
      const getSummarySpy = vi.spyOn(MetricsService, 'getSummary');
      
      getSummarySpy
        .mockResolvedValueOnce({ total_interactions: 0 } as unknown as SummaryResponse)
        .mockResolvedValueOnce({ total_interactions: 50 } as unknown as SummaryResponse);

      const comparison = await MetricsService.getComparisonSummary(
        { label: 'Team A' },
        { label: 'Team B' },
        'total_interactions'
      );

      expect(comparison.gap).toBe(100);
      expect(comparison.entityB.isHigher).toBe(true);
    });
  });

  describe('getDailyTrends', () => {
    it('should return trend data sorted by date', async () => {
      const mockTrends = [
        { date: '2025-01-01', interactions: 10 },
        { date: '2025-01-02', interactions: 20 },
      ];

      (UserMetric.aggregate as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue(mockTrends);

      const trends = await MetricsService.getDailyTrends();

      expect(trends).toHaveLength(2);
      expect(trends[0].date).toBe('2025-01-01');
      expect(trends[1].interactions).toBe(20);
    });
  });

  describe('getBreakdown', () => {
    it('should aggregate data by dimension (ide)', async () => {
      const mockBreakdown = [
        { name: 'VS Code', interactions: 100, acceptance_rate: 0.4 },
        { name: 'IntelliJ', interactions: 50, acceptance_rate: 0.3 },
      ];

      (UserMetric.aggregate as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue(mockBreakdown);

      const breakdown = await MetricsService.getBreakdown('ide');

      expect(breakdown[0].name).toBe('VS Code');
      expect(breakdown[1].interactions).toBe(50);
    });
  });

  describe('getMultiSeriesTrends', () => {
    it('should merge data from multiple entities into a single time-series', async () => {
      // We need to mock the internal aggregations. 
      // Since getMultiSeriesTrends calls aggregate multiple times (once per entity),
      // we mock the return values in sequence.
      
      const teamAData = [{ _id: '2025-01-01', value: 10 }];
      const teamBData = [{ _id: '2025-01-01', value: 20 }, { _id: '2025-01-02', value: 25 }];

      (UserMetric.aggregate as unknown as { mockResolvedValueOnce: (v: unknown) => { mockResolvedValueOnce: (v: unknown) => void } })
        .mockResolvedValueOnce(teamAData) // First call for Team A
        .mockResolvedValueOnce(teamBData); // Second call for Team B

      const merged = await MetricsService.getMultiSeriesTrends(
        [{ label: 'Team A' }, { label: 'Team B' }],
        'interactions'
      );

      // Expect 2 days total
      expect(merged).toHaveLength(2);

      // Day 1: Both teams have data
      expect(merged[0]).toEqual({
        date: '2025-01-01',
        'Team A': 10,
        'Team B': 20
      });

      // Day 2: Only Team B has data
      expect(merged[1]).toEqual({
        date: '2025-01-02',
        'Team B': 25
      });
    });
  });
});
