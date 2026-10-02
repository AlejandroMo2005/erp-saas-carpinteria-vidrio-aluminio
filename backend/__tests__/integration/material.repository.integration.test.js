import { afterAll, describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const Material = require(
  `${process.cwd()}/src/modules/inventario/material/material.repository.js`
);

const db = require(`${process.cwd()}/src/config/database.js`);

describe('material.repository - integración MySQL', () => {
  it('debe consultar los materiales de la empresa real', async () => {
    const result = await Material.getAll(2);

    expect(result.length).toBeGreaterThan(0);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 41,
          empresa_id: 2,
          nombre: 'Material E2E',
        }),
      ])
    );
  });
});

afterAll(async () => {
  await db.end();
});
