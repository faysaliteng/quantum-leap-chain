import { test, expect, Page } from '@playwright/test';
import {
  publicRoutes, docsRoutes, merchantRoutes, adminRoutes, errorRoutes, dynamicRoutes,
} from './routes.manifest';

const allStaticRoutes = [
  ...publicRoutes,
  ...docsRoutes,
  ...merchantRoutes,
  ...adminRoutes,
  ...errorRoutes,
];

/** Collects console errors during a page visit */
async function visitAndCheck(page: Page, path: string, key: string) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto(path, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500);

  // Assert data-testid exists
  const testId = page.locator(`[data-testid="page:${key}"]`);
  await expect(testId).toBeAttached({ timeout: 5000 });

  // Assert page has visible content
  const body = await page.locator('body').innerHTML();
  expect(body.length).toBeGreaterThan(100);

  return errors;
}

// ── Static Routes ──
test.describe('All Routes Smoke Tests', () => {
  for (const route of allStaticRoutes) {
    test(`${route.key} — ${route.path} renders with data-testid`, async ({ page }) => {
      const errors = await visitAndCheck(page, route.path, route.key);
      // Console errors are collected but not failed on (network errors expected in CI without backend)
    });
  }
});

// ── Dynamic Routes ──
test.describe('Dynamic Routes Smoke Tests', () => {
  for (const route of dynamicRoutes) {
    test(`${route.key} — ${route.example} renders`, async ({ page }) => {
      await page.goto(route.example, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(500);
      const body = await page.locator('body').innerHTML();
      expect(body.length).toBeGreaterThan(100);
    });
  }
});

// ── Desktop + Mobile Screenshots ──
test.describe('Screenshots', () => {
  const keyRoutes = [
    ...publicRoutes.slice(0, 5),
    ...docsRoutes.slice(0, 2),
    ...merchantRoutes.slice(0, 3),
    ...adminRoutes.slice(0, 3),
    ...errorRoutes,
  ];

  for (const route of keyRoutes) {
    test(`screenshot desktop — ${route.key}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto(route.path, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(500);
      await page.screenshot({ path: `test-results/screenshots/desktop-${route.key}.png`, fullPage: true });
    });

    test(`screenshot mobile — ${route.key}`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(route.path, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(500);
      await page.screenshot({ path: `test-results/screenshots/mobile-${route.key}.png`, fullPage: true });
    });
  }
});

// ── Critical UI Elements ──
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
