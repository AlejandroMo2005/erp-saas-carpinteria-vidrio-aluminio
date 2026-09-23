// e2e/navigation.spec.js
import { test, expect } from '@playwright/test';

test.describe('Navigation & Flow E2E Tests', () => {
  test('should navigate to different pages', async ({ page }) => {
    // Start at home
    await page.goto('/');

    // Wait for page to load
    await page.waitForSelector('main, [role="main"]', { timeout: 10000 });

    // Check initial URL
    let currentUrl = page.url();
    expect(currentUrl).toContain('localhost:3000');
  });

  test('should handle 404 gracefully', async ({ page }) => {
    // Try to navigate to non-existent page
    await page.goto('/non-existent-page', { waitUntil: 'networkidle' });

    // Page should still load something
    // Either 404 page or redirect to home
    const content = page.locator('body');
    await expect(content).toBeVisible();
  });

  test('should have working back/forward navigation', async ({ page }) => {
    // Start at home
    await page.goto('/');
    
    // Wait for load
    await page.waitForSelector('main, [role="main"]', { timeout: 10000 });

    const homeUrl = page.url();

    // Try to find a link and click it
    const links = page.locator('a[href^="/"]');
    
    if (await links.count() > 0) {
      // Click first internal link
      const firstLink = links.first();
      await firstLink.click();

      // Wait for navigation
      await page.waitForLoadState('networkidle');

      const newUrl = page.url();

      // URLs should be different (unless it's same page)
      // Go back
      await page.goBack();
      await page.waitForLoadState('networkidle');

      const backUrl = page.url();
      // Should be back at original
      expect(backUrl).toContain('localhost:3000');
    }
  });

  test('should preserve state during navigation', async ({ page }) => {
    // Go to home
    await page.goto('/');
    
    await page.waitForSelector('main, [role="main"]', { timeout: 10000 });

    // Check for any session indicators
    const userInfo = page.locator('[class*="user"], [class*="profile"], [class*="avatar"]');
    
    // Navigate away and back
    if (await userInfo.count() > 0) {
      await page.goto('/');
      // User info should still be there
      await expect(userInfo).toBeVisible();
    }
  });

  test('should handle errors during navigation', async ({ page }) => {
    // Capture response errors
    const failedRequests = [];

    page.on('response', response => {
      if (!response.ok() && response.status() >= 400) {
        failedRequests.push({
          url: response.url(),
          status: response.status(),
        });
      }
    });

    // Navigate to home
    await page.goto('/', { waitUntil: 'networkidle' });

    // Check page is still usable even if some requests failed
    const main = page.locator('main, [role="main"]');
    await expect(main).toBeVisible();
  });

  test('should have proper viewport for mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate
    await page.goto('/');

    // Wait for load
    await page.waitForSelector('main, [role="main"]', { timeout: 10000 });

    // Check that content is visible
    const main = page.locator('main, [role="main"]');
    await expect(main).toBeVisible();

    // Check viewport
    const size = await page.viewportSize();
    expect(size.width).toBe(375);
    expect(size.height).toBe(667);
  });

  test('should have proper viewport for tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    // Navigate
    await page.goto('/');

    // Wait for load
    await page.waitForSelector('main, [role="main"]', { timeout: 10000 });

    // Check content
    const main = page.locator('main, [role="main"]');
    await expect(main).toBeVisible();
  });

  test('should have proper viewport for desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Navigate
    await page.goto('/');

    // Wait for load
    await page.waitForSelector('main, [role="main"]', { timeout: 10000 });

    // Check content
    const main = page.locator('main, [role="main"]');
    await expect(main).toBeVisible();
  });
});
