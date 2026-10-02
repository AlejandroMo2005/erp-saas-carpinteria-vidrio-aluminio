// e2e/fixtures/auth.js
import { test as base, expect } from '@playwright/test';

const E2E_EMAIL = 'e2e.admin@example.com';
const E2E_PASSWORD = 'E2E_Test_2026!';

export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/login');

    await page.getByLabel('Correo electrónico').fill(E2E_EMAIL);
    await page.getByLabel('Contraseña').fill(E2E_PASSWORD);
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

    await page.waitForURL(/localhost:3000\/?$/, {
      timeout: 10000,
    });

    await expect(page.getByRole('main')).toBeVisible({
      timeout: 15000,
    });

    await expect(
      page.getByRole('navigation', {
        name: 'Navegación principal',
      })
    ).toBeVisible({ timeout: 15000 });

    await use(page);
  },
});

export { expect };