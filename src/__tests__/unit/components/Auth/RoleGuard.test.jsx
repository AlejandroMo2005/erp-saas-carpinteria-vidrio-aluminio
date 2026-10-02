import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import RoleGuard from '../../../../presentation/components/Auth/RoleGuard';

const mockUseAuth = vi.fn();

vi.mock('../../../../presentation/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('RoleGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders fallback when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
    });

    render(
      <RoleGuard roles={['ADMIN']} fallback={<span>Sin acceso</span>}>
        <span>Contenido protegido</span>
      </RoleGuard>
    );

    expect(screen.getByText('Sin acceso')).toBeInTheDocument();
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument();
  });

  it('renders fallback when authenticated user has no user object', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: true,
    });

    render(
      <RoleGuard roles={['ADMIN']} fallback={<span>Sin acceso</span>}>
        <span>Contenido protegido</span>
      </RoleGuard>
    );

    expect(screen.getByText('Sin acceso')).toBeInTheDocument();
  });

  it('renders fallback when user role is not allowed', () => {
    mockUseAuth.mockReturnValue({
      user: { rol: 'VENDEDOR' },
      isAuthenticated: true,
    });

    render(
      <RoleGuard roles={['ADMIN']} fallback={<span>Sin acceso</span>}>
        <span>Contenido protegido</span>
      </RoleGuard>
    );

    expect(screen.getByText('Sin acceso')).toBeInTheDocument();
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument();
  });

  it('renders children when user role is allowed', () => {
    mockUseAuth.mockReturnValue({
      user: { rol: 'ADMIN' },
      isAuthenticated: true,
    });

    render(
      <RoleGuard roles={['ADMIN']} fallback={<span>Sin acceso</span>}>
        <span>Contenido protegido</span>
      </RoleGuard>
    );

    expect(screen.getByText('Contenido protegido')).toBeInTheDocument();
    expect(screen.queryByText('Sin acceso')).not.toBeInTheDocument();
  });

  it('renders children when user role matches any allowed role', () => {
    mockUseAuth.mockReturnValue({
      user: { rol: 'VENDEDOR' },
      isAuthenticated: true,
    });

    render(
      <RoleGuard roles={['ADMIN', 'VENDEDOR']}>
        <span>Contenido protegido</span>
      </RoleGuard>
    );

    expect(screen.getByText('Contenido protegido')).toBeInTheDocument();
  });

  it('renders children when roles array is empty', () => {
    mockUseAuth.mockReturnValue({
      user: { rol: 'CLIENTE' },
      isAuthenticated: true,
    });

    render(
      <RoleGuard>
        <span>Contenido protegido</span>
      </RoleGuard>
    );

    expect(screen.getByText('Contenido protegido')).toBeInTheDocument();
  });

  it('returns null fallback by default when access is denied', () => {
    mockUseAuth.mockReturnValue({
      user: { rol: 'CLIENTE' },
      isAuthenticated: true,
    });

    const { container } = render(
      <RoleGuard roles={['ADMIN']}>
        <span>Contenido protegido</span>
      </RoleGuard>
    );

    expect(container).toBeEmptyDOMElement();
  });
});
