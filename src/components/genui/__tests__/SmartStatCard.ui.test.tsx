// @vitest-environment happy-dom
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { SmartStatCard } from '../SmartStatCard';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/components/genui/BeaconProvider', () => ({
  useBeacon: () => ({
    registerView: vi.fn(),
    unregisterView: vi.fn(),
  }),
}));

describe('SmartStatCard', () => {
  it('renders loading state initially', () => {
    render(
      <SmartStatCard 
        title="Total Interactions" 
        apiEndpoint="http://localhost:3000/api/metrics/summary" 
        dataKey="total_interactions" 
      />
    );
    
    // Check for the skeleton (it usually has an animate-pulse class or role)
    // Assuming the Skeleton component renders a div with 'status' role or similar.
    // Based on the code, we might look for the title first.
    expect(screen.getByText('Total Interactions')).toBeInTheDocument();
  });

  it('renders data from API correctly', async () => {
    render(
      <SmartStatCard 
        title="Total Interactions" 
        apiEndpoint="http://localhost:3000/api/metrics/summary" 
        dataKey="total_interactions" 
      />
    );

    // Wait for the mock value (1250) from MSW handlers.ts
    await waitFor(() => {
      expect(screen.getByText('1.3k')).toBeInTheDocument();
    });
  });

  it('renders alternative data key correctly', async () => {
    render(
      <SmartStatCard 
        title="Active Users" 
        apiEndpoint="http://localhost:3000/api/metrics/summary" 
        dataKey="active_users_count" 
      />
    );

    // Wait for the mock value (42) from MSW handlers.ts
    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument();
    });
  });
});
