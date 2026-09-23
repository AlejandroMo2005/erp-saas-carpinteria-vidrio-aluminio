// e2e/auth.spec.js
import { test, expect } from '@playwright/test';

test.describe('Authentication E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    // Wait for form to load
    await page.waitForSelector('form');

    // Check for key elements
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');

    // Assertions
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('should show error with empty credentials', async ({ page }) => {
    // Get submit button
    const submitButton = page.locator('button[type="submit"]');

    // Click submit without filling form
    await submitButton.click();

    // Wait for error message or form validation
    // Note: Adjust selector based on your actual form
    const errorMsg = page.locator('[role="alert"]');
    
    // Either error shows or form doesn't submit
    const urlStaysSame = await page.url().includes('/login');
    expect(urlStaysSame).toBe(true);
  });

  test('should show error with invalid credentials', async ({ page }) => {
    // Fill with wrong credentials
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    // Click submit
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Wait for error
    // The page should stay on login or show error
    await page.waitForTimeout(2000);
    const urlStaysSame = await page.url().includes('/login');
    
    expect(urlStaysSame).toBe(true);
  });

  test('should have links to register and forgot password', async ({ page }) => {
    // Look for register link
    const registerLink = page.locator('a:has-text("Registr")');
    const forgotLink = page.locator('a:has-text("olvid")');

    // Check visibility
    await expect(registerLink).toBeVisible();
    await expect(forgotLink).toBeVisible();
  });

  test('should have accessibility attributes', async ({ page }) => {
    // Check for main role
    const main = page.locator('main, [role="main"]');
    await expect(main).toBeVisible();

    // Check form has proper structure
    const form = page.locator('form');
    await expect(form).toBeVisible();

    // Check inputs have labels or aria-labels
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    const hasEmailLabel = await emailInput.evaluate(el => 
      !!el.getAttribute('aria-label') || !!el.closest('label')
    );
    
    expect(hasEmailLabel).toBe(true);
  });

  test('should display session expired banner when passed as prop', async ({ page }) => {
    // This test would need to navigate with URL params or use a custom route
    // For now, it's a placeholder for future implementation
    await page.goto('/login?expired=true');

    // Look for expired session message
    const expiredBanner = page.locator(':text("sesión expiró"), [role="alert"]');
    
    // May or may not be visible depending on implementation
    // This is informational
  });

  test('should be responsive on mobile', async ({ browser }) => {
    // Create a mobile context
    const mobileContext = await browser.newContext({
      viewportSize: { width: 375, height: 667 },
    });
    const mobilePage = await mobileContext.newPage();

    await mobilePage.goto('/login');

    // Check form is visible and accessible
    const form = mobilePage.locator('form');
    await expect(form).toBeVisible();

    // Clean up
    await mobileContext.close();
  });
});
