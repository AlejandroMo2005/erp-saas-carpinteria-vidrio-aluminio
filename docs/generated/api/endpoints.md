# Catálogo automático de endpoints

> Archivo generado automáticamente. No editar manualmente.

## Endpoints detectados

| Método | Ruta | Fuente |
|---|---|---|
| `GET` | `/*` | `backend/app.js` |
| `GET` | `/api` | `backend/app.js` |
| `GET` | `/api/auth` | `backend/src/modules/auth/auth.routes.js` |
| `POST` | `/api/auth/forgot-password` | `backend/src/modules/auth/auth.routes.js` |
| `POST` | `/api/auth/login` | `backend/src/modules/auth/auth.routes.js` |
| `POST` | `/api/auth/logout` | `backend/src/modules/auth/auth.routes.js` |
| `GET` | `/api/auth/profile` | `backend/src/modules/auth/auth.routes.js` |
| `POST` | `/api/auth/refresh` | `backend/src/modules/auth/auth.routes.js` |
| `POST` | `/api/auth/register` | `backend/src/modules/auth/auth.routes.js` |
| `POST` | `/api/auth/reset-password` | `backend/src/modules/auth/auth.routes.js` |
| `POST` | `/api/auth/verify-code` | `backend/src/modules/auth/auth.routes.js` |
| `GET` | `/api/clientes` | `backend/src/modules/cliente/cliente.routes.js` |
| `POST` | `/api/clientes` | `backend/src/modules/cliente/cliente.routes.js` |
| `GET` | `/api/clientes/buscar` | `backend/src/modules/cliente/cliente.routes.js` |
| `GET` | `/api/clientes/mis-datos` | `backend/src/modules/cliente/cliente.routes.js` |
| `PUT` | `/api/clientes/mis-datos` | `backend/src/modules/cliente/cliente.routes.js` |
| `GET` | `/api/colores` | `backend/src/modules/inventario/color/color.routes.js` |
| `GET` | `/api/configuracion` | `backend/src/modules/configuracion/configuracion.routes.js` |
| `GET` | `/api/configuracion/:clave` | `backend/src/modules/configuracion/configuracion.routes.js` |
| `PUT` | `/api/configuracion/:clave` | `backend/src/modules/configuracion/configuracion.routes.js` |
| `GET` | `/api/configuracion/iva/tasa` | `backend/src/modules/configuracion/configuracion.routes.js` |
| `POST` | `/api/csp-report` | `backend/app.js` |
| `GET` | `/api/dashboard/estados` | `backend/src/modules/dashboard/dashboard.routes.js` |
| `GET` | `/api/dashboard/ingresos` | `backend/src/modules/dashboard/dashboard.routes.js` |
| `GET` | `/api/dashboard/materiales-variantes` | `backend/src/modules/dashboard/dashboard.routes.js` |
| `GET` | `/api/dashboard/pedidos-recientes` | `backend/src/modules/dashboard/dashboard.routes.js` |
| `GET` | `/api/dashboard/resumen` | `backend/src/modules/dashboard/dashboard.routes.js` |
| `GET` | `/api/dashboard/top-productos` | `backend/src/modules/dashboard/dashboard.routes.js` |
| `GET` | `/api/dashboard/trabajos-stats` | `backend/src/modules/dashboard/dashboard.routes.js` |
| `GET` | `/api/dashboard/usuarios-ingresos` | `backend/src/modules/dashboard/dashboard.routes.js` |
| `GET` | `/api/facturacion` | `backend/src/modules/comercial/facturacion/facturacion.routes.js` |
| `POST` | `/api/facturacion` | `backend/src/modules/comercial/facturacion/facturacion.routes.js` |
| `GET` | `/api/facturacion/:id` | `backend/src/modules/comercial/facturacion/facturacion.routes.js` |
| `PUT` | `/api/facturacion/:id` | `backend/src/modules/comercial/facturacion/facturacion.routes.js` |
| `PUT` | `/api/facturacion/:id/anular` | `backend/src/modules/comercial/facturacion/facturacion.routes.js` |
| `GET` | `/api/facturacion/:id/pdf` | `backend/src/modules/comercial/facturacion/facturacion.routes.js` |
| `POST` | `/api/facturacion/desde-pedido` | `backend/src/modules/comercial/facturacion/facturacion.routes.js` |
| `GET` | `/api/facturacion/estadisticas` | `backend/src/modules/comercial/facturacion/facturacion.routes.js` |
| `GET` | `/api/facturacion/pedidos-cliente/:clienteId` | `backend/src/modules/comercial/facturacion/facturacion.routes.js` |
| `GET` | `/api/facturacion/resumen-periodo` | `backend/src/modules/comercial/facturacion/facturacion.routes.js` |
| `GET` | `/api/facturacion/siguiente-numero` | `backend/src/modules/comercial/facturacion/facturacion.routes.js` |
| `GET` | `/api/facturacion/validar-pedido/:pedidoId` | `backend/src/modules/comercial/facturacion/facturacion.routes.js` |
| `POST` | `/api/ia/inpaint` | `backend/src/modules/ia/generacion/ia.routes.js` |
| `POST` | `/api/ia/mascara-auto` | `backend/src/modules/ia/generacion/ia.routes.js` |
| `POST` | `/api/ia/visualizar` | `backend/src/modules/ia/generacion/ia.routes.js` |
| `GET` | `/api/ia/visualizar/trabajos/:id/colores` | `backend/src/modules/ia/generacion/ia.routes.js` |
| `GET` | `/api/materiales` | `backend/src/modules/inventario/material/material.routes.js` |
| `DELETE` | `/api/materiales/:id` | `backend/src/modules/inventario/material/material.routes.js` |
| `GET` | `/api/materiales/con-colores` | `backend/src/modules/inventario/material/material.routes.js` |
| `PUT` | `/api/materiales/variante/:id` | `backend/src/modules/inventario/material/material.routes.js` |
| `GET` | `/api/pedidos` | `backend/src/modules/comercial/pedido/pedido.routes.js` |
| `POST` | `/api/pedidos` | `backend/src/modules/comercial/pedido/pedido.routes.js` |
| `DELETE` | `/api/pedidos/:id` | `backend/src/modules/comercial/pedido/pedido.routes.js` |
| `GET` | `/api/pedidos/:id` | `backend/src/modules/comercial/pedido/pedido.routes.js` |
| `PATCH` | `/api/pedidos/:id/estado` | `backend/src/modules/comercial/pedido/pedido.routes.js` |
| `PUT` | `/api/pedidos/:id/estado` | `backend/src/modules/comercial/pedido/pedido.routes.js` |
| `GET` | `/api/pedidos/estado/:estado` | `backend/src/modules/comercial/pedido/pedido.routes.js` |
| `GET` | `/api/proformas` | `backend/src/modules/comercial/proforma/proforma.routes.js` |
| `GET` | `/api/proformas/:id` | `backend/src/modules/comercial/proforma/proforma.routes.js` |
| `POST` | `/api/proformas/agendar` | `backend/src/modules/comercial/proforma/proforma.routes.js` |
| `GET` | `/api/proformas/buscar/cliente` | `backend/src/modules/comercial/proforma/proforma.routes.js` |
| `POST` | `/api/proformas/calcular` | `backend/src/modules/comercial/proforma/proforma.routes.js` |
| `GET` | `/api/proveedores` | `backend/src/modules/inventario/proveedor/proveedor.routes.js` |
| `POST` | `/api/proveedores` | `backend/src/modules/inventario/proveedor/proveedor.routes.js` |
| `DELETE` | `/api/proveedores/:id` | `backend/src/modules/inventario/proveedor/proveedor.routes.js` |
| `GET` | `/api/proveedores/:id` | `backend/src/modules/inventario/proveedor/proveedor.routes.js` |
| `PUT` | `/api/proveedores/:id` | `backend/src/modules/inventario/proveedor/proveedor.routes.js` |
| `GET` | `/api/proveedores/alertas/stock` | `backend/src/modules/inventario/proveedor/proveedor.routes.js` |
| `GET` | `/api/proveedores/materiales` | `backend/src/modules/inventario/proveedor/proveedor.routes.js` |
| `PATCH` | `/api/proveedores/solicitudes/:id/enviada` | `backend/src/modules/inventario/proveedor/proveedor.routes.js` |
| `POST` | `/api/proveedores/solicitudes/generar` | `backend/src/modules/inventario/proveedor/proveedor.routes.js` |
| `GET` | `/api/proveedores/solicitudes/historial` | `backend/src/modules/inventario/proveedor/proveedor.routes.js` |
| `GET` | `/api/recetas` | `backend/app.js` |
| `DELETE` | `/api/referencias/:id` | `backend/src/modules/ia/referencia/referencia.routes.js` |
| `PATCH` | `/api/referencias/:id` | `backend/src/modules/ia/referencia/referencia.routes.js` |
| `GET` | `/api/referencias/trabajos/:trabajo_id` | `backend/src/modules/ia/referencia/referencia.routes.js` |
| `POST` | `/api/referencias/trabajos/:trabajo_id` | `backend/src/modules/ia/referencia/referencia.routes.js` |
| `GET` | `/api/trabajos` | `backend/src/modules/comercial/trabajo/trabajo.routes.js` |
| `GET` | `/api/trabajos/:id/recetas` | `backend/src/modules/comercial/trabajo/trabajo.routes.js` |
| `GET` | `/api/trabajos/colores` | `backend/src/modules/comercial/trabajo/trabajo.routes.js` |
| `GET` | `/api/usuarios` | `backend/src/modules/usuario/usuario.routes.js` |
| `POST` | `/api/usuarios` | `backend/src/modules/usuario/usuario.routes.js` |
| `DELETE` | `/api/usuarios/:id` | `backend/src/modules/usuario/usuario.routes.js` |
| `PUT` | `/api/usuarios/:id/activo` | `backend/src/modules/usuario/usuario.routes.js` |
| `PUT` | `/api/usuarios/:id/rol` | `backend/src/modules/usuario/usuario.routes.js` |
| `GET` | `/api/usuarios/buscar` | `backend/src/modules/usuario/usuario.routes.js` |
| `GET` | `/api/usuarios/me` | `backend/src/modules/usuario/usuario.routes.js` |
| `PUT` | `/api/usuarios/me` | `backend/src/modules/usuario/usuario.routes.js` |
| `GET` | `/health` | `backend/app.js` |

## Fuente

Los endpoints se obtienen mediante análisis estático de las declaraciones de rutas Express del proyecto.

- Fuentes de rutas analizadas: 15
- Endpoints detectados: 89

> Este archivo es generado automáticamente. No editar manualmente.
