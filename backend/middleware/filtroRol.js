// backend/middleware/filtroRol.js
// ⭐ Sprint 10 — Filtrado de datos por rol
//
// CLIENTE solo ve sus propios pedidos y proformas
// VENDEDOR y ADMIN ven todo
//
// Uso en routes:
//   router.get('/', protect, filtroCliente, pedidoController.getAllPedidos)
//
// El middleware inyecta req.filtroUsuario que el controller usa en su query

/**
 * Si el usuario es CLIENTE, restringe las queries a sus propios registros.
 * Inyecta req.filtroUsuario = { soloPropio: true, usuarioId: N }
 */
const filtroCliente = (req, res, next) => {
  if (req.user?.rol === 'CLIENTE') {
    req.filtroUsuario = {
      soloPropio: true,
      usuarioId:  req.user.id,
      nombre:     req.user.nombre,
      email:      req.user.email,
    };
  } else {
    req.filtroUsuario = { soloPropio: false };
  }
  next();
};

/**
 * Bloquea acceso completo si el rol es CLIENTE.
 * Para rutas que cliente NO debe ver en absoluto (materiales edit, dashboard, etc.)
 */
const soloSistema = (req, res, next) => {
  if (req.user?.rol === 'CLIENTE') {
    return res.status(403).json({
      success: false,
      message: 'No tienes permisos para acceder a este recurso'
    });
  }
  next();
};

module.exports = { filtroCliente, soloSistema };