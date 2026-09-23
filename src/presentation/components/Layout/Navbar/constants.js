// src/presentation/components/Layout/Navbar/constants.js
import {
  IconHome, IconEye, IconClipboard,
  IconFileText, IconBox, IconBarChart, IconReceipt,
} from './NavbarIcons';

// roles: null  → todos los roles
// roles: array → solo esos roles
// Icon: referencia al componente (no instancia JSX) — el .js puro no parsea JSX.
// En Navbar.jsx se instancia con <item.Icon />.
export const ALL_NAV_ITEMS = [
  { view: 'dashboard',        label: 'Inicio',      Icon: IconHome,      roles: null                  },
  { view: 'previsualizacion', label: 'Preview',     Icon: IconEye,       roles: null                  },
  { view: 'pedidos',          label: 'Pedidos',     Icon: IconClipboard, roles: null                  },
  { view: 'proformas',        label: 'Proformas',   Icon: IconFileText,  roles: null                  },
  { view: 'materiales',       label: 'Inventario',  Icon: IconBox,       roles: ['ADMIN', 'VENDEDOR'] },
  { view: 'facturacion',      label: 'Facturación', Icon: IconReceipt,   roles: ['ADMIN', 'VENDEDOR'] },
  { view: 'dashboard-ventas', label: 'Dashboard',   Icon: IconBarChart,  roles: ['ADMIN']             },
];

export const buildNavItems = (rol) =>
  ALL_NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(rol));

export const ROL_LABELS = {
  ADMIN:    'Administrador',
  VENDEDOR: 'Vendedor',
  ALMACEN:  'Almacén',
};