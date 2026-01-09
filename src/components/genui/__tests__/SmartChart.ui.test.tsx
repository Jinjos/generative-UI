// @vitest-environment happy-dom
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { SmartChart } from '../SmartChart';
import { describe, it, expect, vi, beforeAll } from 'vitest';

// Mock ResizeObserver which is required by Recharts ResponsiveContainer
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

// Mock Recharts to avoid complex SVG rendering issues in JSDOM/HappyDOM
// We just want to know if it received the data
vi.mock('recharts', async () => {
  const OriginalModule = await vi.importActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container" style={{ width: 800, height: 400 }}>
        {children}
      </div>
    ),
    // We can spy on the AreaChart to see if it got data
    AreaChart: ({ data }: { data: Record<string, unknown>[] }) => (
      <div data-testid="chart-canvas" data-record-count={data?.length}>
        {/* Intentionally empty to avoid SVG rendering issues */}
      </div>
    ),
  };
});

describe('SmartChart', () => {
  it('renders loading state initially', () => {
    const { container } = render(
      <SmartChart 
        title="Usage Trends" 
        apiEndpoint="http://localhost:3000/api/metrics/trends" 
      />
    );
    // It seems the title is not rendered in loading state, but a spinner is.
    // Let's check for the spinner class or structure.
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders chart with data after fetch', async () => {
    render(
      <SmartChart 
        title="Usage Trends" 
        apiEndpoint="http://localhost:3000/api/metrics/trends" 
        xAxisKey="date"
        series={[{ key: 'interactions', label: 'Interactions', color: '#ff0000' }]}
      />
    );

    // Wait for the chart canvas to appear with data
    await waitFor(() => {
      const chart = screen.getByTestId('chart-canvas');
      expect(chart).toBeInTheDocument();
      // Expect 2 records from our MSW handler
      expect(chart).toHaveAttribute('data-record-count', '2');
    });
    
    // Title should appear now
    expect(screen.getByText('Usage Trends')).toBeInTheDocument();
  });

  it('handles empty data by rendering empty chart (current behavior)', async () => {
    // Override the handler for this specific test
    const { server } = await import('../../../mocks/server');
    const { http, HttpResponse } = await import('msw');
    
    server.use(
      http.get('http://localhost:3000/api/empty', () => {
        return HttpResponse.json([]);
      })
    );

    render(
      <SmartChart 
        title="Empty Chart" 
        apiEndpoint="http://localhost:3000/api/empty" 
      />
    );

    await waitFor(() => {
       const chart = screen.getByTestId('chart-canvas');
       expect(chart).toHaveAttribute('data-record-count', '0');
    });
  });
});
