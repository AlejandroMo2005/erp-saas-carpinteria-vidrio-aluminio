import { describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import Module from 'node:module';

const require = createRequire(import.meta.url);

const preloadPath = require.resolve(`${process.cwd()}/src/config/preload.js`);
const staticCachePath = require.resolve(
  `${process.cwd()}/src/shared/middleware/staticCache.js`
);

const mockPreload = {
  buildPath: '/tmp/test-build',
};

const originalLoad = Module._load;

delete require.cache[staticCachePath];
delete require.cache[preloadPath];

Module._load = function (request, parent, isMain) {
  if (request === '../../config/preload' || request === preloadPath) {
    return mockPreload;
  }

  return originalLoad.call(this, request, parent, isMain);
};

const {
  cacheHeaders,
  referenciasStatic,
  buildStatic,
  publicStatic,
} = require(staticCachePath);

Module._load = originalLoad;

const createResponse = () => ({
  setHeader: vi.fn(),
});

const createRequest = (path) => ({
  path,
});

describe('cacheHeaders', () => {
  it('debe aplicar no-store a rutas API', () => {
    const req = createRequest('/api/clientes');
    const res = createResponse();
    const next = vi.fn();

    cacheHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    expect(res.setHeader).toHaveBeenCalledWith('Pragma', 'no-cache');
    expect(res.setHeader).toHaveBeenCalledWith('Expires', '0');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('debe aplicar cache inmutable a JavaScript con nombre hasheado', () => {
    const req = createRequest('/assets/app.a1b2c3d4.js');
    const res = createResponse();
    const next = vi.fn();

    cacheHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('debe aplicar cache inmutable a CSS con nombre hasheado', () => {
    const req = createRequest('/assets/styles-ABC123.css');
    const res = createResponse();
    const next = vi.fn();

    cacheHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('debe reconocer archivos chunk.js con nombre hasheado', () => {
    const req = createRequest('/assets/vendor-abc123.chunk.js');
    const res = createResponse();
    const next = vi.fn();

    cacheHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('debe aplicar una hora de cache a JavaScript no hasheado', () => {
    const req = createRequest('/assets/app.js');
    const res = createResponse();
    const next = vi.fn();

    cacheHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'public, max-age=3600'
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('debe aplicar una hora de cache a CSS no hasheado', () => {
    const req = createRequest('/assets/styles.css');
    const res = createResponse();
    const next = vi.fn();

    cacheHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'public, max-age=3600'
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it.each([
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.svg',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot',
  ])('debe aplicar un año de cache a recursos %s', (ext) => {
    const req = createRequest(`/assets/recurso${ext}`);
    const res = createResponse();
    const next = vi.fn();

    cacheHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'public, max-age=31536000'
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('debe aplicar no-cache a archivos HTML', () => {
    const req = createRequest('/pages/inicio.html');
    const res = createResponse();
    const next = vi.fn();

    cacheHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'no-cache, must-revalidate, max-age=0'
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('debe aplicar no-cache a la raíz', () => {
    const req = createRequest('/');
    const res = createResponse();
    const next = vi.fn();

    cacheHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'no-cache, must-revalidate, max-age=0'
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('debe aplicar no-cache a index.html', () => {
    const req = createRequest('/index.html');
    const res = createResponse();
    const next = vi.fn();

    cacheHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'no-cache, must-revalidate, max-age=0'
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('debe aplicar un día de cache a extensiones no especiales', () => {
    const req = createRequest('/assets/document.pdf');
    const res = createResponse();
    const next = vi.fn();

    cacheHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'public, max-age=86400'
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('debe continuar después de establecer cualquier política de cache', () => {
    const req = createRequest('/assets/archivo.txt');
    const res = createResponse();
    const next = vi.fn();

    cacheHeaders(req, res, next);

    expect(res.setHeader).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('referenciasStatic', () => {
  it('debe exportar un arreglo con middleware de headers y express.static', () => {
    expect(Array.isArray(referenciasStatic)).toBe(true);
    expect(referenciasStatic).toHaveLength(2);
    expect(typeof referenciasStatic[0]).toBe('function');
    expect(typeof referenciasStatic[1]).toBe('function');
  });

  it('debe aplicar cache inmutable al middleware de referencias', () => {
    const res = {
      setHeader: vi.fn(),
    };
    const next = vi.fn();

    referenciasStatic[0]({}, res, next);

    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    );
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('exports de archivos estáticos', () => {
  it('debe exportar buildStatic como middleware', () => {
    expect(typeof buildStatic).toBe('function');
  });

  it('debe exportar publicStatic como middleware', () => {
    expect(typeof publicStatic).toBe('function');
  });
});
