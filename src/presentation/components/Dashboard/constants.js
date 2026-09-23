import { TrendingUp, ShoppingCart, Users, BarChart2 } from 'lucide-react';

// Colores de KPI — deben coincidir con --kpi-* en dashboard.css.
// Se usan como prop string porque iconBg usa template literal `${color}22`
// y los subcomponentes los pasan a Recharts (SVG no admite CSS vars).
export const KPI_COLORS = {
  ingresos: '#f59e0b',   // --kpi-ingresos
  pedidos:  '#3b82f6',   // --kpi-pedidos
  usuarios: '#10b981',   // --kpi-usuarios
  ticket:   '#8b5cf6',   // --kpi-ticket
};

export const KPI_CONFIG = [
  {
    key:   'ingresos',
    label: 'Ingresos totales',
    icon:  TrendingUp,
    color: KPI_COLORS.ingresos,
    vista: 'ingresos',
    getValue: (r) => r?.ingresos_totales,
    format: 'money',
  },
  {
    key:   'pedidos',
    label: 'Pedidos',
    icon:  ShoppingCart,
    color: KPI_COLORS.pedidos,
    vista: 'pedidos',
    getValue: (r) => r?.total_pedidos,
    format: 'number',
  },
  {
    key:   'usuarios',
    label: 'Usuarios activos',
    icon:  Users,
    color: KPI_COLORS.usuarios,
    vista: 'usuarios',
    getValue: (r) => r?.usuarios_activos,
    format: 'number',
  },
  {
    key:   'ticket',
    label: 'Ticket promedio',
    icon:  BarChart2,
    color: KPI_COLORS.ticket,
    vista: 'ticket',
    getValue: (r) => r?.ticket_promedio,
    format: 'money',
  },
];