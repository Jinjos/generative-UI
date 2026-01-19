import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MetricsService } from '../metrics-service';
import type { SummaryResponse } from '../../types/metrics';
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

  describe('getBreakdownComparison', () => {
    it('should compute deltas between periods', async () => {
      const breakdownSpy = vi.spyOn(MetricsService, 'getBreakdown');

      breakdownSpy
        .mockResolvedValueOnce([
          { name: 'Team A', interactions: 120, suggestions: 0, acceptances: 0, loc_suggested_to_add: 0, loc_suggested_to_delete: 0, loc_added: 0, loc_deleted: 0, active_users_count: 1, interactions_per_user: 120, loc_added_per_user: 0, agent_usage_rate: 0, chat_usage_rate: 0, acceptance_rate: 0 },
        ])
        .mockResolvedValueOnce([
          { name: 'Team A', interactions: 100, suggestions: 0, acceptances: 0, loc_suggested_to_add: 0, loc_suggested_to_delete: 0, loc_added: 0, loc_deleted: 0, active_users_count: 1, interactions_per_user: 100, loc_added_per_user: 0, agent_usage_rate: 0, chat_usage_rate: 0, acceptance_rate: 0 },
        ]);

      const comparison = await MetricsService.getBreakdownComparison('feature', 'interactions');

      expect(comparison[0].delta).toBe(20);
      expect(comparison[0].delta_pct).toBe(0.2);
    });
  });

  describe('getBreakdownStability', () => {
    it('should return stability metrics for a dimension', async () => {
      const mockStability = [
        { name: 'Team A', feature: 'Team A', metric: 'interactions', avg_value: 10, stddev_value: 2, coefficient_variation: 0.2, days: 5 },
      ];

      (UserMetric.aggregate as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue(mockStability);

      const stability = await MetricsService.getBreakdownStability('feature', 'interactions');

      expect(stability[0].name).toBe('Team A');
      expect(stability[0].coefficient_variation).toBe(0.2);
    });
  });

  describe('getUserChange', () => {
    it('should compute per-user deltas', async () => {
      const usersSpy = vi.spyOn(MetricsService, 'getUsersList');

      usersSpy
        .mockResolvedValueOnce([
          {
            user_login: 'alice',
            name: 'Alice',
            interactions: 20,
            suggestions: 0,
            acceptances: 0,
            loc_suggested_to_add: 0,
            loc_suggested_to_delete: 0,
            loc_added: 0,
            loc_deleted: 0,
            ide: 'vscode',
            uses_agent: false,
            uses_chat: true,
            totals_by_feature: [],
            totals_by_language_feature: [],
            totals_by_model_feature: [],
            totals_by_language_model: [],
            totals_by_ide: [],
            acceptance_rate: 0,
          },
        ])
        .mockResolvedValueOnce([
          {
            user_login: 'alice',
            name: 'Alice',
            interactions: 10,
            suggestions: 0,
            acceptances: 0,
            loc_suggested_to_add: 0,
            loc_suggested_to_delete: 0,
            loc_added: 0,
            loc_deleted: 0,
            ide: 'vscode',
            uses_agent: false,
            uses_chat: true,
            totals_by_feature: [],
            totals_by_language_feature: [],
            totals_by_model_feature: [],
            totals_by_language_model: [],
            totals_by_ide: [],
            acceptance_rate: 0,
          },
        ]);

      const changes = await MetricsService.getUserChange('interactions');

      expect(changes[0].delta).toBe(10);
      expect(changes[0].delta_pct).toBe(1);
    });
  });

  describe('getUsersFirstActive', () => {
    it('should return users with their first active date', async () => {
      const mockFirstActive = [{ user_login: 'bob', name: 'Bob', first_day: '2026-01-01' }];

      (UserMetric.aggregate as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue(mockFirstActive);

      const firstActive = await MetricsService.getUsersFirstActive();

      expect(firstActive[0].user_login).toBe('bob');
    });
  });

  describe('getUsersUsageRates', () => {
    it('should return usage rate summary', async () => {
      const mockUsage = [{
        total_users: 10,
        agent_user_rate: 0.4,
        chat_user_rate: 0.9,
        both_user_rate: 0.3,
      }];

      (UserMetric.aggregate as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue(mockUsage);

      const usageRates = await MetricsService.getUsersUsageRates();

      expect(usageRates.total_users).toBe(10);
      expect(usageRates.agent_user_rate).toBe(0.4);
    });
  });
});
