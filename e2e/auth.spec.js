// e2e/auth.spec.js
import { test, expect } from '@playwright/test';

test.describe('Authentication E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.getByLabel('Correo electrónico')).toBeVisible();
    await expect(page.getByLabel('Contraseña')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Iniciar Sesión' })).toBeVisible();
  });

  test('should prevent submission with empty credentials', async ({ page }) => {
    const emailInput = page.getByLabel('Correo electrónico');
    const passwordInput = page.getByLabel('Contraseña');
    const submitButton = page.getByRole('button', { name: 'Iniciar Sesión' });

    await submitButton.click();

    await expect(emailInput).toHaveAttribute('aria-invalid', 'false');
    await expect(passwordInput).toHaveAttribute('aria-invalid', 'false');
    await expect(submitButton).toBeEnabled();

    expect(await emailInput.evaluate((input) => input.validity.valid)).toBe(false);
    expect(await passwordInput.evaluate((input) => input.validity.valid)).toBe(false);
    expect(page.url()).toMatch(/localhost:3000\/?$/);
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.getByLabel('Correo electrónico').fill('wrong@example.com');
    await page.getByLabel('Contraseña').fill('WrongPassword123!');

    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    const error = page.getByRole('alert');

    await expect(error).toBeVisible();
    await expect(error).toHaveText('Credenciales inválidas');
    await expect(page.getByLabel('Correo electrónico')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByLabel('Contraseña')).toHaveAttribute('aria-invalid', 'true');
    await expect(page).toHaveURL(/localhost:3000\/?$/);
  });

  test('should have links to register and forgot password', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Crear cuenta' })).toBeVisible();
    await expect(page.getByRole('link', { name: '¿Olvidaste tu contraseña?' })).toBeVisible();
  });

  test('should have accessible form controls', async ({ page }) => {
    const main = page.getByRole('main');
    const form = page.locator('form');

    await expect(main).toBeVisible();
    await expect(form).toBeVisible();

    const emailInput = page.getByLabel('Correo electrónico');
    const passwordInput = page.getByLabel('Contraseña');

    await expect(emailInput).toHaveAttribute('aria-required', 'true');
    await expect(passwordInput).toHaveAttribute('aria-required', 'true');
    await expect(emailInput).toHaveAttribute('autocomplete', 'email');
    await expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.getByRole('link', { name: 'Crear cuenta' }).click();

    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByRole('heading')).toBeVisible();
  });

  test('should navigate to forgot password page', async ({ page }) => {
    await page.getByRole('link', { name: '¿Olvidaste tu contraseña?' }).click();

    await expect(page).toHaveURL(/\/forgot-password$/);
    await expect(page.getByRole('heading')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ browser }) => {
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
    });

    const mobilePage = await mobileContext.newPage();

    await mobilePage.goto('/login');

    await expect(mobilePage.getByRole('main')).toBeVisible();
    await expect(mobilePage.getByLabel('Correo electrónico')).toBeVisible();
    await expect(mobilePage.getByLabel('Contraseña')).toBeVisible();
    await expect(
      mobilePage.getByRole('button', { name: 'Iniciar Sesión' })
    ).toBeVisible();

    await mobileContext.close();
  });
});