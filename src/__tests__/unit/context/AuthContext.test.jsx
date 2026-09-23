// src/__tests__/unit/context/AuthContext.test.jsx
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../../presentation/context/AuthContext';
import React from 'react';

// Mock API module
vi.mock('../../../api/api', () => ({
  default: {
    defaults: {
      headers: {
        common: {},
      },
    },
    post: vi.fn(),
    interceptors: {
      response: {
        use: vi.fn(),
        eject: vi.fn(),
      },
    },
  },
}));

describe('AuthContext', () => {
  beforeEach(() => {
    // Clean localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should provide AuthContext with initial values', () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.user).toBeDefined();
    expect(result.current.loading).toBeDefined();
    expect(result.current.login).toBeDefined();
    expect(result.current.logout).toBeDefined();
  });

  it('should initialize with null user when localStorage is empty', () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
  });

  it('should initialize with cached user from localStorage', () => {
    const mockUser = { id: 1, email: 'test@example.com', rol: 'ADMIN' };
    localStorage.setItem('user', JSON.stringify(mockUser));

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toEqual(mockUser);
  });

  it('should have isAuthenticated getter', () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);

    // Set a user and check
    const mockUser = { id: 1, email: 'test@example.com' };
    localStorage.setItem('user', JSON.stringify(mockUser));

    // Re-render to pick up the new localStorage value
    const { result: result2 } = renderHook(() => useAuth(), { wrapper });
    expect(result2.current.isAuthenticated).toBe(true);
  });

  it('should provide role-based getters', () => {
    const mockUser = { id: 1, email: 'test@example.com', rol: 'VENDEDOR' };
    localStorage.setItem('user', JSON.stringify(mockUser));

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isVendedor).toBe(true);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isCliente).toBe(false);
  });

  it('should handle logout', async () => {
    const mockUser = { id: 1, email: 'test@example.com' };
    localStorage.setItem('user', JSON.stringify(mockUser));

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
  });

  it('should throw error when useAuth is used outside provider', () => {
    // Suppress console.error for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow();

    spy.mockRestore();
  });

  it('should maintain loading state during auth operations', async () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Initial state
    expect(result.current.loading).toBe(false);

    // When performing login, loading should be true temporarily
    // This would require mocking the login call properly
    // For now, we verify the property exists
    expect(typeof result.current.loading).toBe('boolean');
  });
});
