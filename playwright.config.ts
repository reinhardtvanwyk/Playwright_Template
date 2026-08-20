import { defineConfig, devices } from '@playwright/test';

// Base URL for the application under test — override via BASE_URL env var
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
// AWS_REGION  — SSM region (default: us-east-1)
// TEST_ENV    — SSM path segment: /playwright/{TEST_ENV}/{user}/username|password (default: dev)
// TEST_USERNAME / TEST_PASSWORD — bypass SSM for local development

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
