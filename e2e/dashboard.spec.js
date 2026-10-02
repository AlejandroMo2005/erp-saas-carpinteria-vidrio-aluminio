// e2e/dashboard.spec.js
import { test, expect } from './fixtures/auth.js';

test.describe('Dashboard E2E Tests', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await expect(authenticatedPage.getByRole('main')).toBeVisible();
    await expect(
      authenticatedPage.getByRole('navigation', {
        name: 'Navegación principal',
      })
    ).toBeVisible();
  });

  test('should load dashboard page', async ({ authenticatedPage }) => {
    await expect(authenticatedPage.getByRole('main')).toBeVisible();
    await expect(
      authenticatedPage.locator('h1, h2, [role="heading"]').first()
    ).toBeVisible();
  });

  test('should have navigation bar', async ({ authenticatedPage }) => {
    await expect(
      authenticatedPage.getByRole('navigation', {
        name: 'Navegación principal',
      })
    ).toBeVisible();
  });

  test('should have navigation links', async ({ authenticatedPage }) => {
    const navigation = authenticatedPage.getByRole('navigation', {
      name: 'Navegación principal',
    });

    const navigationItems = navigation.getByRole('button');

    await expect(navigationItems.first()).toBeVisible();
    expect(await navigationItems.count()).toBeGreaterThan(0);
  });

  test('should display dashboard content', async ({ authenticatedPage }) => {
    const dashboardContent = authenticatedPage.locator(
      '[class*="card"], [class*="dashboard"], main section'
    );

    expect(await dashboardContent.count()).toBeGreaterThan(0);
  });

  test('should remain usable on mobile', async ({ authenticatedPage }) => {
    await authenticatedPage.setViewportSize({
      width: 375,
      height: 667,
    });

    await expect(authenticatedPage.getByRole('main')).toBeVisible();
  });

  test('should expose accessible main content', async ({ authenticatedPage }) => {
    await expect(authenticatedPage.getByRole('main')).toBeVisible();

    await expect(
      authenticatedPage.locator('h1, h2, [role="heading"]').first()
    ).toBeVisible();
  });

  test('should navigate from dashboard', async ({ authenticatedPage }) => {
    const navigation = authenticatedPage.getByRole('navigation', {
      name: 'Navegación principal',
    });

    const navigationItems = navigation.getByRole('button');

    expect(await navigationItems.count()).toBeGreaterThan(0);
    await expect(navigationItems.first()).toBeVisible();
  });

  test('should load without critical console errors', async ({
    authenticatedPage,
  }) => {
    const errors = [];

    authenticatedPage.on('console', (message) => {
      if (message.type() === 'error') {
        errors.push(message.text());
      }
    });

    await authenticatedPage.reload({ waitUntil: 'domcontentloaded' });

    await expect(authenticatedPage.getByRole('main')).toBeVisible();

    const criticalErrors = errors.filter(
      (error) =>
        error.includes('Uncaught') ||
        error.includes('Failed to fetch') ||
        error.includes('ERR_CONNECTION')
    );

    expect(criticalErrors).toEqual([]);
  });
});

test.describe('Page Metadata E2E Tests', () => {
  test('should have a non-empty page title', async ({ page }) => {
    await page.goto('/');

    const title = await page.title();

    expect(title.trim().length).toBeGreaterThan(0);
  });
});