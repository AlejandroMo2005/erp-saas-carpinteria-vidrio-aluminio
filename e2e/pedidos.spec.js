import { test, expect } from './fixtures/auth.js';

async function crearPedidoE2E(page, cliente) {
  await page
    .getByRole('navigation', { name: 'Navegación principal' })
    .getByRole('button', { name: 'Proformas' })
    .click();

  await expect(
    page.getByRole('heading', { name: 'Proformas' })
  ).toBeVisible();

  await page.getByRole('combobox', { name: 'Cliente' }).fill(cliente);
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
    page.getByText(`Pedido agendado correctamente para ${cliente}.`)
  ).toBeVisible({ timeout: 10000 });
}

async function abrirPedidos(page) {
  await page
    .getByRole('navigation', { name: 'Navegación principal' })
    .getByRole('button', { name: 'Pedidos' })
    .click();

  await expect(
    page.getByRole('heading', { name: 'Gestión de Pedidos' })
  ).toBeVisible();
}

test.describe('Pedidos E2E Tests', () => {
  test('should display a newly scheduled pending order', async ({
    authenticatedPage,
  }) => {
    const page = authenticatedPage;
    const cliente = `Cliente Pedidos E2E ${Date.now()}`;

    await crearPedidoE2E(page, cliente);
    await abrirPedidos(page);

    const pedido = page.getByRole('article', {
      name: new RegExp(`Pedido \\d+ — ${cliente}`),
    });

    await expect(pedido).toBeVisible();

    await expect(
      pedido.getByRole('button', {
        name: /Estado: PENDIENTE\. Toca para cambiar/,
      })
    ).toBeVisible();

    await expect(
      pedido.locator('.total-linea')
    ).toHaveText('TOTAL: $115.00');

    await expect(
      pedido.getByText('Ventana E2E', { exact: true })
    ).toBeVisible();
  });

  test('should change a pending order to delivered', async ({
    authenticatedPage,
  }) => {
    const page = authenticatedPage;
    const cliente = `Cliente Estado E2E ${Date.now()}`;

    await crearPedidoE2E(page, cliente);
    await abrirPedidos(page);

    const pedido = page.getByRole('article', {
      name: new RegExp(`Pedido \\d+ — ${cliente}`),
    });

    await expect(pedido).toBeVisible();

    const badgeEstado = pedido.getByRole('button', {
      name: /Estado: PENDIENTE\. Toca para cambiar/,
    });

    await expect(badgeEstado).toBeVisible();
    await badgeEstado.click();

    const opcionEntregado = page.getByRole('menuitem', {
      name: /Marcar como Entregado/,
    });

    await expect(opcionEntregado).toBeVisible();
    await opcionEntregado.click();

    await expect(
      page.getByText(/Pedido #\d+ entregado correctamente\./)
    ).toBeVisible({ timeout: 10000 });

    await expect(
      pedido.getByText('ENTREGADO', { exact: true })
    ).toBeVisible();

    await expect(
      pedido.getByRole('button', {
        name: /Estado: ENTREGADO/,
      })
    ).toHaveCount(0);
  });

  test('should filter orders by pending status', async ({
    authenticatedPage,
  }) => {
    const page = authenticatedPage;
    const cliente = `Cliente Filtro E2E ${Date.now()}`;

    await crearPedidoE2E(page, cliente);
    await abrirPedidos(page);

    const pedido = page.getByRole('article', {
      name: new RegExp(`Pedido \\d+ — ${cliente}`),
    });

    await expect(pedido).toBeVisible();

    const filtroPendientes = page.getByRole('button', {
      name: /^Pendientes/,
    });

    await expect(filtroPendientes).toBeVisible();
    await expect(filtroPendientes).toHaveAttribute('aria-pressed', 'false');

    await filtroPendientes.click();

    await expect(filtroPendientes).toHaveAttribute('aria-pressed', 'true');
    await expect(pedido).toBeVisible();

    await expect(
      pedido.getByRole('button', {
        name: /Estado: PENDIENTE\. Toca para cambiar/,
      })
    ).toBeVisible();
  });
});