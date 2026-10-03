// src/presentation/components/Auth/RoleGuard.jsx
// ⭐ Sprint 10 — Protección de vistas por rol
// 🐛 Fix ESLint — eliminado 'import React' innecesario (JSX transform React 17+)
//
// Uso:
//   <RoleGuard roles={['ADMIN']}>
//     <ComponenteSoloAdmin />
//   </RoleGuard>
//
//   <RoleGuard roles={['ADMIN', 'VENDEDOR']} fallback={<p>Sin acceso</p>}>
//     <ComponenteAdminOVendedor />
//   </RoleGuard>

import { useAuth } from '../../context/useAuth';

/**
 * Bloquea el render de children si el usuario no tiene uno de los roles requeridos.
 *
 * @param {string[]} roles     — Roles permitidos ej: ['ADMIN', 'VENDEDOR']
 * @param {ReactNode} children — Contenido a mostrar si tiene permiso
 * @param {ReactNode} fallback — Qué mostrar si NO tiene permiso (default: null)
 */
export default function RoleGuard({ roles = [], children, fallback = null }) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) return fallback;

  if (roles.length > 0 && !roles.includes(user.rol)) {
    return fallback;
  }

  return children;
}