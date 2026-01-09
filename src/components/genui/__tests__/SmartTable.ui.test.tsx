// @vitest-environment happy-dom
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { SmartTable } from '../SmartTable';
import { describe, it, expect } from 'vitest';

describe('SmartTable Pagination', () => {
  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'score', label: 'Score', format: 'number' as const }
  ];

  it('renders first page correctly', async () => {
    render(
      <SmartTable 
        title="User List" 
        apiEndpoint="http://localhost:3000/api/table-test" 
        columns={columns} 
      />
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('User 0')).toBeInTheDocument();
      expect(screen.getByText('User 24')).toBeInTheDocument();
      expect(screen.queryByText('User 25')).not.toBeInTheDocument();
    });

    expect(screen.getByText(/showing 1-25 of 50/i)).toBeInTheDocument();
    expect(screen.getByText(/page 1 of 2/i)).toBeInTheDocument();
  });

  it('navigates to the second page', async () => {
    render(
      <SmartTable 
        title="User List" 
        apiEndpoint="http://localhost:3000/api/table-test" 
        columns={columns} 
      />
    );

    await waitFor(() => expect(screen.getByText('User 0')).toBeInTheDocument());

    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    // Wait for second page data
    await waitFor(() => {
      expect(screen.getByText('User 25')).toBeInTheDocument();
      expect(screen.getByText('User 49')).toBeInTheDocument();
      expect(screen.queryByText('User 0')).not.toBeInTheDocument();
    });

    expect(screen.getByText(/showing 26-50 of 50/i)).toBeInTheDocument();
    expect(screen.getByText(/page 2 of 2/i)).toBeInTheDocument();
  });
});
