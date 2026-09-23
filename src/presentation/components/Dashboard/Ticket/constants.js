export const PERIODOS    = ['dia', 'semana', 'mes', 'anio'];
export const PERIODO_LBL = { dia: 'Día', semana: 'Semana', mes: 'Mes', anio: 'Año' };

// Deben coincidir con --kpi-ticket y --kpi-pedidos en dashboard_.css
// Recharts usa SVG — no acepta CSS custom props en stroke/fill
export const TICKET_COLOR  = '#8b5cf6';   // --kpi-ticket
export const PEDIDOS_COLOR = '#3b82f6';   // --kpi-pedidos