import { describe, it, expect } from 'vitest';
import { injectSnapshotIntoConfig } from '../utils';
import { DashboardTool } from '../schemas';

describe('injectSnapshotIntoConfig', () => {
  const SNAPSHOT_ID = 'test-snapshot-123';
  const EXPECTED_URL = `/api/snapshots/${SNAPSHOT_ID}`;
  const EXPECTED_DASHBOARD_URL = `${EXPECTED_URL}?key=slotMain`;
  const EXPECTED_LEFT_URL = `${EXPECTED_URL}?key=leftChart`;
  const EXPECTED_RIGHT_URL = `${EXPECTED_URL}?key=rightChart`;

  it('should update the main slot endpoint for dashboard layout', () => {
    const config: DashboardTool = {
      layout: 'dashboard',
      headerStats: [],
      slotMain: {
        component: 'SmartChart',
        title: 'Test',
        apiEndpoint: '/api/original/endpoint'
      }
    };

    const result = injectSnapshotIntoConfig(config, SNAPSHOT_ID);

    if (result.layout === 'dashboard') {
        expect(result.slotMain.apiEndpoint).toBe(EXPECTED_DASHBOARD_URL);
    } else {
        throw new Error('Layout type changed unexpectedly');
    }
    // Ensure deep clone
    expect(result).not.toBe(config);
  });

  it('should update the config endpoint for single layout', () => {
    const config: DashboardTool = {
      layout: 'single',
      config: {
        component: 'SmartChart',
        title: 'Test',
        apiEndpoint: '/api/original/endpoint'
      }
    };

    const result = injectSnapshotIntoConfig(config, SNAPSHOT_ID);

    // TypeScript might need help here because of the discriminated union
    if (result.layout === 'single') {
        expect(result.config.apiEndpoint).toBe(EXPECTED_URL);
    } else {
        throw new Error('Layout type changed unexpectedly');
    }
  });

  it('should update both charts for split layout', () => {
    const config: DashboardTool = {
      layout: 'split',
      leftChart: {
        component: 'SmartChart',
        title: 'Left',
        apiEndpoint: '/api/left'
      },
      rightChart: {
        component: 'SmartChart',
        title: 'Right',
        apiEndpoint: '/api/right'
      }
    };

    const result = injectSnapshotIntoConfig(config, SNAPSHOT_ID);

    if (result.layout === 'split') {
        expect(result.leftChart.apiEndpoint).toBe(EXPECTED_LEFT_URL);
        expect(result.rightChart.apiEndpoint).toBe(EXPECTED_RIGHT_URL);
    } else {
        throw new Error('Layout type changed unexpectedly');
    }
  });
});
