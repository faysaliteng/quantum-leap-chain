import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('landing page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Crypto Payments');
    await expect(page.locator('nav')).toBeVisible();
  });

  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=Welcome back')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('signup page loads', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('text=Create your account')).toBeVisible();
    await expect(page.locator('#name')).toBeVisible();
    await expect(page.locator('#signup-email')).toBeVisible();
  });

  test('login has signup link', async ({ page }) => {
    await page.goto('/login');
    const signupLink = page.locator('a[href="/signup"]');
    await expect(signupLink).toBeVisible();
  });

  test('signup has login link', async ({ page }) => {
    await page.goto('/signup');
    const loginLink = page.locator('a[href="/login"]');
    await expect(loginLink).toBeVisible();
  });

  test('docs pages load', async ({ page }) => {
    for (const path of ['/docs/architecture', '/docs/security', '/docs/schema', '/docs/api']) {
      await page.goto(path);
      await expect(page.locator('main, article, [role="main"], .container')).toBeVisible();
    }
  });

  test('404 page works', async ({ page }) => {
    await page.goto('/nonexistent-route');
    await expect(page.locator('text=404')).toBeVisible();
  });

  test('landing page navigation links work', async ({ page }) => {
    await page.goto('/');
    const signInButton = page.locator('a[href="/login"]').first();
    await expect(signInButton).toBeVisible();
  });
});
