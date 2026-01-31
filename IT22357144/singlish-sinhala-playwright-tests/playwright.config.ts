import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './src/tests',
  reporter: [['json', { outputFile: 'test-results.json' }]],
  use: {
    headless: true,
    actionTimeout: 0,
    navigationTimeout: 30000,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  timeout: 60000,
});