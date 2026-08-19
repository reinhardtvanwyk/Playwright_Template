import { test, expect } from '@playwright/test';

// baseURL is configured globally in playwright.config.ts via the BASE_URL env var
test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/.+/);
});
