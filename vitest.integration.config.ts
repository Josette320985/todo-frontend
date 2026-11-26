import { defineConfig } from 'vitest/config';

// Standalone HTTP and Vite proxy integration suite powered by Vitest.
export default defineConfig({
  test: { environment: 'node', include: ['integration/*.integration.ts'], fileParallelism: false, clearMocks: true },
});
