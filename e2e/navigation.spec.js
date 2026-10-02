// e2e/navigation.spec.js
import { test, expect } from './fixtures/auth.js';

test.describe('Navigation & Flow E2E Tests', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    await expect(
      authenticatedPage.getByRole('navigation', {
        name: 'Navegación principal',
      })
    ).toBeVisible();

    await expect(authenticatedPage.getByRole('main')).toBeVisible();
  });

  test('should display all navigation items for ADMIN', async ({
    authenticatedPage,
  }) => {
    const navigation = authenticatedPage.getByRole('navigation', {
      name: 'Navegación principal',
    });

    const expectedItems = [
      'Inicio, página actual',
      'Preview',
      'Pedidos',
      'Proformas',
      'Inventario',
      'Facturación',
      'Dashboard',
    ];

    for (const label of expectedItems) {
      await expect(
        navigation.getByRole('button', { name: label })
      ).toBeVisible();
    }

    await expect(navigation.getByRole('button')).toHaveCount(7);
  });

  test('should mark Inicio as the active page initially', async ({
    authenticatedPage,
  }) => {
    const navigation = authenticatedPage.getByRole('navigation', {
      name: 'Navegación principal',
    });

    await expect(
      navigation.getByRole('button', {
        name: 'Inicio, página actual',
      })
    ).toHaveAttribute('aria-current', 'page');
  });

  test('should navigate between main views', async ({
    authenticatedPage,
  }) => {
    const navigation = authenticatedPage.getByRole('navigation', {
      name: 'Navegación principal',
    });

    const views = [
      {
        button: 'Preview',
        active: 'Preview, página actual',
      },
      {
        button: 'Pedidos',
        active: 'Pedidos, página actual',
      },
      {
        button: 'Proformas',
        active: 'Proformas, página actual',
      },
      {
        button: 'Inventario',
        active: 'Inventario, página actual',
      },
      {
        button: 'Facturación',
        active: 'Facturación, página actual',
      },
      {
        button: 'Dashboard',
        active: 'Dashboard, página actual',
      },
    ];

    for (const view of views) {
      await navigation.getByRole('button', { name: view.button }).click();

      await expect(
        navigation.getByRole('button', { name: view.active })
      ).toHaveAttribute('aria-current', 'page');
    }
  });

  test('should return to Inicio from another view', async ({
    authenticatedPage,
  }) => {
    const navigation = authenticatedPage.getByRole('navigation', {
      name: 'Navegación principal',
    });

    await navigation.getByRole('button', { name: 'Pedidos' }).click();

    await expect(
      navigation.getByRole('button', {
        name: 'Pedidos, página actual',
      })
    ).toHaveAttribute('aria-current', 'page');

    await navigation.getByRole('button', { name: 'Inicio' }).click();

    await expect(
      navigation.getByRole('button', {
        name: 'Inicio, página actual',
      })
    ).toHaveAttribute('aria-current', 'page');
  });

  test('should keep navigation available after changing views', async ({
    authenticatedPage,
  }) => {
    const navigation = authenticatedPage.getByRole('navigation', {
      name: 'Navegación principal',
    });

    await navigation.getByRole('button', { name: 'Proformas' }).click();

    await expect(navigation).toBeVisible();
    await expect(authenticatedPage.getByRole('main')).toBeVisible();
    await expect(navigation.getByRole('button')).toHaveCount(7);
  });

  test('should remain usable on mobile', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.setViewportSize({
      width: 375,
      height: 667,
    });

    const navigation = authenticatedPage.getByRole('navigation', {
      name: 'Navegación principal',
    });

    await expect(navigation).toBeVisible();
    await expect(
      navigation.getByRole('button', {
        name: 'Inicio, página actual',
      })
    ).toBeVisible();

    await navigation.getByRole('button', { name: 'Pedidos' }).click();

    await expect(
      navigation.getByRole('button', {
        name: 'Pedidos, página actual',
      })
    ).toHaveAttribute('aria-current', 'page');
  });

  test('should keep navigation usable on desktop', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.setViewportSize({
      width: 1920,
      height: 1080,
    });

    const navigation = authenticatedPage.getByRole('navigation', {
      name: 'Navegación principal',
    });

    await expect(navigation).toBeVisible();
    await expect(navigation.getByRole('button')).toHaveCount(7);
  });
});