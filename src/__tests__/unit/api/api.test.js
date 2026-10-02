import { describe, expect, it, beforeEach } from 'vitest';
import api from '@/presentation/api/api';

const setCookie = (value) => {
  Object.defineProperty(document, 'cookie', {
    configurable: true,
    get: () => value,
  });
};

describe('api', () => {
  beforeEach(() => {
    setCookie('');
  });

  it('configura axios con baseURL, timeout y credenciales', () => {
    expect(api.defaults.baseURL).toBe('/api');
    expect(api.defaults.timeout).toBe(10000);
    expect(api.defaults.withCredentials).toBe(true);
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('no agrega CSRF a GET', async () => {
    setCookie('csrf-token=abc123');

    const config = await api.interceptors.request.handlers[0].fulfilled({
      method: 'get',
      headers: {},
    });

    expect(config.headers['X-CSRF-Token']).toBeUndefined();
  });

  it('agrega CSRF a POST cuando existe la cookie', async () => {
    setCookie('csrf-token=abc123');

    const config = await api.interceptors.request.handlers[0].fulfilled({
      method: 'post',
      headers: {},
    });

    expect(config.headers['X-CSRF-Token']).toBe('abc123');
  });

  it('agrega CSRF a PUT, PATCH y DELETE', async () => {
    setCookie('csrf-token=token456');

    for (const method of ['put', 'patch', 'delete']) {
      const config = await api.interceptors.request.handlers[0].fulfilled({
        method,
        headers: {},
      });

      expect(config.headers['X-CSRF-Token']).toBe('token456');
    }
  });

  it('no agrega CSRF si no existe la cookie', async () => {
    const config = await api.interceptors.request.handlers[0].fulfilled({
      method: 'post',
      headers: {},
    });

    expect(config.headers['X-CSRF-Token']).toBeUndefined();
  });

  it('elimina Content-Type cuando el body es FormData', async () => {
    const config = await api.interceptors.request.handlers[0].fulfilled({
      method: 'post',
      data: new FormData(),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(config.headers['Content-Type']).toBeUndefined();
  });

  it('conserva Content-Type para datos normales', async () => {
    const config = await api.interceptors.request.handlers[0].fulfilled({
      method: 'post',
      data: { nombre: 'Material' },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(config.headers['Content-Type']).toBe('application/json');
  });

  it('propaga respuestas exitosas sin modificarlas', () => {
    const response = { status: 200, data: { ok: true } };
    const handler = api.interceptors.response.handlers[0];

    expect(handler.fulfilled(response)).toBe(response);
  });

  it('propaga errores sin modificarlos', async () => {
    const error = new Error('Error de red');
    const handler = api.interceptors.response.handlers[0];

    await expect(handler.rejected(error)).rejects.toBe(error);
  });
});
