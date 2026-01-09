import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock Summary Endpoint
  http.get('http://localhost:3000/api/metrics/summary', () => {
    return HttpResponse.json({
      total_interactions: 1250,
      total_suggestions: 500,
      acceptance_rate: 0.45,
      active_users_count: 42
    });
  }),

  // Mock Trends Endpoint
  http.get('http://localhost:3000/api/metrics/trends', () => {
    return HttpResponse.json([
      { date: '2025-01-01', interactions: 10, suggestions: 20 },
      { date: '2025-01-02', interactions: 15, suggestions: 25 },
    ]);
  }),

  // Mock Snapshot Endpoint
  http.get('http://localhost:3000/api/snapshots/:id', () => {
    // Simulate a snapshot response
    return HttpResponse.json([
      { date: '2025-01-01', value: 100 },
      { date: '2025-01-02', value: 200 },
    ]);
  }),

  // Mock Paginated Table Endpoint
  http.get('http://localhost:3000/api/table-test', ({ request }) => {
    const url = new URL(request.url);
    const skip = parseInt(url.searchParams.get('skip') || '0', 10);
    const limit = parseInt(url.searchParams.get('limit') || '25', 10);
    const total = 50;

    const data = Array.from({ length: total }, (_, i) => ({
      id: i,
      name: `User ${i}`,
      score: Math.random() * 100
    }));

    return HttpResponse.json({
      data: data.slice(skip, skip + limit),
      pagination: { total, skip, limit }
    });
  }),
];
