// src/modules/comercial/facturacion/facturacion.service.js
// 📦 Sprint 20 — Proxy para services/comprobanteService
//                Los handlers importan desde aquí en lugar del path absoluto
//                Cuando comprobanteService sea migrado a src/, este archivo
//                se actualiza en un solo lugar.
// TODO Sprint 20+: mover el contenido real aquí y eliminar este proxy
'use strict';
module.exports = require('../../../shared/services/comprobanteService');
