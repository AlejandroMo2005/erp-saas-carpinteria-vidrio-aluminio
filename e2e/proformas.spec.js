import { test, expect } from './fixtures/auth.js';

test.describe('Proformas E2E Tests', () => {
  test('should load proformas and catalog data', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    await page
      .getByRole('navigation', { name: 'Navegación principal' })
      .getByRole('button', { name: 'Proformas' })
      .click();

    await expect(
      page.getByRole('heading', { name: 'Proformas' })
    ).toBeVisible();

    await expect(
      page.getByRole('region', { name: 'Datos del cliente' })
    ).toBeVisible();

    await expect(
      page.getByLabel('Tipo de trabajo')
    ).toBeVisible();

    await expect(
      page.getByLabel('Color')
    ).toBeVisible();

    const trabajoOptions = await page
      .getByLabel('Tipo de trabajo')
      .locator('option')
      .allTextContents();

    const colorOptions = await page
      .getByLabel('Color')
      .locator('option')
      .allTextContents();

    expect(trabajoOptions.length).toBeGreaterThan(1);
    expect(colorOptions.length).toBeGreaterThan(1);
  });

  test('should calculate a proforma using the catalog recipe', async ({
    authenticatedPage,
  }) => {
    const page = authenticatedPage;

    await page
      .getByRole('navigation', { name: 'Navegación principal' })
      .getByRole('button', { name: 'Proformas' })
      .click();

    await expect(
      page.getByRole('heading', { name: 'Proformas' })
    ).toBeVisible();

    await page.getByRole('combobox', { name: 'Cliente' }).fill('Cliente E2E');
    await page.getByLabel('Teléfono').fill('0999999999');

    await page.getByLabel('Tipo de trabajo').selectOption({ label: 'Ventana E2E' });
    await page.getByLabel('Ancho').fill('2');
    await page.getByLabel('Alto').fill('1');
    await page.getByLabel('Cantidad').fill('1');
    await page.getByLabel('Color').selectOption({ label: 'Blanco E2E' });

    await page.getByRole('button', { name: 'Calcular' }).click();

    await expect(
      page.getByRole('button', { name: 'Recalcular' })
    ).toBeVisible();

    await expect(
      page.getByLabel('Total: $115.00')
    ).toBeVisible();

    await expect(
      page.getByText('Subtotal', { exact: true })
    ).toBeVisible();

    await expect(
      page.getByText('$100.00', { exact: true })
    ).toBeVisible();

    await expect(
      page.getByText('IVA 15%', { exact: true })
    ).toBeVisible();

    await expect(
      page.getByText('$15.00', { exact: true })
    ).toBeVisible();
  });
});
  test('should calculate and schedule a proforma as a pending order', async ({
    authenticatedPage,
  }) => {
    const page = authenticatedPage;

    await page
      .getByRole('navigation', { name: 'Navegación principal' })
      .getByRole('button', { name: 'Proformas' })
      .click();

    await expect(
      page.getByRole('heading', { name: 'Proformas' })
    ).toBeVisible();

    await page.getByRole('combobox', { name: 'Cliente' }).fill('Cliente E2E');
    await page.getByLabel('Teléfono').fill('0999999999');

    await page
      .getByLabel('Tipo de trabajo')
      .selectOption({ label: 'Ventana E2E' });

    await page.getByLabel('Ancho').fill('2');
    await page.getByLabel('Alto').fill('1');
    await page.getByLabel('Cantidad').fill('1');
    await page.getByLabel('Color').selectOption({ label: 'Blanco E2E' });

    await page.getByRole('button', { name: 'Calcular' }).click();

    await expect(
      page.getByLabel('Total: $115.00')
    ).toBeVisible();

    await page.getByRole('button', { name: 'Agendar Pedido' }).click();

    await expect(
      page.getByText('Pedido agendado correctamente para Cliente E2E.')
    ).toBeVisible({ timeout: 10000 });
  });
