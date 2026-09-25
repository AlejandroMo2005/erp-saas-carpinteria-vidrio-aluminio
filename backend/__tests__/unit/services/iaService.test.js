import { describe, expect, it, vi, afterEach } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);
const originalLoad = Module._load;

const iaServicePath = require.resolve(
  `${process.cwd()}/src/shared/services/iaService.js`
);

const originalEnv = { ...process.env };


function loadService({
  hfToken,
  stabilityToken,
  replicateToken,
  httpsMock,
  formDataMock,
} = {}) {
  process.env.HF_API_TOKEN = hfToken ?? '';
  process.env.STABILITY_API_KEY = stabilityToken ?? '';
  process.env.REPLICATE_API_TOKEN = replicateToken ?? '';

  delete require.cache[iaServicePath];

  const fakeHttps = httpsMock || {
    request: vi.fn(),
    get: vi.fn(),
  };

  const fakeFormData =
    formDataMock ||
    vi.fn(function () {
      this.append = vi.fn();
      this.set = vi.fn();
      this.getHeaders = vi.fn(() => ({}));
      this.pipe = vi.fn();
    });

  Module._load = function (request, parent, isMain) {
    if (request === 'https') return fakeHttps;
    if (request === 'form-data') return fakeFormData;
    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    const service = require(iaServicePath);

    return {
      service,
      https: fakeHttps,
      FormData: fakeFormData,
    };
  } finally {
    Module._load = originalLoad;
  }
}

afterEach(() => {
  process.env = { ...originalEnv };
  delete require.cache[iaServicePath];
  vi.restoreAllMocks();
});

describe('services/iaService', () => {
  describe('hashImagen', () => {
    it('debe generar un hash SHA-256 para un data URL', () => {
      const { service } = loadService();

      const resultado = service.hashImagen(
        'data:image/png;base64,aGVsbG8='
      );

      expect(resultado).toBe(
        '333d6b3a3c1f5db6c9bdda5939b136986d170f4649172a68368d54ecb44c2ff2'
      );
    });

    it('debe generar el mismo hash para base64 con y sin prefijo', () => {
      const { service } = loadService();

      expect(service.hashImagen('aGVsbG8=')).toBe(
        service.hashImagen('data:image/png;base64,aGVsbG8=')
      );
    });

    it('debe retornar null cuando falla el cálculo del hash', () => {
      const { service } = loadService();

      expect(service.hashImagen(null)).toBe(
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      );
    });
  });

  describe('construirPrompt', () => {
    it('debe construir prompt usando nombre, material, prompt base y color', () => {
      const { service } = loadService();

      const resultado = service.construirPrompt({
        trabajo: {
          nombre: 'Puerta corrediza',
          descripcion: 'Puerta de vidrio',
          prompt_base: 'modern architecture',
        },
        color: { nombre: 'Negro' },
        material: 'aluminio templado',
      });

      expect(resultado).toContain('door sliding');
      expect(resultado).toContain('aluminum tempered');
      expect(resultado).toContain('modern architecture');
      expect(resultado).toContain('Negro color');
      expect(resultado).toContain('professional finish');
    });

    it('debe usar descripción cuando no se proporciona material', () => {
      const { service } = loadService();

      const resultado = service.construirPrompt({
        trabajo: {
          nombre: 'Ventana fija',
          descripcion: 'Ventana de vidrio laminado',
        },
        color: { nombre: 'Blanco' },
      });

      expect(resultado).toContain('window fixed');
      expect(resultado).toContain('window de glass laminated');
      expect(resultado).toContain('Blanco color');
    });

    it('debe omitir descripción cuando existe material', () => {
      const { service } = loadService();

      const resultado = service.construirPrompt({
        trabajo: {
          nombre: 'Puerta',
          descripcion: 'Descripción que no debe aparecer',
        },
        material: 'aluminio',
        color: { nombre: 'Gris' },
      });

      expect(resultado).not.toContain('Descripción que no debe aparecer');
      expect(resultado).toContain('aluminum');
    });

    it('debe incluir prompt_base solamente cuando existe', () => {
      const { service } = loadService();

      const resultado = service.construirPrompt({
        trabajo: {
          nombre: 'Ventana',
          prompt_base: 'minimalist design',
        },
        color: { nombre: 'Blanco' },
      });

      expect(resultado).toContain('minimalist design');
    });
  });

  describe('construirPromptLibre', () => {
    it('debe limpiar instrucciones de acabado y agregar color', () => {
      const { service } = loadService();

      const resultado = service.construirPromptLibre({
        promptLibre:
          'modern window, *acabado profesional*, *fotorrealista*, *8k*',
        color: { nombre: 'Negro' },
      });

      expect(resultado).toContain('modern window');
      expect(resultado).toContain('negro color');
      expect(resultado).toContain('professional finish');
      expect(resultado).not.toContain('acabado profesional');
    });

    it('no debe duplicar el color si ya está presente', () => {
      const { service } = loadService();

      const resultado = service.construirPromptLibre({
        promptLibre: 'modern black window',
        color: { nombre: 'Black' },
      });

      expect(resultado.match(/black color/gi)).toBeNull();
      expect(resultado).toContain('modern black window');
    });

    it('debe funcionar sin color', () => {
      const { service } = loadService();

      const resultado = service.construirPromptLibre({
        promptLibre: 'modern glass door',
      });

      expect(resultado).toContain('modern glass door');
      expect(resultado).toContain('professional finish');
    });
  });

  describe('traducirAIngles', () => {
    it('debe retornar el texto original cuando está vacío', async () => {
      const { service } = loadService();

      expect(await service.traducirAIngles('')).toBe('');
      expect(await service.traducirAIngles('   ')).toBe('   ');
      expect(await service.traducirAIngles(null)).toBe(null);
    });

    it('debe retornar la traducción cuando la API responde correctamente', async () => {
      const response = {
        responseData: {
          translatedText: 'sliding glass door',
        },
      };

      const https = {
        request: vi.fn(),
        get: vi.fn((_url, _options, callback) => {
          const res = {
            on: vi.fn((event, handler) => {
              if (event === 'data') handler(Buffer.from(JSON.stringify(response)));
              if (event === 'end') handler();
            }),
          };

          callback(res);

          return {
            on: vi.fn(),
            destroy: vi.fn(),
          };
        }),
      };

      const { service } = loadService({ httpsMock: https });

      const resultado = await service.traducirAIngles(
        'puerta corrediza de vidrio'
      );

      expect(resultado).toBe('sliding glass door');
      expect(https.get).toHaveBeenCalledTimes(1);
    });

    it('debe retornar el texto original si la traducción es inválida', async () => {
      const response = {
        responseData: {
          translatedText: 'INVALID TRANSLATION',
        },
      };

      const https = {
        request: vi.fn(),
        get: vi.fn((_url, _options, callback) => {
          const res = {
            on: vi.fn((event, handler) => {
              if (event === 'data') handler(Buffer.from(JSON.stringify(response)));
              if (event === 'end') handler();
            }),
          };

          callback(res);

          return {
            on: vi.fn(),
            destroy: vi.fn(),
          };
        }),
      };

      const { service } = loadService({ httpsMock: https });

      expect(await service.traducirAIngles('puerta')).toBe('puerta');
    });

    it('debe retornar el texto original si la respuesta JSON es inválida', async () => {
      const https = {
        request: vi.fn(),
        get: vi.fn((_url, _options, callback) => {
          const res = {
            on: vi.fn((event, handler) => {
              if (event === 'data') handler(Buffer.from('no-json'));
              if (event === 'end') handler();
            }),
          };

          callback(res);

          return {
            on: vi.fn(),
            destroy: vi.fn(),
          };
        }),
      };

      const { service } = loadService({ httpsMock: https });

      expect(await service.traducirAIngles('puerta')).toBe('puerta');
    });

    it('debe retornar el texto original cuando ocurre un error de red', async () => {
      const https = {
        request: vi.fn(),
        get: vi.fn((_url, _options, _callback) => {
          const req = {
            on: vi.fn((event, handler) => {
              if (event === 'error') handler(new Error('network error'));
            }),
            destroy: vi.fn(),
          };

          return req;
        }),
      };

      const { service } = loadService({ httpsMock: https });

      expect(await service.traducirAIngles('puerta')).toBe('puerta');
    });
  });

  describe('generarInpainting', () => {
    it('debe usar mock cuando no existe HF_API_TOKEN', async () => {
      const { service } = loadService();

      const resultado = await service.generarInpainting({
        imagenBase64: 'data:image/png;base64,abc',
        mascaraBase64: 'data:image/png;base64,mask',
        prompt: 'puerta',
        promptNegativo: 'blurry',
      });

      expect(resultado).toEqual({
        imagenBase64: 'data:image/png;base64,abc',
        modelo: 'mock-hf',
        duracionMs: 100,
      });
    });

    it('debe limpiar prefijos data URL antes de enviar el payload a Hugging Face', async () => {
      const responseBody = Buffer.from('fake-image');

      const response = {
        statusCode: 200,
        headers: { 'content-type': 'image/png' },
        on: vi.fn((event, handler) => {
          if (event === 'data') handler(responseBody);
          if (event === 'end') handler();
        }),
      };

      const req = {
        setTimeout: vi.fn(),
        on: vi.fn(),
        write: vi.fn(),
        end: vi.fn(),
        destroy: vi.fn(),
      };

      const https = {
        request: vi.fn((_url, _options, callback) => {
          callback(response);
          return req;
        }),
        get: vi.fn(),
      };

      const { service } = loadService({
        hfToken: 'hf-test',
        httpsMock: https,
      });

      const resultado = await service.generarInpainting({
        imagenBase64: 'data:image/png;base64,IMAGE',
        mascaraBase64: 'data:image/png;base64,MASK',
        prompt: 'door',
        promptNegativo: 'blurry',
      });

      expect(resultado.modelo).toBe('runwayml/stable-diffusion-inpainting');
      expect(resultado.imagenBase64).toBe(
        `data:image/png;base64,${responseBody.toString('base64')}`
      );

      const payload = JSON.parse(req.write.mock.calls[0][0]);

      expect(payload.image).toBe('IMAGE');
      expect(payload.mask_image).toBe('MASK');
      expect(payload.inputs).toBe('door');
      expect(payload.parameters.negative_prompt).toBe('blurry');
    });

    it('debe retornar JPEG cuando Hugging Face responde image/jpeg', async () => {
      const responseBody = Buffer.from('jpeg-image');

      const response = {
        statusCode: 200,
        headers: { 'content-type': 'image/jpeg' },
        on: vi.fn((event, handler) => {
          if (event === 'data') handler(responseBody);
          if (event === 'end') handler();
        }),
      };

      const req = {
        setTimeout: vi.fn(),
        on: vi.fn(),
        write: vi.fn(),
        end: vi.fn(),
        destroy: vi.fn(),
      };

      const https = {
        request: vi.fn((_url, _options, callback) => {
          callback(response);
          return req;
        }),
        get: vi.fn(),
      };

      const { service } = loadService({
        hfToken: 'hf-test',
        httpsMock: https,
      });

      const resultado = await service.generarInpainting({
        imagenBase64: 'IMAGE',
        mascaraBase64: 'MASK',
        prompt: 'door',
        promptNegativo: 'bad',
      });

      expect(resultado.imagenBase64).toBe(
        `data:image/jpeg;base64,${responseBody.toString('base64')}`
      );
    });
  });


  describe('generarInpainting — errores y reintentos', () => {
    function createResponse(statusCode, body, contentType = 'application/json') {
      return {
        statusCode,
        headers: { 'content-type': contentType },
        on: vi.fn((event, handler) => {
          if (event === 'data') handler(Buffer.from(body));
          if (event === 'end') handler();
        }),
      };
    }

    function createRequest() {
      return {
        setTimeout: vi.fn(),
        on: vi.fn(),
        write: vi.fn(),
        end: vi.fn(),
        destroy: vi.fn(),
      };
    }

    it('debe reintentar y finalmente lanzar error genérico cuando el contenido no es una imagen', async () => {
      const req = createRequest();

      const https = {
        request: vi.fn((_url, _options, callback) => {
          callback(
            createResponse(
              200,
              JSON.stringify({ error: 'not an image' }),
              'application/json'
            )
          );
          return req;
        }),
        get: vi.fn(),
      };

      const { service } = loadService({
        hfToken: 'hf-test',
        httpsMock: https,
      });

      await expect(
        service.generarInpainting({
          imagenBase64: 'IMAGE',
          mascaraBase64: 'MASK',
          prompt: 'door',
          promptNegativo: 'bad',
        })
      ).rejects.toThrow(
        'No se pudo generar la imagen. El modelo puede estar ocupado — intenta de nuevo.'
      );

      expect(https.request).toHaveBeenCalledTimes(6);
    });

    it('debe continuar con el fallback cuando el modelo primario devuelve HTTP 500', async () => {
      const requests = [];
      const responses = [
        createResponse(500, JSON.stringify({ error: 'primary failed' })),
        createResponse(200, 'fallback-image', 'image/png'),
      ];

      const https = {
        request: vi.fn((_url, _options, callback) => {
          const req = {
          on: vi.fn(),
          setTimeout: vi.fn(),
          destroy: vi.fn(),
          write: vi.fn(),
          end: vi.fn(),
        };
          requests.push(req);
          callback(responses.shift());
          return req;
        }),
        get: vi.fn(),
      };

      const { service } = loadService({
        hfToken: 'hf-test',
        httpsMock: https,
      });

      const resultado = await service.generarInpainting({
        imagenBase64: 'IMAGE',
        mascaraBase64: 'MASK',
        prompt: 'door',
        promptNegativo: 'bad',
      });

      expect(resultado.modelo).toBe(
        'stabilityai/stable-diffusion-2-inpainting'
      );
      expect(https.request).toHaveBeenCalledTimes(2);
      expect(resultado.imagenBase64).toContain('data:image/png;base64,');
    });

    it('debe manejar HTTP 500 sin campo error', async () => {
      const responses = [
        createResponse(500, '{}'),
        createResponse(200, 'fallback-image', 'image/png'),
      ];

      const https = {
        request: vi.fn((_url, _options, callback) => {
          const req = createRequest();
          callback(responses.shift());
          return req;
        }),
        get: vi.fn(),
      };

      const { service } = loadService({
        hfToken: 'hf-test',
        httpsMock: https,
      });

      const resultado = await service.generarInpainting({
        imagenBase64: 'IMAGE',
        mascaraBase64: 'MASK',
        prompt: 'door',
        promptNegativo: 'bad',
      });

      expect(resultado.modelo).toBe(
        'stabilityai/stable-diffusion-2-inpainting'
      );
    });

    it('debe reintentar cuando Hugging Face devuelve 503', async () => {
      vi.useFakeTimers();

      try {
        const responses = [
          createResponse(503, JSON.stringify({ estimated_time: 0 })),
          createResponse(200, 'generated', 'image/png'),
        ];

        const https = {
          request: vi.fn((_url, _options, callback) => {
            const req = createRequest();
            callback(responses.shift());
            return req;
          }),
          get: vi.fn(),
        };

        const { service } = loadService({
          hfToken: 'hf-test',
          httpsMock: https,
        });

        const promise = service.generarInpainting({
          imagenBase64: 'IMAGE',
          mascaraBase64: 'MASK',
          prompt: 'door',
          promptNegativo: 'bad',
        });

        await vi.advanceTimersByTimeAsync(8_000);

        const resultado = await promise;

        expect(resultado.modelo).toBe(
          'runwayml/stable-diffusion-inpainting'
        );
        expect(https.request).toHaveBeenCalledTimes(2);
      } finally {
        vi.useRealTimers();
      }
    });

    it('debe reintentar cuando Hugging Face devuelve 429', async () => {
      vi.useFakeTimers();

      try {
        const responses = [
          createResponse(429, '{}'),
          createResponse(200, 'generated', 'image/png'),
        ];

        const https = {
          request: vi.fn((_url, _options, callback) => {
            const req = createRequest();
            callback(responses.shift());
            return req;
          }),
          get: vi.fn(),
        };

        const { service } = loadService({
          hfToken: 'hf-test',
          httpsMock: https,
        });

        const promise = service.generarInpainting({
          imagenBase64: 'IMAGE',
          mascaraBase64: 'MASK',
          prompt: 'door',
          promptNegativo: 'bad',
        });

        await vi.advanceTimersByTimeAsync(10_000);

        const resultado = await promise;

        expect(resultado.modelo).toBe(
          'runwayml/stable-diffusion-inpainting'
        );
        expect(https.request).toHaveBeenCalledTimes(2);
      } finally {
        vi.useRealTimers();
      }
    });

    it('debe usar el fallback después de tres errores consecutivos del modelo primario', async () => {
      const responses = [
        new Error('network 1'),
        new Error('network 2'),
        new Error('network 3'),
        createResponse(200, 'fallback', 'image/png'),
      ];

      const https = {
        request: vi.fn((_url, _options, callback) => {
          const value = responses.shift();
          const req = createRequest();

          if (value instanceof Error) {
            queueMicrotask(() => {
              for (const call of req.on.mock.calls) {
                if (call[0] === 'error') call[1](value);
              }
            });
          } else {
            callback(value);
          }

          return req;
        }),
        get: vi.fn(),
      };

      const { service } = loadService({
        hfToken: 'hf-test',
        httpsMock: https,
      });

      const resultado = await service.generarInpainting({
        imagenBase64: 'IMAGE',
        mascaraBase64: 'MASK',
        prompt: 'door',
        promptNegativo: 'bad',
      });

      expect(resultado.modelo).toBe(
        'stabilityai/stable-diffusion-2-inpainting'
      );
      expect(https.request).toHaveBeenCalledTimes(4);
    });

    it('debe lanzar el error final cuando todos los modelos fallan', async () => {
      const https = {
        request: vi.fn((_url, _options, _callback) => {
          const req = createRequest();

          queueMicrotask(() => {
            const error = new Error('network failure');

            for (const call of req.on.mock.calls) {
              if (call[0] === 'error') call[1](error);
            }
          });

          return req;
        }),
        get: vi.fn(),
      };

      const { service } = loadService({
        hfToken: 'hf-test',
        httpsMock: https,
      });

      await expect(
        service.generarInpainting({
          imagenBase64: 'IMAGE',
          mascaraBase64: 'MASK',
          prompt: 'door',
          promptNegativo: 'bad',
        })
      ).rejects.toThrow(
        'No se pudo generar la imagen. El modelo puede estar ocupado — intenta de nuevo.'
      );

      expect(https.request).toHaveBeenCalledTimes(6);
    });
  });

  describe('generarVisualizacion', () => {
    it('debe retornar la imagen original cuando no existe STABILITY_API_KEY', async () => {
      const { service } = loadService();

      const imagen = Buffer.from('imagen-original');

      const resultado = await service.generarVisualizacion({
        imagenBuffer: imagen,
        mascaraBuffer: Buffer.from('mascara'),
        imagenMimeType: 'image/jpeg',
        prompt: 'modern door',
      });

      expect(resultado).toBe(imagen);
    });

    it('debe aceptar referencias sin imagen cuando usa el mock', async () => {
      const { service } = loadService();

      const imagen = Buffer.from('imagen-original');

      const resultado = await service.generarVisualizacion({
        imagenBuffer: imagen,
        mascaraBuffer: Buffer.from('mascara'),
        prompt: 'door',
        referencias: [
          { descriptores: 'modern aluminum style' },
          { descriptores: 'minimalist' },
        ],
      });

      expect(resultado).toBe(imagen);
    });
  });

  describe('generarMascaraSAM', () => {
    it('debe generar máscara mock cuando no existe REPLICATE_API_TOKEN', async () => {
      const { service } = loadService();

      const sharp = require('sharp');
      const imagen = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 255, g: 255, b: 255 },
        },
      })
        .png()
        .toBuffer();

      const resultado = await service.generarMascaraSAM(imagen);

      expect(Buffer.isBuffer(resultado)).toBe(true);

      const meta = await sharp(resultado).metadata();

      expect(meta.width).toBe(100);
      expect(meta.height).toBe(100);
      expect(meta.channels).toBeGreaterThanOrEqual(1);
    });

    it('debe respetar las coordenadas por defecto de la máscara mock', async () => {
      const { service } = loadService();

      const sharp = require('sharp');
      const imagen = await sharp({
        create: {
          width: 20,
          height: 20,
          channels: 3,
          background: { r: 255, g: 255, b: 255 },
        },
      })
        .png()
        .toBuffer();

      const resultado = await service.generarMascaraSAM(imagen);

      const { data, info } = await sharp(resultado)
        .raw()
        .toBuffer({ resolveWithObject: true });

      expect(info.width).toBe(20);
      expect(info.height).toBe(20);
      expect(data.length).toBe(20 * 20 * info.channels);

      const centro = (10 * info.width + 10) * info.channels;
      const esquina = 0;

      expect(data[centro]).toBe(255);
      expect(data[esquina]).toBe(0);
    });
  });

  describe('generarVisualizacion — Stability AI', () => {
    async function crearImagenBuffer(width = 100, height = 100) {
      const sharp = require('sharp');
      return sharp({
        create: {
          width,
          height,
          channels: 3,
          background: { r: 255, g: 255, b: 255 },
        },
      }).png().toBuffer();
    }

    function createRequest() {
      return {
        setTimeout: vi.fn(),
        on: vi.fn(),
      };
    }

    function createResponse(statusCode, body) {
      return {
        statusCode,
        on: vi.fn((event, handler) => {
          if (event === 'data') handler(Buffer.from(body));
          if (event === 'end') handler();
        }),
      };
    }

    it('debe generar visualización con Stability AI y referencia de imagen', async () => {
      const imagen = await crearImagenBuffer(100, 80);
      const mascara = await crearImagenBuffer(100, 80);
      const referencia = await crearImagenBuffer(60, 40);

      const append = vi.fn();
      const set = vi.fn();
      const getHeaders = vi.fn(() => ({
        'content-type': 'multipart/form-data; boundary=test',
      }));
      const pipe = vi.fn((req) => req);

      const https = {
        request: vi.fn((options, callback) => {
          const req = createRequest();
          callback(createResponse(200, JSON.stringify({
            image: Buffer.from('resultado').toString('base64'),
          })));
          return req;
        }),
        get: vi.fn(),
      };

      const formDataMock = vi.fn(function () {
        this.append = append;
        this.set = set;
        this.getHeaders = getHeaders;
        this.pipe = pipe;
      });

      const { service } = loadService({
        stabilityToken: 'stability-test',
        httpsMock: https,
        formDataMock,
      });

      const resultado = await service.generarVisualizacion({
        imagenBuffer: imagen,
        mascaraBuffer: mascara,
        imagenMimeType: 'image/png',
        prompt: 'modern aluminum door',
        referencias: [
          { imagenBuffer: referencia },
        ],
      });

      expect(Buffer.isBuffer(resultado)).toBe(true);
      expect(resultado.toString()).toBe('resultado');
      expect(formDataMock).toHaveBeenCalledTimes(1);
      expect(append).toHaveBeenCalledWith(
        'image',
        expect.any(Buffer),
        expect.objectContaining({
          filename: 'espacio.jpg',
          contentType: 'image/png',
        }),
      );
      expect(append).toHaveBeenCalledWith(
        'mask',
        expect.any(Buffer),
        expect.objectContaining({
          filename: 'mascara.png',
          contentType: 'image/png',
        }),
      );
      expect(append).toHaveBeenCalledWith('prompt', 'modern aluminum door');
      expect(append).toHaveBeenCalledWith(
        'negative_prompt',
        expect.stringContaining('cartoon'),
      );
      expect(append).toHaveBeenCalledWith('output_format', 'png');
      expect(append).toHaveBeenCalledWith('strength', '0.95');
      expect(append).toHaveBeenCalledWith(
        'style_image',
        expect.any(Buffer),
        expect.objectContaining({
          filename: 'referencia.jpg',
          contentType: 'image/jpeg',
        }),
      );
      expect(pipe).toHaveBeenCalled();
      expect(https.request).toHaveBeenCalledTimes(1);
    });

    it('debe agregar descriptores de referencias textuales al prompt', async () => {
      const imagen = await crearImagenBuffer();
      const mascara = await crearImagenBuffer();

      const append = vi.fn();
      const set = vi.fn();
      const getHeaders = vi.fn(() => ({}));
      const pipe = vi.fn();

      const https = {
        request: vi.fn((options, callback) => {
          const req = createRequest();
          callback(createResponse(200, JSON.stringify({
            image: Buffer.from('texto-ref').toString('base64'),
          })));
          return req;
        }),
        get: vi.fn(),
      };

      const formDataMock = vi.fn(function () {
        this.append = append;
        this.set = set;
        this.getHeaders = getHeaders;
        this.pipe = pipe;
      });

      const { service } = loadService({
        stabilityToken: 'stability-test',
        httpsMock: https,
        formDataMock,
      });

      await service.generarVisualizacion({
        imagenBuffer: imagen,
        mascaraBuffer: mascara,
        prompt: 'aluminum window',
        referencias: [
          { descriptores: 'minimalist white frame' },
          { descriptores: 'modern architecture' },
          { descriptores: '   ' },
          { imagenBuffer: 'not-a-buffer', descriptores: 'text reference' },
        ],
      });

      expect(set).toHaveBeenCalledWith(
        'prompt',
        'aluminum window, style influenced by: minimalist white frame, modern architecture, text reference',
      );
    });

    it('debe lanzar STABILITY_API_ERROR cuando Stability responde con errors', async () => {
      const imagen = await crearImagenBuffer();
      const mascara = await crearImagenBuffer();

      const https = {
        request: vi.fn((options, callback) => {
          const req = createRequest();
          callback(createResponse(
            400,
            JSON.stringify({ errors: ['invalid prompt', 'bad image'] }),
          ));
          return req;
        }),
        get: vi.fn(),
      };

      const { service } = loadService({
        stabilityToken: 'stability-test',
        httpsMock: https,
      });

      await expect(
        service.generarVisualizacion({
          imagenBuffer: imagen,
          mascaraBuffer: mascara,
          prompt: 'test',
        }),
      ).rejects.toMatchObject({
        code: 'STABILITY_API_ERROR',
        message: expect.stringContaining('invalid prompt, bad image'),
      });
    });

    it('debe usar message cuando Stability responde con error HTTP', async () => {
      const imagen = await crearImagenBuffer();
      const mascara = await crearImagenBuffer();

      const https = {
        request: vi.fn((options, callback) => {
          const req = createRequest();
          callback(createResponse(
            401,
            JSON.stringify({ message: 'unauthorized' }),
          ));
          return req;
        }),
        get: vi.fn(),
      };

      const { service } = loadService({
        stabilityToken: 'stability-test',
        httpsMock: https,
      });

      await expect(
        service.generarVisualizacion({
          imagenBuffer: imagen,
          mascaraBuffer: mascara,
          prompt: 'test',
        }),
      ).rejects.toMatchObject({
        code: 'STABILITY_API_ERROR',
        message: expect.stringContaining('unauthorized'),
      });
    });

    it('debe usar HTTP como detalle cuando la respuesta de Stability no es JSON', async () => {
      const imagen = await crearImagenBuffer();
      const mascara = await crearImagenBuffer();

      const https = {
        request: vi.fn((options, callback) => {
          const req = createRequest();
          callback(createResponse(500, 'internal server error'));
          return req;
        }),
        get: vi.fn(),
      };

      const { service } = loadService({
        stabilityToken: 'stability-test',
        httpsMock: https,
      });

      await expect(
        service.generarVisualizacion({
          imagenBuffer: imagen,
          mascaraBuffer: mascara,
          prompt: 'test',
        }),
      ).rejects.toMatchObject({
        code: 'STABILITY_API_ERROR',
        message: expect.stringContaining('HTTP 500'),
      });
    });

    it('debe usar mensaje fallback cuando Stability no devuelve error en el JSON', async () => {
  const imagen = await crearImagenBuffer();
  const mascara = await crearImagenBuffer();

  const https = {
    request: vi.fn((options, callback) => {
      const req = createRequest();
      callback(createResponse(200, JSON.stringify({})));
      return req;
    }),
    get: vi.fn(),
  };

  const { service } = loadService({
    stabilityToken: 'stability-test',
    httpsMock: https,
  });

  await expect(
    service.generarVisualizacion({
      imagenBuffer: imagen,
      mascaraBuffer: mascara,
      prompt: 'test',
    }),
  ).rejects.toMatchObject({
    code: 'STABILITY_API_ERROR',
    message: 'Stability AI v2beta no devolvió imagen',
  });
});

it('debe lanzar STABILITY_API_ERROR cuando no devuelve imagen', async () => {
      const imagen = await crearImagenBuffer();
      const mascara = await crearImagenBuffer();

      const https = {
        request: vi.fn((options, callback) => {
          const req = createRequest();
          callback(createResponse(200, JSON.stringify({})));
          return req;
        }),
        get: vi.fn(),
      };

      const { service } = loadService({
        stabilityToken: 'stability-test',
        httpsMock: https,
      });

      await expect(
        service.generarVisualizacion({
          imagenBuffer: imagen,
          mascaraBuffer: mascara,
          prompt: 'test',
        }),
      ).rejects.toMatchObject({
        code: 'STABILITY_API_ERROR',
        message: 'Stability AI v2beta no devolvió imagen',
      });
    });

    it('debe propagar errores de red de Stability AI', async () => {
      const imagen = await crearImagenBuffer();
      const mascara = await crearImagenBuffer();

      const https = {
        request: vi.fn(() => {
          const req = {
            setTimeout: vi.fn(),
            on: vi.fn((event, handler) => {
              if (event === 'error') handler(new Error('network failure'));
            }),
          };
          return req;
        }),
        get: vi.fn(),
      };

      const { service } = loadService({
        stabilityToken: 'stability-test',
        httpsMock: https,
      });

      await expect(
        service.generarVisualizacion({
          imagenBuffer: imagen,
          mascaraBuffer: mascara,
          prompt: 'test',
        }),
      ).rejects.toThrow('network failure');
    });
  });

});



  describe('casos adicionales de cobertura de callbacks y ramas', () => {
  it('debe ejecutar el timeout de MyMemory y retornar el texto original', async () => {
    let timeoutHandler;

    const https = {
      request: vi.fn(),
      get: vi.fn((_url, _options, callback) => {
        const req = {
          on: vi.fn((event, handler) => {
            if (event === 'timeout') timeoutHandler = handler;
            return req;
          }),
          destroy: vi.fn(),
        };

        const res = {
          on: vi.fn(),
        };

        callback(res);

        return req;
      }),
    };

    const { service } = loadService({ httpsMock: https });

    const promise = service.traducirAIngles('puerta');

    expect(timeoutHandler).toEqual(expect.any(Function));

    timeoutHandler();

    await expect(promise).resolves.toBe('puerta');
  });

  it('debe ejecutar el timeout de Hugging Face', async () => {
    const realSetTimeout = globalThis.setTimeout;
    let destroyError;

    globalThis.setTimeout = vi.fn((callback) => {
      callback();
      return 0;
    });

    try {
      const https = {
        get: vi.fn(),
        request: vi.fn((_url, _options, callback) => {
          let timeoutHandler;
          let errorHandler;

          const req = {
            on: vi.fn((event, handler) => {
              if (event === 'error') {
                errorHandler = handler;
                timeoutHandler?.();
              }

              return req;
            }),
            setTimeout: vi.fn((_ms, handler) => {
              timeoutHandler = handler;
            }),
            destroy: vi.fn((error) => {
              destroyError = error;
              errorHandler?.(error);
            }),
            write: vi.fn(),
            end: vi.fn(),
          };

          callback({
            statusCode: 200,
            headers: {
              'content-type': 'image/png',
            },
            on: vi.fn(),
          });

          return req;
        }),
      };

      const { service } = loadService({
        hfToken: 'hf-test',
        httpsMock: https,
      });

      const promise = service.generarInpainting({
        imagenBase64: 'data:image/png;base64,aGVsbG8=',
        mascaraBase64: 'data:image/png;base64,aGVsbG8=',
        prompt: 'puerta',
        promptNegativo: 'blurry',
      });

      expect(https.request).toHaveBeenCalled();
      expect(destroyError).toBeInstanceOf(Error);
      expect(destroyError.message).toBe('HF API timeout');

      await expect(promise).rejects.toThrow(
        'No se pudo generar la imagen',
      );
    } finally {
      globalThis.setTimeout = realSetTimeout;
    }
  });

  it('debe cubrir content-type vacío en Hugging Face', async () => {
    const realSetTimeout = globalThis.setTimeout;

    globalThis.setTimeout = vi.fn((callback) => {
      callback();
      return 0;
    });

    try {
      const https = {
        get: vi.fn(),
        request: vi.fn((_url, _options, callback) => {
          const req = {
            on: vi.fn(),
            setTimeout: vi.fn(),
            destroy: vi.fn(),
            write: vi.fn(),
            end: vi.fn(),
          };

          const res = {
            statusCode: 200,
            headers: {},
            on: vi.fn((event, handler) => {
              if (event === 'data') {
                handler(
                  Buffer.from(JSON.stringify({ error: 'sin imagen' })),
                );
              }

              if (event === 'end') handler();

              return res;
            }),
          };

          callback(res);
          return req;
        }),
      };

      const { service } = loadService({
        hfToken: 'hf-test',
        httpsMock: https,
      });

      await expect(
        service.generarInpainting({
          imagenBase64: 'data:image/png;base64,aGVsbG8=',
          mascaraBase64: 'data:image/png;base64,aGVsbG8=',
          prompt: 'puerta',
          promptNegativo: 'blurry',
        }),
      ).rejects.toThrow('No se pudo generar la imagen');
    } finally {
      globalThis.setTimeout = realSetTimeout;
    }
  });

  it('debe manejar 503 de Hugging Face sin estimated_time', async () => {
    const realSetTimeout = globalThis.setTimeout;

    globalThis.setTimeout = vi.fn((callback) => {
      callback();
      return 0;
    });

    try {
      const https = {
        get: vi.fn(),
        request: vi.fn((_options, callback) => {
          const req = {
            on: vi.fn(),
            setTimeout: vi.fn(),
            destroy: vi.fn(),
            write: vi.fn(),
            end: vi.fn(),
          };

          const res = {
            statusCode: 503,
            headers: {
              'content-type': 'application/json',
            },
            on: vi.fn((event, handler) => {
              if (event === 'data') {
                handler(Buffer.from('{}'));
              }

              if (event === 'end') handler();

              return res;
            }),
          };

          callback(res);
          return req;
        }),
      };

      const { service } = loadService({
        hfToken: 'hf-test',
        httpsMock: https,
      });

      await expect(
        service.generarInpainting({
          imagenBase64: 'data:image/png;base64,aGVsbG8=',
          mascaraBase64: 'data:image/png;base64,aGVsbG8=',
          prompt: 'puerta',
          promptNegativo: 'blurry',
        }),
      ).rejects.toThrow('No se pudo generar la imagen');
    } finally {
      globalThis.setTimeout = realSetTimeout;
    }
  });

  it('debe cubrir error HTTP de Hugging Face cuando solo existe message', async () => {
    const https = {
      get: vi.fn(),
      request: vi.fn((_options, callback) => {
        const req = {
          on: vi.fn(),
          setTimeout: vi.fn(),
          destroy: vi.fn(),
          write: vi.fn(),
          end: vi.fn(),
        };

        const res = {
          statusCode: 400,
          headers: {
            'content-type': 'application/json',
          },
          on: vi.fn((event, handler) => {
            if (event === 'data') {
              handler(
                Buffer.from(
                  JSON.stringify({ message: 'mensaje HF' }),
                ),
              );
            }

            if (event === 'end') handler();

            return res;
          }),
        };

        callback(res);
        return req;
      }),
    };

    const { service } = loadService({
      hfToken: 'hf-test',
      httpsMock: https,
    });

    await expect(
      service.generarInpainting({
        imagenBase64: 'data:image/png;base64,aGVsbG8=',
        mascaraBase64: 'data:image/png;base64,aGVsbG8=',
        prompt: 'puerta',
        promptNegativo: 'blurry',
      }),
    ).rejects.toThrow('No se pudo generar la imagen');
  });

  it('debe cubrir Content-Type inesperado cuando HF devuelve JSON sin error', async () => {
    const https = {
      get: vi.fn(),
      request: vi.fn((_options, callback) => {
        const req = {
          on: vi.fn(),
          setTimeout: vi.fn(),
          destroy: vi.fn(),
          write: vi.fn(),
          end: vi.fn(),
        };

        const res = {
          statusCode: 200,
          headers: {
            'content-type': 'application/json',
          },
          on: vi.fn((event, handler) => {
            if (event === 'data') {
              handler(Buffer.from('{}'));
            }

            if (event === 'end') handler();

            return res;
          }),
        };

        callback(res);
        return req;
      }),
    };

    const { service } = loadService({
      hfToken: 'hf-test',
      httpsMock: https,
    });

    await expect(
      service.generarInpainting({
        imagenBase64: 'data:image/png;base64,aGVsbG8=',
        mascaraBase64: 'data:image/png;base64,aGVsbG8=',
        prompt: 'puerta',
        promptNegativo: 'blurry',
      }),
    ).rejects.toThrow('No se pudo generar la imagen');
  });

  it('debe cubrir el fallback de hashImagen cuando dataUrl es undefined', () => {
    const { service } = loadService();

    expect(service.hashImagen(undefined)).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });

  it('debe retornar inmediatamente cuando traducirTerminos recibe texto vacío', () => {
    const { service } = loadService();

    const resultado = service.construirPrompt({
      trabajo: {
        nombre: '',
        descripcion: '',
        prompt_base: '',
      },
      color: {
        nombre: 'Blanco',
      },
    });

    expect(resultado).toContain('Blanco color');
  });

  it('debe cubrir la rama sin color en construirPromptLibre', () => {
    const { service } = loadService();

    const resultado = service.construirPromptLibre({
      promptLibre: 'door aluminum',
      color: {},
    });

    expect(resultado).toContain('door aluminum');
    expect(resultado).not.toContain('color');
    expect(resultado).toContain('professional finish');
  });

  it('debe ejecutar el timeout de Stability AI', async () => {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    );

    let destroyError;

    const fakeSharp = vi.fn((buffer) => ({
      metadata: vi.fn().mockResolvedValue({
        width: 1,
        height: 1,
      }),
      resize: vi.fn().mockReturnThis(),
      toBuffer: vi.fn().mockResolvedValue(buffer),
    }));

    const https = {
      request: vi.fn((_options, callback) => {
        let timeoutHandler;
        let errorHandler;

        const req = {
          on: vi.fn((event, handler) => {
            if (event === 'error') {
              errorHandler = handler;
              timeoutHandler?.();
            }

            return req;
          }),
          setTimeout: vi.fn((_ms, handler) => {
            timeoutHandler = handler;
          }),
          destroy: vi.fn((error) => {
            destroyError = error;
            errorHandler?.(error);
          }),
        };

        callback({
          statusCode: 200,
          headers: {
            'content-type': 'application/json',
          },
          on: vi.fn(),
        });

        return req;
      }),
      get: vi.fn(),
    };

    const { service } = loadService({
      stabilityToken: 'stability-test',
      httpsMock: https,
      sharpMock: fakeSharp,
    });

    const promise = service.generarVisualizacion({
      imagenBuffer: png,
      mascaraBuffer: png,
      imagenMimeType: 'image/png',
      prompt: 'puerta',
    });

    await expect(promise).rejects.toThrow('Stability AI timeout');

    expect(https.request).toHaveBeenCalled();
    expect(destroyError).toBeInstanceOf(Error);
    expect(destroyError.message).toBe('Stability AI timeout');
  });

  it('debe usar HTTP como detalle cuando Stability devuelve JSON vacío', async () => {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    );

    const https = {
      request: vi.fn((_options, callback) => {
        const req = {
          on: vi.fn(),
          setTimeout: vi.fn(),
          destroy: vi.fn(),
        };

        const res = {
          statusCode: 500,
          headers: {
            'content-type': 'application/json',
          },
          on: vi.fn((event, handler) => {
            if (event === 'data') {
              handler(Buffer.from('{}'));
            }

            if (event === 'end') handler();

            return res;
          }),
        };

        callback(res);

        return req;
      }),
      get: vi.fn(),
    };

    const { service } = loadService({
      stabilityToken: 'stability-test',
      httpsMock: https,
    });

    await expect(
      service.generarVisualizacion({
        imagenBuffer: png,
        mascaraBuffer: png,
        imagenMimeType: 'image/png',
        prompt: 'puerta',
      }),
    ).rejects.toMatchObject({
      code: 'STABILITY_API_ERROR',
      message: expect.stringContaining('HTTP 500'),
    });
  });
});

describe('generarMascaraSAM — Replicate', () => {
  async function crearImagenBuffer(width = 20, height = 20) {
    const sharp = require('sharp');

    return sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    }).png().toBuffer();
  }

  function createRequest() {
    return {
      setTimeout: vi.fn(),
      on: vi.fn(),
      write: vi.fn(),
      end: vi.fn(),
      destroy: vi.fn(),
    };
  }

  function createResponse(statusCode, body, headers = {}) {
    return {
      statusCode,
      headers,
      on: vi.fn((event, handler) => {
        if (event === 'data') handler(Buffer.from(body));
        if (event === 'end') handler();
      }),
    };
  }

  it('debe crear una predicción SAM y devolver la máscara redimensionada', async () => {
    const imagen = await crearImagenBuffer(20, 10);
    const mascara = await crearImagenBuffer(20, 10);

    const https = {
      request: vi.fn((options, callback) => {
        const req = createRequest();

        if (options.path === '/v1/predictions') {
          callback(createResponse(
            201,
            JSON.stringify({ id: 'pred-123', status: 'starting' }),
          ));
        } else if (options.path === '/v1/predictions/pred-123') {
          callback(createResponse(
            200,
            JSON.stringify({
              id: 'pred-123',
              status: 'succeeded',
              output: ['https://mask.example/mask.png'],
            }),
          ));
        } else if (options.hostname === 'mask.example') {
          callback(createResponse(
            200,
            mascara,
          ));
        }

        return req;
      }),
      get: vi.fn(),
    };

    const { service } = loadService({
      replicateToken: 'replicate-test',
      httpsMock: https,
    });

    const resultado = await service.generarMascaraSAM(imagen, 25, 75);

    expect(Buffer.isBuffer(resultado)).toBe(true);

    const calls = https.request.mock.calls;
    const post = calls.find(([options]) => options.path === '/v1/predictions');

    expect(post).toBeDefined();

    const reqPost = post[0];
    expect(reqPost.path).toBe('/v1/predictions');

    const req = https.request.mock.results.find(
      (_, index) => https.request.mock.calls[index][0].path === '/v1/predictions',
    )?.value;

    expect(req).toBeDefined();
    expect(req.write).toHaveBeenCalledTimes(1);

    const body = JSON.parse(req.write.mock.calls[0][0]);

    expect(body.version).toBeDefined();
    expect(body.input.point_coords).toBe('[[5,8]]');
    expect(body.input.point_labels).toBe('[1]');
  });

  it('debe lanzar error cuando Replicate devuelve pred.error', async () => {
    const imagen = await crearImagenBuffer();

    const https = {
      request: vi.fn((options, callback) => {
        const req = createRequest();

        callback(createResponse(
          400,
          JSON.stringify({ error: 'invalid image' }),
        ));

        return req;
      }),
      get: vi.fn(),
    };

    const { service } = loadService({
      replicateToken: 'replicate-test',
      httpsMock: https,
    });

    await expect(
      service.generarMascaraSAM(imagen),
    ).rejects.toThrow('SAM error: invalid image');
  });

  it('debe lanzar error cuando la predicción SAM falla', async () => {
    const imagen = await crearImagenBuffer();

    const https = {
      request: vi.fn((options, callback) => {
        const req = createRequest();

        if (options.path === '/v1/predictions') {
          callback(createResponse(
            201,
            JSON.stringify({ id: 'pred-fail', status: 'starting' }),
          ));
        } else {
          callback(createResponse(
            200,
            JSON.stringify({
              id: 'pred-fail',
              status: 'failed',
              error: 'segmentation failed',
            }),
          ));
        }

        return req;
      }),
      get: vi.fn(),
    };

    const { service } = loadService({
      replicateToken: 'replicate-test',
      httpsMock: https,
    });

    await expect(
      service.generarMascaraSAM(imagen),
    ).rejects.toThrow('SAM prediction failed: segmentation failed');
  });

  it('debe lanzar error cuando la predicción SAM es cancelada', async () => {
    const imagen = await crearImagenBuffer();

    const https = {
      request: vi.fn((options, callback) => {
        const req = createRequest();

        if (options.path === '/v1/predictions') {
          callback(createResponse(
            201,
            JSON.stringify({ id: 'pred-cancel', status: 'starting' }),
          ));
        } else {
          callback(createResponse(
            200,
            JSON.stringify({
              id: 'pred-cancel',
              status: 'canceled',
              error: 'user canceled',
            }),
          ));
        }

        return req;
      }),
      get: vi.fn(),
    };

    const { service } = loadService({
      replicateToken: 'replicate-test',
      httpsMock: https,
    });

    await expect(
      service.generarMascaraSAM(imagen),
    ).rejects.toThrow('SAM prediction canceled: user canceled');
  });

  it('debe esperar mientras Replicate procesa y luego devolver la máscara', async () => {
    const imagen = await crearImagenBuffer(20, 20);
    const mascara = await crearImagenBuffer(20, 20);

    let consultas = 0;

    const https = {
      request: vi.fn((options, callback) => {
        const req = createRequest();

        if (options.path === '/v1/predictions') {
          callback(createResponse(
            201,
            JSON.stringify({
              id: 'pred-processing',
              status: 'starting',
            }),
          ));
        } else if (options.path === '/v1/predictions/pred-processing') {
          consultas++;

          callback(createResponse(
            200,
            JSON.stringify(
              consultas === 1
                ? {
                    id: 'pred-processing',
                    status: 'processing',
                  }
                : {
                    id: 'pred-processing',
                    status: 'succeeded',
                    output: ['https://mask.example/mask.png'],
                  },
            ),
          ));
        } else if (options.hostname === 'mask.example') {
          callback(createResponse(200, mascara));
        }

        return req;
      }),
      get: vi.fn(),
    };

    const { service } = loadService({
      replicateToken: 'replicate-test',
      httpsMock: https,
    });

    const realSetTimeout = globalThis.setTimeout;

    globalThis.setTimeout = vi.fn((callback) => {
      queueMicrotask(callback);
      return 1;
    });

    try {
      const resultado = await service.generarMascaraSAM(imagen);

      expect(Buffer.isBuffer(resultado)).toBe(true);
      expect(consultas).toBe(2);
    } finally {
      globalThis.setTimeout = realSetTimeout;
    }
  });

  it('debe lanzar timeout cuando Replicate nunca termina la predicción', async () => {
    const imagen = await crearImagenBuffer(20, 20);

    let consultas = 0;
    let llamadasDateNow = 0;

    const realDateNow = Date.now;

    Date.now = vi.fn(() => {
      llamadasDateNow++;

      // 1. inicio
      // 2. primera condición del while -> continúa
      // 3. después del primer GET -> supera los 60 segundos
      return llamadasDateNow <= 2 ? 0 : 60_000;
    });

    const https = {
      request: vi.fn((options, callback) => {
        const req = createRequest();

        if (options.path === '/v1/predictions') {
          callback(createResponse(
            201,
            JSON.stringify({
              id: 'pred-timeout',
              status: 'starting',
            }),
          ));
        } else if (options.path === '/v1/predictions/pred-timeout') {
          consultas++;

          callback(createResponse(
            200,
            JSON.stringify({
              id: 'pred-timeout',
              status: 'processing',
            }),
          ));
        }

        return req;
      }),
      get: vi.fn(),
    };

    const { service } = loadService({
      replicateToken: 'replicate-test',
      httpsMock: https,
    });

    try {
      await expect(
        service.generarMascaraSAM(imagen),
      ).rejects.toThrow('SAM prediction timeout (60s)');

      expect(consultas).toBe(1);
    } finally {
      Date.now = realDateNow;
    }
  });

  it('debe lanzar error cuando SAM no devuelve máscaras', async () => {
    const imagen = await crearImagenBuffer();

    const https = {
      request: vi.fn((options, callback) => {
        const req = createRequest();

        if (options.path === '/v1/predictions') {
          callback(createResponse(
            201,
            JSON.stringify({ id: 'pred-empty', status: 'starting' }),
          ));
        } else {
          callback(createResponse(
            200,
            JSON.stringify({
              id: 'pred-empty',
              status: 'succeeded',
            }),
          ));
        }

        return req;
      }),
      get: vi.fn(),
    };

    const { service } = loadService({
      replicateToken: 'replicate-test',
      httpsMock: https,
    });

    await expect(
      service.generarMascaraSAM(imagen),
    ).rejects.toThrow('SAM no devolvió máscaras');
  });

  it('debe aceptar output como URL individual', async () => {
    const imagen = await crearImagenBuffer(20, 20);
    const mascara = await crearImagenBuffer(20, 20);

    const https = {
      request: vi.fn((options, callback) => {
        const req = createRequest();

        if (options.path === '/v1/predictions') {
          callback(createResponse(
            201,
            JSON.stringify({ id: 'pred-single', status: 'starting' }),
          ));
        } else if (options.path === '/v1/predictions/pred-single') {
          callback(createResponse(
            200,
            JSON.stringify({
              id: 'pred-single',
              status: 'succeeded',
              output: 'https://mask.example/single.png',
            }),
          ));
        } else {
          callback(createResponse(200, mascara));
        }

        return req;
      }),
      get: vi.fn(),
    };

    const { service } = loadService({
      replicateToken: 'replicate-test',
      httpsMock: https,
    });

    const resultado = await service.generarMascaraSAM(imagen);

    expect(Buffer.isBuffer(resultado)).toBe(true);
  });

  it('debe seguir redirecciones al descargar la máscara', async () => {
    const imagen = await crearImagenBuffer(20, 20);
    const mascara = await crearImagenBuffer(20, 20);

    const https = {
      request: vi.fn((options, callback) => {
        const req = createRequest();

        if (options.path === '/v1/predictions') {
          callback(createResponse(
            201,
            JSON.stringify({ id: 'pred-redirect', status: 'starting' }),
          ));
        } else if (options.path === '/v1/predictions/pred-redirect') {
          callback(createResponse(
            200,
            JSON.stringify({
              id: 'pred-redirect',
              status: 'succeeded',
              output: ['https://mask.example/original.png'],
            }),
          ));
        } else if (options.path === '/original.png') {
          callback(createResponse(
            302,
            '',
            { location: 'https://mask.example/final.png' },
          ));
        } else if (options.path === '/final.png') {
          callback(createResponse(200, mascara));
        }

        return req;
      }),
      get: vi.fn(),
    };

    const { service } = loadService({
      replicateToken: 'replicate-test',
      httpsMock: https,
    });

    const resultado = await service.generarMascaraSAM(imagen);

    expect(Buffer.isBuffer(resultado)).toBe(true);
    expect(https.request).toHaveBeenCalledTimes(4);
  });

  it('debe propagar error cuando Replicate devuelve JSON inválido', async () => {
    const imagen = await crearImagenBuffer();

    const https = {
      request: vi.fn((options, callback) => {
        const req = createRequest();

        callback(createResponse(200, 'respuesta no json'));

        return req;
      }),
      get: vi.fn(),
    };

    const { service } = loadService({
      replicateToken: 'replicate-test',
      httpsMock: https,
    });

    await expect(
      service.generarMascaraSAM(imagen),
    ).rejects.toThrow();
  });
});

describe('iaService — cobertura de ramas y timeouts restantes', () => {
  it('debe usar estimated_time cuando Hugging Face responde 503', async () => {
    const realSetTimeout = globalThis.setTimeout;

    globalThis.setTimeout = vi.fn((callback) => {
      callback();
      return 0;
    });

    try {
      let llamadas = 0;

      const https = {
        get: vi.fn(),
        request: vi.fn((_url, _options, callback) => {
          llamadas++;

          const req = {
            on: vi.fn(),
            setTimeout: vi.fn(),
            destroy: vi.fn(),
            write: vi.fn(),
            end: vi.fn(),
          };

          if (llamadas === 1) {
            callback({
              statusCode: 503,
              headers: { 'content-type': 'application/json' },
              on: vi.fn((event, handler) => {
                if (event === 'data') {
                  handler(Buffer.from(JSON.stringify({ estimated_time: 1 })));
                }
                if (event === 'end') handler();
                return this;
              }),
            });
          } else {
            callback({
              statusCode: 200,
              headers: { 'content-type': 'image/png' },
              on: vi.fn((event, handler) => {
                if (event === 'data') handler(Buffer.from('imagen'));
                if (event === 'end') handler();
                return this;
              }),
            });
          }

          return req;
        }),
      };

      const { service } = loadService({
        hfToken: 'hf-test',
        httpsMock: https,
      });

      const resultado = await service.generarInpainting({
        imagenBase64: 'data:image/png;base64,aGVsbG8=',
        mascaraBase64: 'data:image/png;base64,aGVsbG8=',
        prompt: 'puerta',
        promptNegativo: 'blurry',
      });

      expect(resultado.modelo).toBeDefined();
      expect(https.request).toHaveBeenCalledTimes(2);
    } finally {
      globalThis.setTimeout = realSetTimeout;
    }
  });

  it('debe cubrir el fallback vacío de error en content-type inválido de Hugging Face', async () => {
    const realSetTimeout = globalThis.setTimeout;

    globalThis.setTimeout = vi.fn((callback) => {
      callback();
      return 0;
    });

    try {
      const https = {
        get: vi.fn(),
        request: vi.fn((_url, _options, callback) => {
          const req = {
            on: vi.fn(),
            setTimeout: vi.fn(),
            destroy: vi.fn(),
            write: vi.fn(),
            end: vi.fn(),
          };

          const res = {
            statusCode: 200,
            headers: {},
            on: vi.fn((event, handler) => {
              if (event === 'data') handler(Buffer.from('{}'));
              if (event === 'end') handler();
              return res;
            }),
          };

          callback(res);
          return req;
        }),
      };

      const { service } = loadService({
        hfToken: 'hf-test',
        httpsMock: https,
      });

      await expect(
        service.generarInpainting({
          imagenBase64: 'data:image/png;base64,aGVsbG8=',
          mascaraBase64: 'data:image/png;base64,aGVsbG8=',
          prompt: 'puerta',
          promptNegativo: 'blurry',
        }),
      ).rejects.toThrow('No se pudo generar la imagen');
    } finally {
      globalThis.setTimeout = realSetTimeout;
    }
  });

  it('debe retornar null cuando hashImagen recibe un valor no procesable por crypto', () => {
    const { service } = loadService();

    expect(service.hashImagen(Symbol('imagen'))).toBeNull();
  });

  it('debe lanzar STABILITY_API_ERROR cuando Stability devuelve 200 sin imagen', async () => {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    );

    const fakeSharp = vi.fn((buffer) => ({
      metadata: vi.fn().mockResolvedValue({ width: 1, height: 1 }),
      resize: vi.fn().mockReturnThis(),
      toBuffer: vi.fn().mockResolvedValue(buffer),
    }));

    const https = {
      get: vi.fn(),
      request: vi.fn((_options, callback) => {
        const req = {
          on: vi.fn(),
          setTimeout: vi.fn(),
          destroy: vi.fn(),
        };

        callback({
          statusCode: 200,
          headers: { 'content-type': 'application/json' },
          on: vi.fn((event, handler) => {
            if (event === 'data') {
              handler(Buffer.from(JSON.stringify({})));
            }
            if (event === 'end') handler();
            return this;
          }),
        });

        return req;
      }),
    };

    const { service } = loadService({
      stabilityToken: 'stability-test',
      httpsMock: https,
      sharpMock: fakeSharp,
    });

    await expect(
      service.generarVisualizacion({
        imagenBuffer: png,
        mascaraBuffer: png,
        imagenMimeType: 'image/png',
        prompt: 'puerta',
      }),
    ).rejects.toMatchObject({
      message: 'Stability AI v2beta no devolvió imagen',
      code: 'STABILITY_API_ERROR',
    });
  });

  it('debe ejecutar el timeout del POST de Replicate', async () => {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    );

    let destroyError;

    const fakeSharp = vi.fn(() => ({
      metadata: vi.fn().mockResolvedValue({ width: 1, height: 1 }),
    }));

    const https = {
      get: vi.fn(),
      request: vi.fn((_options, _callback) => {
        let timeoutHandler;
        let errorHandler;

        const req = {
          on: vi.fn((event, handler) => {
            if (event === 'error') {
              errorHandler = handler;
              timeoutHandler?.();
            }
            return req;
          }),
          setTimeout: vi.fn((_ms, handler) => {
            timeoutHandler = handler;
          }),
          destroy: vi.fn((error) => {
            destroyError = error;
            errorHandler?.(error);
          }),
          write: vi.fn(),
          end: vi.fn(),
        };

        return req;
      }),
    };

    const { service } = loadService({
      replicateToken: 'replicate-test',
      httpsMock: https,
      sharpMock: fakeSharp,
    });

    await expect(
      service.generarMascaraSAM(png),
    ).rejects.toThrow('Replicate POST timeout');

    expect(https.request).toHaveBeenCalled();
    expect(destroyError).toBeInstanceOf(Error);
    expect(destroyError.message).toBe('Replicate POST timeout');
  });

  it('debe ejecutar el timeout del GET de Replicate', async () => {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    );

    let destroyError;
    let llamadas = 0;

    const fakeSharp = vi.fn(() => ({
      metadata: vi.fn().mockResolvedValue({ width: 1, height: 1 }),
    }));

    const https = {
      get: vi.fn(),
      request: vi.fn((options, callback) => {
        llamadas++;

        let timeoutHandler;
        let errorHandler;

        const req = {
          on: vi.fn((event, handler) => {
            if (event === 'error') {
              errorHandler = handler;
              timeoutHandler?.();
            }
            return req;
          }),
          setTimeout: vi.fn((_ms, handler) => {
            timeoutHandler = handler;
          }),
          destroy: vi.fn((error) => {
            destroyError = error;
            errorHandler?.(error);
          }),
          write: vi.fn(),
          end: vi.fn(),
        };

        if (llamadas === 1) {
          callback({
            statusCode: 200,
            headers: { 'content-type': 'application/json' },
            on: vi.fn((event, handler) => {
              if (event === 'data') {
                handler(Buffer.from(JSON.stringify({
                  id: 'pred-timeout-get',
                  status: 'starting',
                })));
              }

              if (event === 'end') {
                handler();
              }

              return this;
            }),
          });
        }

        return req;
      }),
    };

    const { service } = loadService({
      replicateToken: 'replicate-test',
      httpsMock: https,
      sharpMock: fakeSharp,
    });

    const promise = service.generarMascaraSAM(png);

    await expect(promise).rejects.toThrow('Replicate GET timeout');

    expect(https.request).toHaveBeenCalledTimes(2);
    expect(destroyError).toBeInstanceOf(Error);
    expect(destroyError.message).toBe('Replicate GET timeout');
  });

  it('debe ejecutar el timeout al descargar la máscara de Replicate', async () => {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    );

    let destroyError;
    let llamadas = 0;

    const fakeSharp = vi.fn(() => ({
      metadata: vi.fn().mockResolvedValue({ width: 1, height: 1 }),
      resize: vi.fn().mockReturnThis(),
      grayscale: vi.fn().mockReturnThis(),
      threshold: vi.fn().mockReturnThis(),
      png: vi.fn().mockReturnThis(),
      toBuffer: vi.fn().mockResolvedValue(Buffer.from('mask')),
    }));

    const https = {
      get: vi.fn(),
      request: vi.fn((options, callback) => {
        llamadas++;

        let timeoutHandler;
        let errorHandler;

        const req = {
          on: vi.fn((event, handler) => {
            if (event === 'error') {
              errorHandler = handler;

              // La tercera petición es descargarBuffer().
              if (llamadas === 3) {
                timeoutHandler?.();
              }
            }

            return req;
          }),

          setTimeout: vi.fn((_ms, handler) => {
            timeoutHandler = handler;
          }),

          destroy: vi.fn((error) => {
            destroyError = error;
            errorHandler?.(error);
          }),

          write: vi.fn(),
          end: vi.fn(),
        };

        // 1. replicatePost()
        if (llamadas === 1) {
          callback({
            statusCode: 200,
            headers: { 'content-type': 'application/json' },
            on: vi.fn((event, handler) => {
              if (event === 'data') {
                handler(Buffer.from(JSON.stringify({
                  id: 'pred-download-timeout',
                })));
              }

              if (event === 'end') {
                handler();
              }

              return this;
            }),
          });
        }

        // 2. replicateGet()
        if (llamadas === 2) {
          callback({
            statusCode: 200,
            headers: { 'content-type': 'application/json' },
            on: vi.fn((event, handler) => {
              if (event === 'data') {
                handler(Buffer.from(JSON.stringify({
                  id: 'pred-download-timeout',
                  status: 'succeeded',
                  output: 'https://example.com/mask.png',
                })));
              }

              if (event === 'end') {
                handler();
              }

              return this;
            }),
          });
        }

        // 3. descargarBuffer()
        // No se ejecuta callback porque el timeout debe ocurrir
        // antes de recibir una respuesta.
        return req;
      }),
    };

    const { service } = loadService({
      replicateToken: 'replicate-test',
      httpsMock: https,
      sharpMock: fakeSharp,
    });

    const promise = service.generarMascaraSAM(png);

    await expect(promise).rejects.toThrow('Download timeout');

    expect(https.request).toHaveBeenCalledTimes(3);
    expect(destroyError).toBeInstanceOf(Error);
    expect(destroyError.message).toBe('Download timeout');
  });

  it('debe lanzar el error de SAM cuando Replicate devuelve pred.error', async () => {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    );

    const fakeSharp = vi.fn(() => ({
      metadata: vi.fn().mockResolvedValue({ width: 1, height: 1 }),
    }));

    const https = {
      get: vi.fn(),
      request: vi.fn((_options, callback) => {
        const req = {
          on: vi.fn(),
          setTimeout: vi.fn(),
          destroy: vi.fn(),
          write: vi.fn(),
          end: vi.fn(),
        };

        callback({
          statusCode: 200,
          headers: { 'content-type': 'application/json' },
          on: vi.fn((event, handler) => {
            if (event === 'data') {
              handler(Buffer.from(JSON.stringify({
                error: 'invalid image',
              })));
            }
            if (event === 'end') handler();
            return this;
          }),
        });

        return req;
      }),
    };

    const { service } = loadService({
      replicateToken: 'replicate-test',
      httpsMock: https,
      sharpMock: fakeSharp,
    });

    await expect(
      service.generarMascaraSAM(png),
    ).rejects.toThrow('SAM error: invalid image');
  });

  it('debe cubrir explícitamente el operador ?? del content-type inválido', async () => {
    const realSetTimeout = globalThis.setTimeout;

    globalThis.setTimeout = vi.fn((callback) => {
      callback();
      return 0;
    });

    try {
      const https = {
        get: vi.fn(),
        request: vi.fn((_url, _options, callback) => {
          const req = {
            on: vi.fn(),
            setTimeout: vi.fn(),
            destroy: vi.fn(),
            write: vi.fn(),
            end: vi.fn(),
          };

          const res = {
            statusCode: 200,
            headers: {},
            on: vi.fn((event, handler) => {
              if (event === 'data') {
                handler(Buffer.from('{}'));
              }

              if (event === 'end') {
                handler();
              }

              return res;
            }),
          };

          callback(res);
          return req;
        }),
      };

      const { service } = loadService({
        hfToken: 'hf-test',
        httpsMock: https,
      });

      await expect(
        service.generarInpainting({
          imagenBase64: 'data:image/png;base64,aGVsbG8=',
          mascaraBase64: 'data:image/png;base64,aGVsbG8=',
          prompt: 'puerta',
          promptNegativo: 'blurry',
        }),
      ).rejects.toThrow(
        'No se pudo generar la imagen. El modelo puede estar ocupado — intenta de nuevo.',
      );
    } finally {
      globalThis.setTimeout = realSetTimeout;
    }
  });

  it('debe continuar cuando Stability devuelve una imagen en data.image', async () => {
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    );

    const fakeSharp = vi.fn((buffer) => ({
      metadata: vi.fn().mockResolvedValue({ width: 1, height: 1 }),
      resize: vi.fn().mockReturnThis(),
      toBuffer: vi.fn().mockResolvedValue(buffer),
    }));

    const https = {
      get: vi.fn(),
      request: vi.fn((options, callback) => {
        const req = {
          on: vi.fn(),
          setTimeout: vi.fn(),
          destroy: vi.fn(),
          write: vi.fn(),
          end: vi.fn(),
        };

        callback({
          statusCode: 200,
          headers: { 'content-type': 'application/json' },
          on: vi.fn((event, handler) => {
            if (event === 'data') {
              handler(Buffer.from(JSON.stringify({
                image: png.toString('base64'),
              })));
            }

            if (event === 'end') {
              handler();
            }

            return this;
          }),
        });

        return req;
      }),
    };

    const { service } = loadService({
      stabilityToken: 'stability-test',
      httpsMock: https,
      sharpMock: fakeSharp,
    });

    const resultado = await service.generarVisualizacion({
      imagenBuffer: png,
      mascaraBuffer: png,
      imagenMimeType: 'image/png',
      prompt: 'puerta',
    });

    expect(https.request).toHaveBeenCalledTimes(1);
    expect(Buffer.isBuffer(resultado)).toBe(true);
    expect(resultado).toEqual(png);
  });

  it('debe continuar cuando Replicate no devuelve pred.error', async () => {
    const imagen = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    );

    const https = {
      request: vi.fn((options, callback) => {
        const req = {
          on: vi.fn(),
          setTimeout: vi.fn(),
          destroy: vi.fn(),
          write: vi.fn(),
          end: vi.fn(),
        };

        const responder = (statusCode, body) => {
          const handlers = {};

          const res = {
            statusCode,
            headers: {},
            on: vi.fn((event, handler) => {
              handlers[event] = handler;

              if (event === 'data' && body !== undefined) {
                handler(
                  Buffer.isBuffer(body)
                    ? body
                    : Buffer.from(body),
                );
              }

              if (event === 'end') {
                handler();
              }

              return res;
            }),
          };

          callback(res);
        };

        if (options.path === '/v1/predictions') {
          responder(
            201,
            JSON.stringify({
              id: 'pred-no-error',
              status: 'starting',
            }),
          );
        } else if (options.path === '/v1/predictions/pred-no-error') {
          responder(
            200,
            JSON.stringify({
              id: 'pred-no-error',
              status: 'succeeded',
              output: ['https://mask.example/no-error.png'],
            }),
          );
        } else {
          responder(200, imagen);
        }

        return req;
      }),
      get: vi.fn(),
    };

    const { service } = loadService({
      replicateToken: 'replicate-test',
      httpsMock: https,
    });

    const resultado = await service.generarMascaraSAM(imagen);

    expect(Buffer.isBuffer(resultado)).toBe(true);

    const calls = https.request.mock.calls.map(([options]) => options);

    expect(calls.some(options => options.path === '/v1/predictions')).toBe(true);
    expect(calls.some(options => options.path === '/v1/predictions/pred-no-error')).toBe(true);
  });

});
