import { test as base, type Page } from '@playwright/test';
import { getCredentials, type Credentials } from './ssm-credentials';

type AuthFixtures = {
  credentials: (userIdentifier: string) => Promise<Credentials>;
  authenticatedPage: (userIdentifier: string) => Promise<Page>;
};

export const test = base.extend<AuthFixtures>({
  credentials: async ({}, use) => {
    await use((userIdentifier) => getCredentials(userIdentifier));
  },

  authenticatedPage: async ({ page }, use) => {
    await use(async (userIdentifier: string) => {
      const { username, password } = await getCredentials(userIdentifier);

      await page.goto('/');

      // Adjust selectors to match the application's login form
      await page.getByLabel(/username|email/i).fill(username);
      await page.getByLabel(/password/i).fill(password);
      await page.getByRole('button', { name: /sign in|log in|submit/i }).click();

      await page.waitForURL((url) => !url.pathname.includes('login'), {
        timeout: 10_000,
      }).catch(() => {
        throw new Error(
          `Login failed for user "${userIdentifier}". ` +
          `Still on login page after submit — check credentials and login selectors.`
        );
      });

      return page;
    });
  },
});

export { expect } from '@playwright/test';
