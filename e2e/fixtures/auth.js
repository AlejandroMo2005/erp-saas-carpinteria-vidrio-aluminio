// e2e/fixtures/auth.js
import { test as base } from '@playwright/test';

/**
 * Fixture para tests autenticados
 * Proporciona una página con usuario ya logged in
 */
export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    // Ir a login
    await page.goto('/login');

    // Esperar que la página cargue
    await page.waitForSelector('form', { timeout: 5000 });

    // Llenar credenciales (cambiar si es necesario)
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');

    // Click login
    await page.click('button[type="submit"]');

    // Esperar a que redirija al dashboard
    await page.waitForURL('/', { timeout: 5000 });

    // Usar la página autenticada
    await use(page);

    // Logout (cleanup)
    try {
      await page.goto('/');
      // Buscar botón de logout en navbar
      const logoutBtn = page.locator('button:has-text("Logout")');
      if (await logoutBtn.isVisible({ timeout: 2000 })) {
        await logoutBtn.click();
      }
    } catch (e) {
      // Si falla logout, no importa
    }
  },
});

export { expect } from '@playwright/test';
