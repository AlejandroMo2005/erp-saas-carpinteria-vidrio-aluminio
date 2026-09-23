// backend/__tests__/unit/middleware/auth.test.js
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';

// Mock dependencies
vi.mock('../../../models/Usuario', () => ({
  default: {
    getById: vi.fn(),
  },
}));

vi.mock('../../../config/database', () => ({
  default: {
    query: vi.fn(),
  },
}));

vi.mock('../../../config/redis', () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock('../../../utils/logger', () => ({
  default: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../../middleware/security', () => ({
  timingSafeEqual: (a, b) => a === b,
}));

import { protect } from '../../../middleware/auth';
import Usuario from '../../../models/Usuario';
import redis from '../../../config/redis';

describe('Auth Middleware - protect()', () => {
  let req, res, next;

  beforeEach(() => {
    vi.clearAllMocks();

    req = {
      headers: {},
      ip: '127.0.0.1',
      path: '/api/test',
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    next = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 when no token is provided', async () => {
    req.headers.authorization = undefined;

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('Token no proporcionado'),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when token format is invalid', async () => {
    req.headers.authorization = 'InvalidToken';

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when token is expired', async () => {
    const expiredToken = jwt.sign(
      { id: 1, email: 'test@example.com' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '-1h' }
    );

    req.headers.authorization = `Bearer ${expiredToken}`;

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        expired: true,
      })
    );
  });

  it('should return 401 when token is blacklisted', async () => {
    const token = jwt.sign(
      { id: 1, email: 'test@example.com', jti: 'token-id-123' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    req.headers.authorization = `Bearer ${token}`;

    // Mock redis to return blacklisted status
    redis.get.mockResolvedValue(true);
    Usuario.getById.mockResolvedValue({ id: 1, email: 'test@example.com' });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('Sesión cerrada'),
      })
    );
  });

  it('should return 401 when user is not found', async () => {
    const token = jwt.sign(
      { id: 999, email: 'nonexistent@example.com' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    req.headers.authorization = `Bearer ${token}`;
    redis.get.mockResolvedValue(false);
    Usuario.getById.mockResolvedValue(null);

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('Usuario no encontrado'),
      })
    );
  });

  it('should return 401 when user is inactive', async () => {
    const token = jwt.sign(
      { id: 1, email: 'test@example.com' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    req.headers.authorization = `Bearer ${token}`;
    redis.get.mockResolvedValue(false);
    Usuario.getById.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      estado: 'inactivo',
    });

    await protect(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('Usuario inactivo'),
      })
    );
  });

  it('should call next() when token is valid', async () => {
    const token = jwt.sign(
      { id: 1, email: 'test@example.com', jti: 'token-id-123' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    req.headers.authorization = `Bearer ${token}`;
    redis.get.mockResolvedValue(false);
    Usuario.getById.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      estado: 'activo',
      rol: 'ADMIN',
    });

    await protect(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe(1);
  });

  it('should attach decoded user to req.user', async () => {
    const token = jwt.sign(
      { id: 1, email: 'test@example.com', rol: 'VENDEDOR' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    req.headers.authorization = `Bearer ${token}`;
    redis.get.mockResolvedValue(false);
    Usuario.getById.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      estado: 'activo',
      rol: 'VENDEDOR',
    });

    await protect(req, res, next);

    expect(req.user).toEqual(
      expect.objectContaining({
        id: 1,
        email: 'test@example.com',
      })
    );
  });
});
