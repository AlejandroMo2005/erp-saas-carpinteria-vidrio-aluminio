import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const mocks = {
  generarInpainting: vi.fn(),
  hashImagen: vi.fn(),
  generarVisualizacion: vi.fn(),
  generarMascaraSAM: vi.fn(),
  construirPrompt: vi.fn(),
  construirPromptLibre: vi.fn(),
  traducirAIngles: vi.fn(),
  dbQuery: vi.fn(),
  readFile: vi.fn(),
};

const iaServiceMock = {
  generarInpainting: mocks.generarInpainting,
  hashImagen: mocks.hashImagen,
  generarVisualizacion: mocks.generarVisualizacion,
  generarMascaraSAM: mocks.generarMascaraSAM,
  construirPrompt: mocks.construirPrompt,
  construirPromptLibre: mocks.construirPromptLibre,
  traducirAIngles: mocks.traducirAIngles,
};

const dbMock = {
  query: mocks.dbQuery,
};

const iaServicePath = require.resolve(
  '../../src/shared/services/iaService.js'
);

const databasePath = require.resolve(
  '../../src/config/database.js'
);

require.cache[iaServicePath] = {
  id: iaServicePath,
  filename: iaServicePath,
  loaded: true,
  exports: iaServiceMock,
};

require.cache[databasePath] = {
  id: databasePath,
  filename: databasePath,
  loaded: true,
  exports: dbMock,
};

const fsPath = require.resolve('fs');

const fsMock = {
  promises: {
    readFile: mocks.readFile,
  },
};

require.cache[fsPath] = {
  id: fsPath,
  filename: fsPath,
  loaded: true,
  exports: fsMock,
};

const {
  inpaint,
  getTrabajoConColores,
  visualizarEspacio,
  mascaraAuto,
} = await import('../../src/modules/ia/generacion/ia.controller.js');

const iaService = mocks;
const db = { query: mocks.dbQuery };
const fs = { promises: { readFile: mocks.readFile } };
beforeEach(() => {
  vi.clearAllMocks();

  mocks.hashImagen.mockReturnValue('hash-test');

  mocks.generarInpainting.mockResolvedValue({
    imagenBase64: 'data:image/png;base64,resultado',
    modelo: 'mock-hf',
    duracionMs: 100,
  });

  mocks.generarVisualizacion.mockResolvedValue(
    Buffer.from('imagen-generada')
  );

  mocks.generarMascaraSAM.mockResolvedValue(
    Buffer.from('mascara-generada')
  );

  mocks.construirPrompt.mockReturnValue('prompt-catalogo');

  mocks.construirPromptLibre.mockImplementation(
    ({ promptLibre, color }) =>
      `prompt-libre:${promptLibre}:${color?.nombre ?? 'sin-color'}`
  );

  mocks.traducirAIngles.mockImplementation(
    async (texto) => `translated:${texto}`
  );

  mocks.dbQuery.mockReset();
  mocks.readFile.mockReset();

  delete process.env.ANTHROPIC_API_KEY;
});

function crearRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

function crearReq(body = {}, extras = {}) {
  return {
    body,
    user: extras.user,
    params: extras.params,
    files: extras.files,
    empresaId: extras.empresaId ?? 1,
  };
}

function archivos() {
  return {
    imagen: [{
      buffer: Buffer.from('imagen'),
      mimetype: 'image/jpeg',
    }],
    mascara: [{
      buffer: Buffer.from('mascara'),
      mimetype: 'image/png',
    }],
  };
}

function dataUrl(text = 'AAAA') {
  return `data:image/png;base64,${text}`;
}

describe('ia.controller - inpaint', () => {
  it('rechaza cuando req.body no está definido', async () => {
    const res = crearRes();

    await inpaint(
      {
        body: undefined,
        user: { id: 7 },
      },
      res
    );

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Se requieren los campos: imagen, mascara y prompt.',
    });
  });

  it('rechaza cuando faltan imagen, mascara o prompt', async () => {
    const res = crearRes();

    await inpaint(crearReq({ imagen: dataUrl(), mascara: dataUrl() }), res);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Se requieren los campos: imagen, mascara y prompt.',
    });
  });

  it('rechaza imagen cuando el valor no es string', async () => {
    const res = crearRes();

    await inpaint(
      crearReq({
        imagen: 123,
        mascara: dataUrl(),
        prompt: 'puerta',
      }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'El campo "imagen" debe ser un dataURL válido.',
    });
  });

  it('rechaza imagen con dataURL inválido', async () => {
    const res = crearRes();

    await inpaint(
      crearReq({
        imagen: 'imagen-invalida',
        mascara: dataUrl(),
        prompt: 'puerta',
      }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'El campo "imagen" debe ser un dataURL válido.',
    });
  });

  it('rechaza mascara con dataURL inválido', async () => {
    const res = crearRes();

    await inpaint(
      crearReq({
        imagen: dataUrl(),
        mascara: 'mascara-invalida',
        prompt: 'puerta',
      }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'El campo "mascara" debe ser un dataURL válido.',
    });
  });

  it('rechaza imágenes que superan 10 MB', async () => {
    const res = crearRes();
    const imagenGrande = `data:image/png;base64,${'A'.repeat(10 * 1024 * 1024)}`;

    await inpaint(
      crearReq({
        imagen: imagenGrande,
        mascara: dataUrl(),
        prompt: 'puerta',
      }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(413);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Las imágenes superan el tamaño máximo (10 MB).',
    });
  });

  it('rechaza prompt vacío después de limpiar', async () => {
    const res = crearRes();

    await inpaint(
      crearReq({
        imagen: dataUrl(),
        mascara: dataUrl(),
        prompt: '   ',
      }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'El prompt no puede estar vacío.',
    });
  });

  it('genera inpainting correctamente', async () => {
    const res = crearRes();

    iaService.generarInpainting.mockResolvedValue({
      imagenBase64: 'resultado-base64',
      modelo: 'modelo-test',
      duracionMs: 123,
    });

    db.query.mockResolvedValue([[]]);

    await inpaint(
      crearReq(
        {
          imagen: dataUrl(),
          mascara: dataUrl(),
          prompt: '  puerta de aluminio  ',
          prompt_negativo: ' baja calidad ',
          trabajo: 'puerta',
        },
        { user: { id: 7 } }
      ),
      res
    );

    expect(iaService.hashImagen).toHaveBeenCalled();
    expect(iaService.generarInpainting).toHaveBeenCalledWith({
      imagenBase64: dataUrl(),
      mascaraBase64: dataUrl(),
      prompt: 'puerta de aluminio',
      promptNegativo: 'baja calidad',
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      imagen: 'resultado-base64',
      modelo: 'modelo-test',
      duracion_ms: 123,
    });

    expect(db.query).toHaveBeenCalled();
  });

  it('registra valores nulos cuando el resultado de IA no trae modelo ni duración', async () => {
    const res = crearRes();

    iaService.generarInpainting.mockResolvedValue({
      imagenBase64: 'resultado-base64',
      modelo: undefined,
      duracionMs: undefined,
    });

    iaService.hashImagen.mockReturnValue(null);

    db.query.mockResolvedValueOnce([{}]);

    await inpaint(
      crearReq({
        imagen: dataUrl(),
        mascara: dataUrl(),
        prompt: 'puerta moderna',
      }),
      res
    );

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO ia_requests'),
      [
        null,
        null,
        'puerta moderna',
        null,
        null,
        null,
        'OK',
      ]
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });



  it('usa valores fallback al registrar una solicitud IA con metadatos ausentes', async () => {
    const res = crearRes();

    iaService.generarInpainting.mockResolvedValue({
      imagen: Buffer.from('resultado'),
    });

    iaService.hashImagen.mockReturnValue(null);

    db.query.mockResolvedValueOnce([{}]);

    await inpaint(
      crearReq({
        imagen: dataUrl(),
        mascara: dataUrl(),
        prompt: 'puerta moderna',
      }),
      res
    );

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO ia_requests'),
      [
        null,
        null,
        'puerta moderna',
        null,
        null,
        null,
        'OK',
      ]
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('continúa correctamente aunque falle el log de ia_requests', async () => {
    const res = crearRes();

    db.query.mockRejectedValueOnce(new Error('DB log error'));

    await inpaint(
      crearReq({
        imagen: dataUrl(),
        mascara: dataUrl(),
        prompt: 'puerta',
      }, { user: { id: 7 } }),
      res
    );

    await new Promise(resolve => setImmediate(resolve));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      imagen: 'data:image/png;base64,resultado',
      modelo: 'mock-hf',
      duracion_ms: 100,
    });
  });

  it('usa valores nulos cuando no existe usuario ni trabajo', async () => {
    const res = crearRes();

    iaService.generarInpainting.mockResolvedValue({
      imagenBase64: 'resultado',
      modelo: 'modelo',
      duracionMs: 50,
    });

    db.query.mockResolvedValue([[]]);

    await inpaint(
      crearReq({
        imagen: dataUrl(),
        mascara: dataUrl(),
        prompt: 'puerta',
      }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('maneja error por clave de IA no configurada', async () => {
    const res = crearRes();

    iaService.generarInpainting.mockRejectedValue(
      new Error('HF_API_TOKEN missing')
    );

    db.query.mockResolvedValue([[]]);

    await inpaint(
      crearReq({
        imagen: dataUrl(),
        mascara: dataUrl(),
        prompt: 'puerta',
      }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Clave de IA no configurada.',
    });
  });

  it('maneja timeout de la IA', async () => {
    const res = crearRes();

    iaService.generarInpainting.mockRejectedValue(
      new Error('request timeout')
    );

    db.query.mockResolvedValue([[]]);

    await inpaint(
      crearReq({
        imagen: dataUrl(),
        mascara: dataUrl(),
        prompt: 'puerta',
      }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(504);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'La IA tardó demasiado.',
    });
  });

  it('maneja modelo ocupado por mensaje ocupado', async () => {
    const res = crearRes();

    iaService.generarInpainting.mockRejectedValue(
      new Error('modelo ocupado')
    );

    db.query.mockResolvedValue([[]]);

    await inpaint(
      crearReq({
        imagen: dataUrl(),
        mascara: dataUrl(),
        prompt: 'puerta',
      }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Modelo ocupado.',
    });
  });

  it('maneja modelo ocupado por código 503', async () => {
    const res = crearRes();

    iaService.generarInpainting.mockRejectedValue(
      new Error('HTTP 503')
    );

    db.query.mockResolvedValue([[]]);

    await inpaint(
      crearReq({
        imagen: dataUrl(),
        mascara: dataUrl(),
        prompt: 'puerta',
      }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(503);
  });

  it('maneja error genérico de IA', async () => {
    const res = crearRes();

    iaService.generarInpainting.mockRejectedValue(
      new Error('fallo desconocido')
    );

    db.query.mockResolvedValue([[]]);

    await inpaint(
      crearReq({
        imagen: dataUrl(),
        mascara: dataUrl(),
        prompt: 'puerta',
      }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'fallo desconocido',
    });
  });

  it('maneja error sin mensaje', async () => {
    const res = crearRes();

    iaService.generarInpainting.mockRejectedValue({});

    db.query.mockResolvedValue([[]]);

    await inpaint(
      crearReq({
        imagen: dataUrl(),
        mascara: dataUrl(),
        prompt: 'puerta',
      }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Error al procesar con IA.',
    });
  });

  it('limita prompt y prompt negativo a 500 caracteres', async () => {
    const res = crearRes();

    iaService.generarInpainting.mockResolvedValue({
      imagenBase64: 'resultado',
      modelo: 'modelo',
      duracionMs: 1,
    });

    db.query.mockResolvedValue([[]]);

    const prompt = ` ${'A'.repeat(600)} `;
    const negativo = ` ${'B'.repeat(600)} `;

    await inpaint(
      crearReq({
        imagen: dataUrl(),
        mascara: dataUrl(),
        prompt,
        prompt_negativo: negativo,
      }),
      res
    );

    expect(iaService.generarInpainting).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: 'A'.repeat(500),
        promptNegativo: 'B'.repeat(500),
      })
    );
  });

  it('usa prompt_negativo vacío cuando no se proporciona', async () => {
    const res = crearRes();

    iaService.generarInpainting.mockResolvedValue({
      imagenBase64: 'resultado',
      modelo: 'modelo',
      duracionMs: 1,
    });

    db.query.mockResolvedValue([[]]);

    await inpaint(
      crearReq({
        imagen: dataUrl(),
        mascara: dataUrl(),
        prompt: 'puerta',
      }),
      res
    );

    expect(iaService.generarInpainting).toHaveBeenCalledWith(
      expect.objectContaining({
        promptNegativo: '',
      })
    );
  });
});

describe('ia.controller - getTrabajoConColores', () => {
  it('retorna 404 cuando el trabajo no existe', async () => {
    const res = crearRes();

    db.query.mockResolvedValueOnce([[]]);

    await getTrabajoConColores(
      crearReq({}, { params: { id: 99 } }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Trabajo no encontrado',
    });
  });

  it('retorna trabajo y colores', async () => {
    const res = crearRes();

    const trabajo = {
      id: 1,
      nombre: 'Ventana',
      descripcion: 'Ventana de aluminio',
      tipo: 'ventana',
    };

    const colores = [
      { id: 1, nombre: 'Negro', valor: '#000000' },
    ];

    db.query
      .mockResolvedValueOnce([[trabajo]])
      .mockResolvedValueOnce([colores]);

    await getTrabajoConColores(
      crearReq({}, { params: { id: 1 } }),
      res
    );

    expect(res.json).toHaveBeenCalledWith({
      trabajo,
      colores,
    });
  });

  it('maneja error de base de datos', async () => {
    const res = crearRes();

    db.query.mockRejectedValueOnce(new Error('DB error'));

    await getTrabajoConColores(
      crearReq({}, { params: { id: 1 } }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Error al obtener datos del trabajo',
    });
  });
});

describe('ia.controller - visualizarEspacio', () => {
  it('rechaza cuando faltan archivos', async () => {
    const res = crearRes();

    await visualizarEspacio(
      crearReq({}, { files: undefined }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Se requieren los archivos imagen y mascara',
    });
  });

  it('rechaza cuando falta mascara', async () => {
    const res = crearRes();

    await visualizarEspacio(
      crearReq(
        { trabajo_id: 1, color_id: 2 },
        {
          files: {
            imagen: archivos().imagen,
          },
        }
      ),
      res
    );

    expect(res.status).toHaveBeenCalledWith(422);
  });

  it('rechaza prompt libre insuficiente', async () => {
    const res = crearRes();

    await visualizarEspacio(
      crearReq(
        {
          trabajo_id: 0,
          prompt_libre: 'abc',
        },
        {
          files: archivos(),
        }
      ),
      res
    );

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      error: 'El prompt libre es requerido (mín. 5 caracteres)',
    });
  });

  it('procesa modo libre con color_id pero sin color disponible', async () => {
    const res = crearRes();

    iaService.traducirAIngles.mockResolvedValue('translated');
    iaService.construirPromptLibre.mockReturnValue('prompt sin color');
    iaService.generarVisualizacion.mockResolvedValue(Buffer.from('img'));

    db.query.mockResolvedValueOnce([[]]);

    await visualizarEspacio(
      crearReq(
        {
          trabajo_id: 0,
          color_id: 99,
          prompt_libre: 'puerta moderna',
        },
        {
          files: archivos(),
        }
      ),
      res
    );

    expect(iaService.construirPromptLibre).toHaveBeenCalledWith({
      promptLibre: 'translated',
      color: null,
    });

    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      prompt: 'prompt sin color',
      imagen_base64: Buffer.from('img').toString('base64'),
      mime_type: 'image/png',
    });
  });

  it('procesa modo libre sin color', async () => {
    const res = crearRes();

    iaService.traducirAIngles.mockResolvedValue('translated prompt');
    iaService.construirPromptLibre.mockReturnValue('prompt final');
    iaService.generarVisualizacion.mockResolvedValue(
      Buffer.from('imagen-generada')
    );

    db.query.mockResolvedValue([[]]);

    await visualizarEspacio(
      crearReq(
        {
          trabajo_id: 0,
          prompt_libre: '  puerta moderna  ',
        },
        {
          user: { id: 5 },
          files: archivos(),
        }
      ),
      res
    );

    expect(iaService.traducirAIngles).toHaveBeenCalledWith('puerta moderna');
    expect(iaService.construirPromptLibre).toHaveBeenCalledWith({
      promptLibre: 'translated prompt',
      color: null,
    });

    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      prompt: 'prompt final',
      imagen_base64: Buffer.from('imagen-generada').toString('base64'),
      mime_type: 'image/png',
    });
  });

  it('procesa modo libre con color disponible', async () => {
    const res = crearRes();

    iaService.traducirAIngles.mockResolvedValue('translated');
    iaService.construirPromptLibre.mockReturnValue('prompt con color');
    iaService.generarVisualizacion.mockResolvedValue(Buffer.from('img'));

    db.query.mockResolvedValueOnce([[
      { id: 3, nombre: 'Negro', valor: '#000000' },
    ]]);

    await visualizarEspacio(
      crearReq(
        {
          trabajo_id: '0',
          color_id: '3',
          prompt_libre: 'puerta negra',
        },
        {
          files: archivos(),
        }
      ),
      res
    );

    expect(db.query).toHaveBeenCalled();
    expect(iaService.construirPromptLibre).toHaveBeenCalledWith({
      promptLibre: 'translated',
      color: { id: 3, nombre: 'Negro', valor: '#000000' },
    });

    expect(res.json).toHaveBeenCalled();
  });

  it('continúa modo libre cuando falla consulta de color', async () => {
    const res = crearRes();

    iaService.traducirAIngles.mockResolvedValue('translated');
    iaService.construirPromptLibre.mockReturnValue('prompt');
    iaService.generarVisualizacion.mockResolvedValue(Buffer.from('img'));

    db.query.mockRejectedValueOnce(new Error('DB color error'));

    await visualizarEspacio(
      crearReq(
        {
          trabajo_id: 0,
          color_id: 4,
          prompt_libre: 'puerta negra',
        },
        {
          files: archivos(),
        }
      ),
      res
    );

    expect(res.json).toHaveBeenCalled();
    expect(iaService.construirPromptLibre).toHaveBeenCalledWith({
      promptLibre: 'translated',
      color: null,
    });
  });

  it('maneja STABILITY_API_ERROR en modo libre', async () => {
    const res = crearRes();

    iaService.traducirAIngles.mockResolvedValue('translated');
    iaService.construirPromptLibre.mockReturnValue('prompt');

    const error = new Error('Stability failed');
    error.code = 'STABILITY_API_ERROR';

    iaService.generarVisualizacion.mockRejectedValue(error);
    db.query.mockResolvedValue([[]]);

    await visualizarEspacio(
      crearReq(
        {
          trabajo_id: 0,
          prompt_libre: 'puerta moderna',
        },
        {
          files: archivos(),
        }
      ),
      res
    );

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Error al procesar con Stability AI',
      detalle: 'Stability failed',
    });
  });

  it('maneja error genérico en modo libre', async () => {
    const res = crearRes();

    iaService.traducirAIngles.mockResolvedValue('translated');
    iaService.construirPromptLibre.mockReturnValue('prompt');
    iaService.generarVisualizacion.mockRejectedValue(
      new Error('error interno')
    );
    db.query.mockResolvedValue([[]]);

    await visualizarEspacio(
      crearReq(
        {
          trabajo_id: 0,
          prompt_libre: 'puerta moderna',
        },
        {
          files: archivos(),
        }
      ),
      res
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Error interno al generar la visualización',
    });
  });

  it('rechaza catálogo sin trabajo_id o color_id', async () => {
    const res = crearRes();

    await visualizarEspacio(
      crearReq(
        {
          trabajo_id: 1,
        },
        {
          files: archivos(),
        }
      ),
      res
    );

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      error: 'trabajo_id y color_id son requeridos',
    });
  });

  it('retorna 404 si el trabajo del catálogo no existe', async () => {
    const res = crearRes();

    db.query.mockResolvedValueOnce([[]]);

    await visualizarEspacio(
      crearReq(
        {
          trabajo_id: 1,
          color_id: 2,
        },
        {
          files: archivos(),
        }
      ),
      res
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Trabajo no encontrado',
    });
  });

  it('retorna 404 si el color no está disponible', async () => {
    const res = crearRes();

    db.query
      .mockResolvedValueOnce([[
        {
          id: 1,
          nombre: 'Ventana',
          descripcion: 'Ventana',
          tipo: 'ventana',
          prompt_base: 'base',
        },
      ]])
      .mockResolvedValueOnce([[]]);

    await visualizarEspacio(
      crearReq(
        {
          trabajo_id: 1,
          color_id: 2,
        },
        {
          files: archivos(),
        }
      ),
      res
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Color no disponible para este trabajo',
    });
  });

  it('procesa catálogo con material y referencias', async () => {
    const res = crearRes();

    db.query
      .mockResolvedValueOnce([[
        {
          id: 1,
          nombre: 'Ventana',
          descripcion: 'Ventana',
          tipo: 'ventana',
          prompt_base: 'base',
        },
      ]])
      .mockResolvedValueOnce([[
        { id: 2, nombre: 'Negro', valor: '#000000' },
      ]])
      .mockResolvedValueOnce([[{ material: 'Aluminio' }]])
      .mockResolvedValueOnce([[
        {
          filename: 'ref.png',
          descriptores: 'aluminio negro',
          peso: 0.9,
        },
      ]]);

    fs.promises.readFile.mockResolvedValue(Buffer.from('referencia'));

    iaService.construirPrompt.mockReturnValue('prompt catálogo');
    iaService.generarVisualizacion.mockResolvedValue(
      Buffer.from('imagen')
    );

    await visualizarEspacio(
      crearReq(
        {
          trabajo_id: 1,
          color_id: 2,
        },
        {
          user: { id: 8 },
          files: archivos(),
        }
      ),
      res
    );

    expect(iaService.construirPrompt).toHaveBeenCalledWith({
      trabajo: expect.objectContaining({ id: 1 }),
      color: {
        nombre: 'Negro',
        hex: '#000000',
      },
      material: 'Aluminio',
    });

    expect(iaService.generarVisualizacion).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: 'prompt catálogo',
        referencias: [{
          descriptores: 'aluminio negro',
          peso: 0.9,
          imagenBuffer: Buffer.from('referencia'),
        }],
      })
    );

    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      prompt: 'prompt catálogo',
      imagen_base64: Buffer.from('imagen').toString('base64'),
      mime_type: 'image/png',
    });
  });

  it('aplica valores por defecto a referencias con datos nulos o cero', async () => {
    const res = crearRes();

    db.query
      .mockResolvedValueOnce([[
        {
          id: 1,
          nombre: 'Puerta',
          descripcion: 'Puerta',
          tipo: 'puerta',
          prompt_base: null,
        },
      ]])
      .mockResolvedValueOnce([[
        { id: 2, nombre: 'Blanco', valor: '#ffffff' },
      ]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[
        {
          filename: 'ref.png',
          descriptores: null,
          peso: 0,
        },
      ]]);

    fs.promises.readFile.mockResolvedValue(Buffer.from('referencia'));

    iaService.construirPrompt.mockReturnValue('prompt');
    iaService.generarVisualizacion.mockResolvedValue(Buffer.from('img'));

    await visualizarEspacio(
      crearReq(
        {
          trabajo_id: 1,
          color_id: 2,
        },
        {
          files: archivos(),
        }
      ),
      res
    );

    expect(iaService.generarVisualizacion).toHaveBeenCalledWith(
      expect.objectContaining({
        referencias: [{
          descriptores: '',
          peso: 0.8,
          imagenBuffer: Buffer.from('referencia'),
        }],
      })
    );

    expect(res.json).toHaveBeenCalled();
  });

  it('procesa catálogo sin material y sin referencias utilizables', async () => {
    const res = crearRes();

    db.query
      .mockResolvedValueOnce([[
        {
          id: 1,
          nombre: 'Puerta',
          descripcion: 'Puerta',
          tipo: 'puerta',
          prompt_base: null,
        },
      ]])
      .mockResolvedValueOnce([[
        { id: 2, nombre: 'Blanco', valor: '#ffffff' },
      ]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[
        {
          filename: 'missing.png',
          descriptores: '',
          peso: null,
        },
      ]]);

    fs.promises.readFile.mockRejectedValue(new Error('not found'));

    iaService.construirPrompt.mockReturnValue('prompt');
    iaService.generarVisualizacion.mockResolvedValue(Buffer.from('img'));

    await visualizarEspacio(
      crearReq(
        {
          trabajo_id: 1,
          color_id: 2,
        },
        {
          files: archivos(),
        }
      ),
      res
    );

    expect(iaService.construirPrompt).toHaveBeenCalledWith({
      trabajo: expect.any(Object),
      color: {
        nombre: 'Blanco',
        hex: '#ffffff',
      },
      material: null,
    });

    expect(iaService.generarVisualizacion).toHaveBeenCalledWith(
      expect.objectContaining({
        referencias: [],
      })
    );

    expect(res.json).toHaveBeenCalled();
  });

  it('maneja error de referencias y continúa', async () => {
    const res = crearRes();

    db.query
      .mockResolvedValueOnce([[
        {
          id: 1,
          nombre: 'Puerta',
          descripcion: 'Puerta',
          tipo: 'puerta',
          prompt_base: null,
        },
      ]])
      .mockResolvedValueOnce([[
        { id: 2, nombre: 'Blanco', valor: '#ffffff' },
      ]])
      .mockResolvedValueOnce([[]])
      .mockRejectedValueOnce(new Error('referencias error'));

    iaService.construirPrompt.mockReturnValue('prompt');
    iaService.generarVisualizacion.mockResolvedValue(Buffer.from('img'));

    await visualizarEspacio(
      crearReq(
        {
          trabajo_id: 1,
          color_id: 2,
        },
        {
          files: archivos(),
        }
      ),
      res
    );

    expect(res.json).toHaveBeenCalled();
  });

  it('maneja STABILITY_API_ERROR en catálogo', async () => {
    const res = crearRes();

    db.query
      .mockResolvedValueOnce([[
        {
          id: 1,
          nombre: 'Puerta',
          descripcion: 'Puerta',
          tipo: 'puerta',
          prompt_base: null,
        },
      ]])
      .mockResolvedValueOnce([[
        { id: 2, nombre: 'Blanco', valor: '#fff' },
      ]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[]]);

    const error = new Error('Stability error');
    error.code = 'STABILITY_API_ERROR';

    iaService.generarVisualizacion.mockRejectedValue(error);

    await visualizarEspacio(
      crearReq(
        {
          trabajo_id: 1,
          color_id: 2,
        },
        {
          files: archivos(),
        }
      ),
      res
    );

    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Error al procesar con Stability AI',
      detalle: 'Stability error',
    });
  });

  it('maneja error genérico en catálogo', async () => {
    const res = crearRes();

    db.query
      .mockResolvedValueOnce([[
        {
          id: 1,
          nombre: 'Puerta',
          descripcion: 'Puerta',
          tipo: 'puerta',
          prompt_base: null,
        },
      ]])
      .mockResolvedValueOnce([[
        { id: 2, nombre: 'Blanco', valor: '#fff' },
      ]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[]]);

    iaService.generarVisualizacion.mockRejectedValue(
      new Error('error visualización')
    );

    await visualizarEspacio(
      crearReq(
        {
          trabajo_id: 1,
          color_id: 2,
        },
        {
          files: archivos(),
        }
      ),
      res
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Error interno al generar la visualización',
    });
  });

  it('usa usuario nulo cuando no existe usuario', async () => {
    const res = crearRes();

    iaService.traducirAIngles.mockResolvedValue('translated');
    iaService.construirPromptLibre.mockReturnValue('prompt');
    iaService.generarVisualizacion.mockResolvedValue(Buffer.from('img'));

    await visualizarEspacio(
      crearReq(
        {
          trabajo_id: 0,
          prompt_libre: 'puerta moderna',
        },
        {
          files: archivos(),
        }
      ),
      res
    );

    expect(res.json).toHaveBeenCalled();
  });
});

describe('ia.controller - mascaraAuto', () => {
  it('rechaza cuando no existe imagen', async () => {
    const res = crearRes();

    await mascaraAuto(crearReq({}, { files: undefined }), res);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Se requiere el archivo imagen',
    });
  });

  it('genera máscara con coordenadas por defecto', async () => {
    const res = crearRes();

    iaService.generarMascaraSAM.mockResolvedValue(
      Buffer.from('mascara')
    );

    await mascaraAuto(
      crearReq(
        {},
        {
          files: {
            imagen: [{
              buffer: Buffer.from('imagen'),
            }],
          },
        }
      ),
      res
    );

    expect(iaService.generarMascaraSAM).toHaveBeenCalledWith(
      Buffer.from('imagen'),
      50,
      50
    );

    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      mascara_base64: Buffer.from('mascara').toString('base64'),
      mime_type: 'image/png',
    });
  });

  it('limita coordenadas al rango 0-100', async () => {
    const res = crearRes();

    iaService.generarMascaraSAM.mockResolvedValue(
      Buffer.from('mascara')
    );

    await mascaraAuto(
      crearReq(
        {
          punto_x: -20,
          punto_y: 150,
        },
        {
          files: {
            imagen: [{
              buffer: Buffer.from('imagen'),
            }],
          },
        }
      ),
      res
    );

    expect(iaService.generarMascaraSAM).toHaveBeenCalledWith(
      Buffer.from('imagen'),
      0,
      100
    );
  });

  it('acepta coordenadas dentro del rango', async () => {
    const res = crearRes();

    iaService.generarMascaraSAM.mockResolvedValue(
      Buffer.from('mascara')
    );

    await mascaraAuto(
      crearReq(
        {
          punto_x: 25,
          punto_y: 75,
        },
        {
          files: {
            imagen: [{
              buffer: Buffer.from('imagen'),
            }],
          },
        }
      ),
      res
    );

    expect(iaService.generarMascaraSAM).toHaveBeenCalledWith(
      Buffer.from('imagen'),
      25,
      75
    );
  });

  it('maneja error de generación de máscara', async () => {
    const res = crearRes();

    iaService.generarMascaraSAM.mockRejectedValue(
      new Error('SAM error')
    );

    await mascaraAuto(
      crearReq(
        {},
        {
          files: {
            imagen: [{
              buffer: Buffer.from('imagen'),
            }],
          },
        }
      ),
      res
    );

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Error al generar la máscara automática',
      detalle: 'SAM error',
    });
  });
});
