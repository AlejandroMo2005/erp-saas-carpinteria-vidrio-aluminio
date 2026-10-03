import { afterAll, describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const Material = require(
  `${process.cwd()}/src/modules/inventario/material/material.repository.js`
);

const db = require(`${process.cwd()}/src/config/database.js`);

describe('material.repository - integración MySQL', () => {
  it('debe consultar los materiales de la empresa real', async () => {
    const [empresas] = await db.query(
      `SELECT id
       FROM empresas
       WHERE ruc = ?
       LIMIT 1`,
      ['9999999999001']
    );

    expect(empresas).toHaveLength(1);

    const empresaId = empresas[0].id;
    const result = await Material.getAll(empresaId);

    expect(result.length).toBeGreaterThan(0);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(Number),
          empresa_id: empresaId,
          nombre: 'Material E2E',
        }),
      ])
    );
  });
});

afterAll(async () => {
  await db.end();
});
