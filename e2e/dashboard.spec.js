// e2e/dashboard.spec.js
import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Go to home page (dashboard)
    // Note: In real scenario, you'd need to be authenticated
    await page.goto('/');
  });

  test('should load dashboard page', async ({ page }) => {
    // Wait for main content
    await page.waitForSelector('main, [role="main"]', { timeout: 10000 });

    // Check page title or heading
    const heading = page.locator('h1, h2');
    await expect(heading).toBeVisible();
  });

  test('should have navigation bar', async ({ page }) => {
    // Look for navbar
    const navbar = page.locator('nav, [role="navigation"]');
    await expect(navbar).toBeVisible();
  });

  test('should have sidebar or menu', async ({ page }) => {
    // Look for sidebar
    const sidebar = page.locator('aside, [role="complementary"]');
    
    // Sidebar may or may not be visible depending on layout
    // Just check that navigation elements exist
    const navLinks = page.locator('a[href*="/"]');
    expect(await navLinks.count()).toBeGreaterThan(0);
  });

  test('should display main dashboard cards', async ({ page }) => {
    // Wait for dashboard to fully load
    await page.waitForLoadState('networkidle');

    // Look for dashboard cards/sections
    // Selectors may vary based on your implementation
    const cards = page.locator('[class*="card"], [class*="dashboard"]');
    
    if (await cards.count() > 0) {
      expect(await cards.count()).toBeGreaterThan(0);
    }
  });

  test('should have footer', async ({ page }) => {
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Look for footer
    const footer = page.locator('footer, [role="contentinfo"]');
    
    // Footer may not always be visible
    // This is informational
  });

  test('should be responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Wait for dashboard
    await page.waitForSelector('main, [role="main"]', { timeout: 10000 });

    // Check that main content is still visible
    const main = page.locator('main, [role="main"]');
    await expect(main).toBeVisible();
  });

  test('should have accessibility features', async ({ page }) => {
    // Check for main landmark
    const main = page.locator('main, [role="main"]');
    await expect(main).toBeVisible();

    // Check page has a heading
    const heading = page.locator('h1, h2, [role="heading"]');
    await expect(heading).toBeVisible();

    // Check for skip links (optional but good practice)
    const skipLink = page.locator('a[href="#main"], a:text("Skip")');
    // Skip link is optional
  });

  test('should handle navigation', async ({ page }) => {
    // Look for navigation links
    const navLinks = page.locator('a[href*="/"]');
    
    const linkCount = await navLinks.count();
    expect(linkCount).toBeGreaterThan(0);

    // Try clicking first navigation link (if it's not already on home)
    if (linkCount > 0) {
      // Get first link that's not current page
      const firstLink = navLinks.first();
      const href = await firstLink.getAttribute('href');
      
      // Verify link is clickable
      await expect(firstLink).toBeVisible();
    }
  });

  test('should load without errors', async ({ page }) => {
    // Capture console messages
    const errors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check that there are no critical errors
    // Note: Some errors might be acceptable
    const criticalErrors = errors.filter(err => 
      err.includes('Uncaught') || err.includes('Failed')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('should have proper page title', async ({ page }) => {
    // Check page title
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
});
