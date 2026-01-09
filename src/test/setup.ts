import '@testing-library/jest-dom';
import { vi, beforeAll, afterEach, afterAll } from 'vitest';
import { server } from '../mocks/server';

// Establish API mocking before all tests.
beforeAll(() => server.listen());

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});

// Clean up after the tests are finished.
afterAll(() => server.close());

// Mock Mongoose (to prevent actual DB connections in unit tests)
// We only mock the connection part; models will need specific mocks in their test files
vi.mock('@/lib/db/connect', () => ({
  default: vi.fn(),
}));
