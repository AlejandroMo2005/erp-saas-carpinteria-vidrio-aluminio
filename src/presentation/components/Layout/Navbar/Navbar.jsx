// presentation/components/Layout/Navbar/Navbar.jsx
// Sprint 7  — Top bar + Bottom nav
// Sprint 15 — Fix contrast ratio
// Sprint 16 — Fix CLS: reserva de espacio, will-change en elementos animados
// Sprint 18 — Refactor: hook useNavbar + CSS parciales + NavbarIcons

import './Navbar.css';
import { useNavbar } from './useNavbar';
import { IconUser, IconLogout, IconChevron } from './NavbarIcons';

export default function Navbar({ usuario, currentView, onNavigate, onAbrirPerfil, onCerrarSesion }) {
  const {
    navItems,
    inicial,
    rolLabel,
    menuAbierto,
    toggleMenu,
    cerrarMenu,
    handlePerfilClick,
    handleLogout,
  } = useNavbar({ usuario, onAbrirPerfil, onCerrarSesion });

  return (
    <>
      {/* ── TOP BAR ── */}
      <header className="navbar-top">
        <div className="navbar-top__brand">
          <span className="navbar-top__brand-dot" />
          <span className="navbar-top__brand-name">V&amp;A Alejandro</span>
        </div>

        <div className="navbar-top__user">
          <button
            className={`navbar-top__user-btn${menuAbierto ? ' is-open' : ''}`}
            onClick={toggleMenu}
            aria-label="Menú de usuario"
            aria-expanded={menuAbierto}
            aria-haspopup="menu"
          >
            <span className="navbar-top__avatar" aria-hidden="true">{inicial}</span>
            <span className="navbar-top__user-info">
              <span className="navbar-top__user-nombre">
                {usuario?.nombre_completo || usuario?.nombre || 'Usuario'}
              </span>
              <span className="navbar-top__user-rol">{rolLabel}</span>
            </span>
            <span className={`navbar-top__chevron${menuAbierto ? ' rotated' : ''}`}>
              <IconChevron />
            </span>
          </button>

          {menuAbierto && (
            <>
              <div
                className="navbar-top__backdrop"
                onClick={cerrarMenu}
                aria-hidden="true"
                role="presentation"
              />
              <div className="navbar-top__dropdown" role="menu">
                <button
                  className="navbar-top__dropdown-item"
                  role="menuitem"
                  onClick={handlePerfilClick}
                >
                  <IconUser />
                  <span>Mi perfil</span>
                </button>
                <div className="navbar-top__dropdown-divider" role="separator" />
                <button
                  className="navbar-top__dropdown-item navbar-top__dropdown-item--danger"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  <IconLogout />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* ── BOTTOM NAV ── */}
      <nav className="navbar-bottom" aria-label="Navegación principal">
        {navItems.map((item) => {
          const esActivo = currentView === item.view;
          return (
            <button
              key={item.view}
              className={`navbar-bottom__item${esActivo ? ' is-active' : ''}`}
              onClick={() => onNavigate(item.view)}
              aria-label={esActivo ? `${item.label}, página actual` : item.label}
              aria-current={esActivo ? 'page' : undefined}
              title={item.label}
            >
              <span className="navbar-bottom__icon"><item.Icon /></span>
              <span className="navbar-bottom__active-dot" aria-hidden="true" />
            </button>
          );
        })}
      </nav>
    </>
  );
}