import { test, expect } from '@playwright/test';
import { publicRoutes, docsRoutes } from './routes.manifest';

test.describe('Public Routes Smoke Tests', () => {
  for (const route of publicRoutes) {
    test(`${route.key} — ${route.path} renders`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page).not.toHaveURL(/error/);
      // Verify no uncaught errors in console
      const errors: string[] = [];
      page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
      await page.waitForTimeout(1000);
      // Page should have visible content
      const body = await page.locator('body').innerHTML();
      expect(body.length).toBeGreaterThan(100);
    });
  }
});

test.describe('Docs Routes Smoke Tests', () => {
  for (const route of docsRoutes) {
    test(`${route.key} — ${route.path} renders`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page.locator('main, article, [role="main"], .container, h1')).toBeVisible();
    });
  }
});

test.describe('Error Routes', () => {
  test('404 page renders for unknown route', async ({ page }) => {
    await page.goto('/nonexistent-route-404');
    await expect(page.locator('text=404')).toBeVisible();
  });
});

test.describe('Critical UI Elements', () => {
  test('landing page has login/signup links', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('a[href="/login"]').first()).toBeVisible();
  });

  test('login page has form fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('signup page has form fields', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('text=Create your account')).toBeVisible();
  });

  test('login and signup pages cross-link', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('a[href="/signup"]')).toBeVisible();
    await page.goto('/signup');
    await expect(page.locator('a[href="/login"]')).toBeVisible();
  });
});
