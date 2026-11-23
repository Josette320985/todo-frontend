import { defineConfig } from 'vitest/config';

// Explicit opt-in: creates synthetic data on a dedicated local backend only.
export default defineConfig({
  test: { environment: 'node', include: ['integration/*.integration.ts'], fileParallelism: false },
});
