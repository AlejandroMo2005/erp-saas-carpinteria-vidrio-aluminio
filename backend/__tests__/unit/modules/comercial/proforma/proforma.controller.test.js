import { describe, expect, it, beforeEach, afterAll } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const handlers = {
  getAllProformas: () => {},
  searchByCliente: () => {},
  getProformaById: () => {},
  calcularProforma: () => {},
  agendarPedido: () => {},
};

const originalLoad = Module._load;
const controllerPath = require.resolve(
  `${process.cwd()}/src/modules/comercial/proforma/proforma.controller.js`
);

const loadController = () => {
  delete require.cache[controllerPath];

  Module._load = function (request, parent, isMain) {
    if (request === './handlers/getProformas') {
      return {
        getAllProformas: handlers.getAllProformas,
        searchByCliente: handlers.searchByCliente,
        getProformaById: handlers.getProformaById,
      };
    }

    if (request === './handlers/calcularProforma') {
      return {
        calcularProforma: handlers.calcularProforma,
      };
    }

    if (request === './handlers/agendarPedido') {
      return {
        agendarPedido: handlers.agendarPedido,
      };
    }

    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    return require(controllerPath);
  } finally {
    Module._load = originalLoad;
  }
};

describe('proforma.controller', () => {
  beforeEach(() => {
    delete require.cache[controllerPath];
  });

  afterAll(() => {
    delete require.cache[controllerPath];
    Module._load = originalLoad;
  });

  it('debe exportar todos los handlers del módulo', () => {
    const controller = loadController();

    expect(controller).toEqual({
      getAllProformas: handlers.getAllProformas,
      searchByCliente: handlers.searchByCliente,
      getProformaById: handlers.getProformaById,
      calcularProforma: handlers.calcularProforma,
      agendarPedido: handlers.agendarPedido,
    });
  });

  it('debe exportar exactamente cinco funciones', () => {
    const controller = loadController();

    expect(Object.keys(controller)).toHaveLength(5);

    for (const handler of Object.values(controller)) {
      expect(handler).toBeTypeOf('function');
    }
  });
});
