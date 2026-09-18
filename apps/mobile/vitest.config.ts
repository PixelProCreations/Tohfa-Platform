import { defineConfig } from 'vitest/config';

// No jsdom/DOM environment here on purpose — see this app's CLAUDE.md
// "Testing" section: everything in this package is written to run in plain
// Node (pure logic, no React rendering to a DOM).
export default defineConfig({
  test: {
    setupFiles: ['./src/tests/setup.ts'],
  },
});
