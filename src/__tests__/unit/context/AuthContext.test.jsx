import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider } from '../../../presentation/context/AuthContext';
import { useAuth } from '../../../presentation/context/useAuth';

const {
  mockApi,
  mockInterceptorUse,
  mockInterceptorEject,
  mockPost,
} = vi.hoisted(() => {
  const api = vi.fn();

  api.defaults = {
    baseURL: 'http://localhost:5000/api',
    headers: {
      common: {},
    },
  };

  api.post = vi.fn();
  api.interceptors = {
    response: {
      use: vi.fn(),
      eject: vi.fn(),
    },
  };

  return {
    mockApi: api,
    mockInterceptorUse: api.interceptors.response.use,
    mockInterceptorEject: api.interceptors.response.eject,
    mockPost: api.post,
  };
});

vi.mock('../../../presentation/api/api', () => ({
  default: mockApi,
}));

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

const createRefreshResponse = ({
  accessToken = 'refreshed-token',
  expiresIn = '15m',
  success = true,
} = {}) => ({
  ok: true,
  json: vi.fn().mockResolvedValue({
    success,
    accessToken,
    expiresIn,
  }),
});

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    mockApi.defaults.baseURL = 'http://localhost:5000/api';
    mockApi.defaults.headers.common = {};
    mockApi.mockResolvedValue({ data: 'retried' });

    mockInterceptorUse.mockReturnValue(1);
    mockInterceptorEject.mockClear();
    mockPost.mockResolvedValue({ data: { success: true } });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(createRefreshResponse())
    );
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should provide AuthContext with initial values', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.sessionExpired).toBe(false);
    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.logout).toBe('function');
    expect(typeof result.current.updateUser).toBe('function');
    expect(typeof result.current.getAccessToken).toBe('function');
  });

  it('should initialize with null user when localStorage is empty', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should remove invalid cached user JSON', () => {
    localStorage.setItem('user', '{invalid-json');

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('should initialize with cached user from localStorage', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      rol: 'ADMIN',
    };

    localStorage.setItem('user', JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should provide all role-based getters correctly', () => {
    const roles = [
      ['ADMIN', 'isAdmin'],
      ['VENDEDOR', 'isVendedor'],
      ['CLIENTE', 'isCliente'],
      ['ALMACEN', 'isAlmacen'],
      ['VISOR', 'isVisor'],
    ];

    for (const [rol, getter] of roles) {
      localStorage.setItem(
        'user',
        JSON.stringify({ id: 1, email: 'test@example.com', rol })
      );

      const { result, unmount } = renderHook(() => useAuth(), { wrapper });

      expect(result.current[getter]).toBe(true);

      unmount();
      localStorage.clear();
    }
  });

  it('should login, persist user and configure access token', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    const user = {
      id: 10,
      email: 'user@example.com',
      rol: 'VENDEDOR',
    };

    act(() => {
      result.current.login({
        user,
        accessToken: 'access-token-123',
        expiresIn: '15m',
      });
    });

    expect(result.current.user).toEqual(user);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.sessionExpired).toBe(false);
    expect(result.current.getAccessToken()).toBe('access-token-123');
    expect(localStorage.getItem('user')).toBe(JSON.stringify(user));
    expect(
      mockApi.defaults.headers.common.Authorization
    ).toBe('Bearer access-token-123');
  });

  it('should use default expiresIn when login does not provide it', () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login({
        user: { id: 1, rol: 'ADMIN' },
        accessToken: 'token-default-expiry',
      });
    });

    expect(result.current.getAccessToken()).toBe('token-default-expiry');
    expect(result.current.user).toEqual({ id: 1, rol: 'ADMIN' });
  });

  it('should update user data and persist the merged result', () => {
    const user = {
      id: 1,
      email: 'old@example.com',
      nombre: 'Usuario',
      rol: 'CLIENTE',
    };

    localStorage.setItem('user', JSON.stringify(user));

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.updateUser({
        nombre: 'Nuevo Nombre',
        telefono: '0999999999',
      });
    });

    expect(result.current.user).toEqual({
      ...user,
      nombre: 'Nuevo Nombre',
      telefono: '0999999999',
    });

    expect(JSON.parse(localStorage.getItem('user'))).toEqual({
      ...user,
      nombre: 'Nuevo Nombre',
      telefono: '0999999999',
    });
  });

  it('should clear sessionExpired with clearSessionExpired', async () => {
    const user = {
      id: 1,
      email: 'test@example.com',
      rol: 'ADMIN',
    };

    localStorage.setItem('user', JSON.stringify(user));

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
      })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.sessionExpired).toBe(true);
    });

    act(() => {
      result.current.clearSessionExpired();
    });

    expect(result.current.sessionExpired).toBe(false);
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('should refresh silently when cached user exists', async () => {
    const user = {
      id: 1,
      email: 'test@example.com',
      rol: 'ADMIN',
    };

    localStorage.setItem('user', JSON.stringify(user));

    const fetchMock = vi.fn().mockResolvedValue(
      createRefreshResponse({
        accessToken: 'silent-refresh-token',
        expiresIn: '15m',
      })
    );

    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:5000/api/auth/refresh',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
    });

    await waitFor(() => {
      expect(result.current.getAccessToken()).toBe('silent-refresh-token');
    });

    expect(result.current.user).toEqual(user);
  });

  it('should expire session when silent refresh fails', async () => {
    const user = {
      id: 1,
      email: 'test@example.com',
      rol: 'ADMIN',
    };

    localStorage.setItem('user', JSON.stringify(user));

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
      })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.sessionExpired).toBe(true);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.getAccessToken()).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('should expire session when refresh response has no access token', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 1, rol: 'ADMIN' })
    );

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          accessToken: null,
        }),
      })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.sessionExpired).toBe(true);
    });

    expect(result.current.user).toBeNull();
  });

  it('should handle an exception when parsing the refresh response', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 1, rol: 'ADMIN' })
    );

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
    });

    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(result.current.sessionExpired).toBe(true);
    });

    expect(result.current.user).toBeNull();
  });

  it('should expire session when refresh throws', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 1, rol: 'ADMIN' })
    );

    const fetchMock = vi.fn().mockRejectedValue(
      new Error('Network error')
    );

    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(result.current.sessionExpired).toBe(true);
    });

    expect(result.current.user).toBeNull();
  });

  it('should logout locally and call backend', async () => {
    const user = {
      id: 1,
      email: 'test@example.com',
      rol: 'ADMIN',
    };

    localStorage.setItem('user', JSON.stringify(user));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(mockPost).toHaveBeenCalledWith('/auth/logout');
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.getAccessToken()).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(
      mockApi.defaults.headers.common.Authorization
    ).toBeUndefined();
  });

  it('should complete local logout even when backend logout fails', async () => {
    mockPost.mockRejectedValue(new Error('Backend unavailable'));

    const user = {
      id: 1,
      email: 'test@example.com',
      rol: 'ADMIN',
    };

    localStorage.setItem('user', JSON.stringify(user));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(mockPost).toHaveBeenCalledWith('/auth/logout');
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('should react to storage logout from another tab', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login({
        user: {
          id: 1,
          email: 'test@example.com',
          rol: 'ADMIN',
        },
        accessToken: 'tab-token',
        expiresIn: '15m',
      });
    });

    expect(result.current.user).not.toBeNull();
    expect(result.current.getAccessToken()).toBe('tab-token');

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'user',
          newValue: null,
        })
      );
    });

    expect(result.current.user).toBeNull();
    expect(result.current.getAccessToken()).toBeNull();
  });

  it('should ignore storage events that do not represent logout', () => {
    const user = {
      id: 1,
      email: 'test@example.com',
      rol: 'ADMIN',
    };

    localStorage.setItem('user', JSON.stringify(user));

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: 'other-key',
          newValue: null,
        })
      );
    });

    expect(result.current.user).toEqual(user);
  });

  it('should respect refresh cooldown when document becomes visible', async () => {
    vi.useFakeTimers();

    const user = {
      id: 1,
      email: 'test@example.com',
      rol: 'ADMIN',
    };

    localStorage.setItem('user', JSON.stringify(user));

    const fetchMock = vi.fn().mockResolvedValue(
      createRefreshResponse({
        accessToken: 'visibility-token',
        expiresIn: '15m',
      })
    );

    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.getAccessToken()).toBe('visibility-token');

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.getAccessToken()).toBe('visibility-token');
  });

  it('should refresh on visibilitychange after cooldown expires', async () => {
    vi.useFakeTimers();

    const fetchMock = vi.fn().mockResolvedValue(
      createRefreshResponse({
        accessToken: 'visibility-token',
        expiresIn: '15m',
      })
    );

    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login({
        user: {
          id: 1,
          email: 'test@example.com',
          rol: 'ADMIN',
        },
        accessToken: 'initial-token',
        expiresIn: '15m',
      });
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.getAccessToken()).toBe('initial-token');

    await act(async () => {
      vi.advanceTimersByTime(30001);
    });

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.getAccessToken()).toBe('visibility-token');
  });

  it('should reuse the in-flight refresh during concurrent visibility changes', async () => {
    vi.useFakeTimers();

    let resolveFetch;

    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    vi.stubGlobal('fetch', fetchMock);

    localStorage.setItem(
      'user',
      JSON.stringify({
        id: 1,
        email: 'test@example.com',
        rol: 'ADMIN',
      })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveFetch(
        createRefreshResponse({
          accessToken: 'concurrent-visibility-token',
          expiresIn: '15m',
        })
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.current.getAccessToken()).toBe(
      'concurrent-visibility-token'
    );
  });

  it('should register and clean up the Axios response interceptor', () => {
    const { unmount } = renderHook(() => useAuth(), { wrapper });

    expect(mockInterceptorUse).toHaveBeenCalledTimes(1);
    expect(mockInterceptorUse).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function)
    );

    unmount();

    expect(mockInterceptorEject).toHaveBeenCalledWith(1);
  });

  it('should pass successful Axios responses through the interceptor', () => {
    let successHandler;

    mockInterceptorUse.mockImplementation((onFulfilled) => {
      successHandler = onFulfilled;
      return 7;
    });

    renderHook(() => useAuth(), { wrapper });

    const response = { data: { success: true } };

    expect(successHandler(response)).toEqual(response);
  });

  it('should reject non-401 Axios errors without refreshing', async () => {
    let errorHandler;

    mockInterceptorUse.mockImplementation((_, onRejected) => {
      errorHandler = onRejected;
      return 8;
    });

    renderHook(() => useAuth(), { wrapper });

    const error = {
      response: { status: 500 },
      config: { url: '/api/test' },
    };

    await expect(errorHandler(error)).rejects.toBe(error);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should reject an already retried 401 without refreshing', async () => {
    let errorHandler;

    mockInterceptorUse.mockImplementation((_, onRejected) => {
      errorHandler = onRejected;
      return 9;
    });

    renderHook(() => useAuth(), { wrapper });

    const error = {
      response: { status: 401 },
      config: {
        url: '/api/test',
        _retry: true,
      },
    };

    await expect(errorHandler(error)).rejects.toBe(error);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should expire session when refresh or login itself returns 401', async () => {
    let errorHandler;

    mockInterceptorUse.mockImplementation((_, onRejected) => {
      errorHandler = onRejected;
      return 10;
    });

    localStorage.setItem(
      'user',
      JSON.stringify({ id: 1, rol: 'ADMIN' })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    const error = {
      response: { status: 401 },
      config: {
        url: '/auth/refresh',
      },
    };

    await act(async () => {
      await expect(errorHandler(error)).rejects.toBe(error);
    });

    await waitFor(() => {
      expect(result.current.sessionExpired).toBe(true);
    });

    expect(result.current.user).toBeNull();
  });

  it('should refresh and retry a request after a 401', async () => {
    let errorHandler;

    mockInterceptorUse.mockImplementation((_, onRejected) => {
      errorHandler = onRejected;
      return 11;
    });

    mockApi.mockResolvedValue({ data: 'retried' });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createRefreshResponse({
          accessToken: 'retry-token',
          expiresIn: '15m',
        })
      )
    );

    renderHook(() => useAuth(), { wrapper });

    const originalRequest = {
      url: '/api/protected',
      headers: {},
    };

    const error = {
      response: { status: 401 },
      config: originalRequest,
    };

    const promise = errorHandler(error);

    await expect(promise).resolves.toEqual({ data: 'retried' });

    expect(originalRequest._retry).toBe(true);
    expect(originalRequest.headers.Authorization).toBe(
      'Bearer retry-token'
    );
    expect(mockApi).toHaveBeenCalledWith(originalRequest);
  });

  it('should expire session when 401 refresh fails', async () => {
    let errorHandler;

    mockInterceptorUse.mockImplementation((_, onRejected) => {
      errorHandler = onRejected;
      return 12;
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
      })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    const error = {
      response: { status: 401 },
      config: {
        url: '/api/protected',
        headers: {},
      },
    };

    await act(async () => {
      await expect(errorHandler(error)).rejects.toBe(error);
    });

    await waitFor(() => {
      expect(result.current.sessionExpired).toBe(true);
    });
  });

  it('should expose no authentication when user is null', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isVendedor).toBe(false);
    expect(result.current.isCliente).toBe(false);
    expect(result.current.isAlmacen).toBe(false);
    expect(result.current.isVisor).toBe(false);
  });

  it('should throw when useAuth is used outside AuthProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => { });

    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth debe usarse dentro de AuthProvider'
    );

    spy.mockRestore();
  });

  it('should keep loading false because authentication is initialized synchronously', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(false);
  });
  it('should parse expiresIn in hours when scheduling proactive refresh', () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login({
        user: { id: 1, rol: 'ADMIN' },
        accessToken: 'hour-token',
        expiresIn: '2h',
      });
    });

    expect(result.current.getAccessToken()).toBe('hour-token');
    expect(vi.getTimerCount()).toBeGreaterThan(0);
  });

  it('should parse expiresIn in seconds when scheduling proactive refresh', () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login({
        user: { id: 1, rol: 'ADMIN' },
        accessToken: 'second-token',
        expiresIn: '20s',
      });
    });

    expect(result.current.getAccessToken()).toBe('second-token');
    expect(vi.getTimerCount()).toBeGreaterThan(0);
  });

  it('should parse expiresIn in minutes when no unit is provided', () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login({
        user: { id: 1, rol: 'ADMIN' },
        accessToken: 'minute-token',
        expiresIn: '20',
      });
    });

    expect(result.current.getAccessToken()).toBe('minute-token');
    expect(vi.getTimerCount()).toBeGreaterThan(0);
  });

  it('should use the fallback baseURL when it is empty', async () => {
    mockApi.defaults.baseURL = '';

    localStorage.setItem(
      'user',
      JSON.stringify({ id: 1, rol: 'ADMIN' })
    );

    const fetchMock = vi.fn().mockResolvedValue(
      createRefreshResponse({
        accessToken: 'fallback-base-url-token',
      })
    );

    vi.stubGlobal('fetch', fetchMock);

    renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/auth/refresh',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        })
      );
    });
  });

  it('should use default expiresIn when refresh response omits it', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 1, rol: 'ADMIN' })
    );

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        accessToken: 'no-expiry-token',
      }),
    });

    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.getAccessToken()).toBe('no-expiry-token');
    });
  });

  it('should reject an invalid expiresIn format by using the default delay', () => {
    vi.useFakeTimers();

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.login({
        user: { id: 1, rol: 'ADMIN' },
        accessToken: 'invalid-expiry-token',
        expiresIn: 'invalid-expiry',
      });
    });

    expect(result.current.getAccessToken()).toBe('invalid-expiry-token');
    expect(vi.getTimerCount()).toBeGreaterThan(0);
  });

  it('should queue a second refresh while the first refresh is in progress', async () => {
    let resolveFetch;

    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    vi.stubGlobal('fetch', fetchMock);

    let errorHandler;

    mockInterceptorUse.mockImplementation((_, onRejected) => {
      errorHandler = onRejected;
      return 13;
    });

    renderHook(() => useAuth(), { wrapper });

    const request1 = {
      url: '/api/protected-1',
      headers: {},
    };

    const request2 = {
      url: '/api/protected-2',
      headers: {},
    };

    const error1 = {
      response: { status: 401 },
      config: request1,
    };

    const error2 = {
      response: { status: 401 },
      config: request2,
    };

    const firstRetry = errorHandler(error1);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const secondRetry = errorHandler(error2);

    await act(async () => {
      resolveFetch(
        createRefreshResponse({
          accessToken: 'queued-token',
          expiresIn: '15m',
        })
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    await expect(firstRetry).resolves.toEqual({ data: 'retried' });
    await expect(secondRetry).resolves.toEqual({ data: 'retried' });

    expect(request1.headers.Authorization).toBe('Bearer queued-token');
    expect(request2.headers.Authorization).toBe('Bearer queued-token');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(mockApi).toHaveBeenCalledWith(request1);
    expect(mockApi).toHaveBeenCalledWith(request2);
  });

  it('should expire session when visibility refresh fails', async () => {
    vi.useFakeTimers();

    const user = {
      id: 1,
      email: 'test@example.com',
      rol: 'ADMIN',
    };

    localStorage.setItem('user', JSON.stringify(user));

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        createRefreshResponse({
          accessToken: 'initial-refresh-token',
          expiresIn: '15m',
        })
      )
      .mockResolvedValueOnce({
        ok: false,
      });

    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.getAccessToken()).toBe(
      'initial-refresh-token'
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30001);
    });

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.sessionExpired).toBe(true);
    expect(result.current.user).toBeNull();
  });

  it('should handle an exception during visibility refresh', async () => {
    vi.useFakeTimers();

    localStorage.setItem(
      'user',
      JSON.stringify({ id: 1, rol: 'ADMIN' })
    );

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        createRefreshResponse({
          accessToken: 'initial-refresh-token',
          expiresIn: '15m',
        })
      )
      .mockRejectedValueOnce(new Error('Network error'));

    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30001);
    });

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.sessionExpired).toBe(true);
    expect(result.current.user).toBeNull();
  });

  it('should reject queued requests when the refresh fails', async () => {
    let resolveFetch;

    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    vi.stubGlobal('fetch', fetchMock);

    let errorHandler;

    mockInterceptorUse.mockImplementation((_, onRejected) => {
      errorHandler = onRejected;
      return 15;
    });

    renderHook(() => useAuth(), { wrapper });

    const request1 = {
      url: '/api/protected-1',
      headers: {},
    };

    const request2 = {
      url: '/api/protected-2',
      headers: {},
    };

    const error1 = {
      response: { status: 401 },
      config: request1,
    };

    const error2 = {
      response: { status: 401 },
      config: request2,
    };

    const firstRetry = errorHandler(error1);

    const firstSettled = firstRetry.then(
      (value) => ({ status: 'fulfilled', value }),
      (reason) => ({ status: 'rejected', reason })
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    const secondRetry = errorHandler(error2);

    const secondSettled = secondRetry.then(
      (value) => ({ status: 'fulfilled', value }),
      (reason) => ({ status: 'rejected', reason })
    );

    await act(async () => {
      resolveFetch({ ok: false });
      await Promise.resolve();
      await Promise.resolve();
    });

    const [firstResult, secondResult] = await Promise.all([
      firstSettled,
      secondSettled,
    ]);

    expect(firstResult.status).toBe('rejected');
    expect(firstResult.reason).toEqual(error1);

    expect(secondResult.status).toBe('rejected');
    expect(secondResult.reason).toMatchObject({
      message: 'Sesión expirada',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('should ignore visibility changes while the document is hidden', async () => {
    localStorage.setItem(
      'user',
      JSON.stringify({ id: 1, rol: 'ADMIN' })
    );

    const fetchMock = vi.fn().mockResolvedValue(
      createRefreshResponse({
        accessToken: 'hidden-visibility-token',
        expiresIn: '15m',
      })
    );

    vi.stubGlobal('fetch', fetchMock);

    renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    });

    document.dispatchEvent(new Event('visibilitychange'));

    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

});
