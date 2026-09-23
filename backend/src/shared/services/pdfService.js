/**
 * @fileoverview Servicio de generación de PDF — RIDE SRI Ecuador
 * 📦 Sprint 20 — Movido de services/pdfService.js (sin cambios de paths)
 */
'use strict';

const PDFDocument = require('pdfkit');

const COLORES = {
  primario:'#1a56db', secundario:'#374151', borde:'#d1d5db', bordeTabla:'#e5e7eb',
  fondo:'#f9fafb', fondoHeader:'#1e3a5f', texto:'#111827', textoGris:'#6b7280',
  textoClaro:'#9ca3af', verde:'#059669', rojo:'#dc2626', blanco:'#ffffff',
};
const FUENTES  = { regular:'Helvetica', bold:'Helvetica-Bold', oblique:'Helvetica-Oblique' };
const MARGENES = { top:40, bottom:40, left:40, right:40 };
const ANCHO_PAGINA = 595.28, ALTO_PAGINA = 841.89;
const ANCHO_UTIL   = ANCHO_PAGINA - MARGENES.left - MARGENES.right;

const fmt = {
  moneda: (v) => `$${parseFloat(v??0).toLocaleString('es-EC',{minimumFractionDigits:2,maximumFractionDigits:2})}`,
  fecha:  (f) => !f ? '—' : new Date(f).toLocaleDateString('es-EC',{year:'numeric',month:'2-digit',day:'2-digit'}),
  numero: (v, dec=2) => parseFloat(v??0).toFixed(dec),
};

const formatearClaveAcceso = (clave) =>
  !clave ? 'PENDIENTE' : (clave.match(/.{1,10}/g)?.join(' ') ?? clave);

function obtenerPorcentajeStr(factura) {
  const item = (factura.detalle??factura.items??[]).find(i => parseFloat(i.porcentaje_iva??0) > 0);
  return item ? fmt.numero(item.porcentaje_iva, 0) : '15';
}

function dibujarCabecera(doc, factura, empresa, y) {
  const altoCabecera = 110;
  const xDer = MARGENES.left + ANCHO_UTIL/2 + 10;
  const anchoDer = ANCHO_UTIL/2 - 10;

  doc.rect(MARGENES.left, y, ANCHO_UTIL/2-5, altoCabecera).fillAndStroke(COLORES.fondo, COLORES.borde);
  doc.font(FUENTES.bold).fontSize(13).fillColor(COLORES.fondoHeader)
    .text(empresa.razon_social ?? 'EMPRESA EMISORA', MARGENES.left+8, y+10, {width: ANCHO_UTIL/2-20, align:'center'});

  const datosEmisor = [
    empresa.nombre_comercial  ? `Nombre comercial: ${empresa.nombre_comercial}` : null,
    `Dir. matriz: ${empresa.direccion_matriz ?? 'Ver RUC'}`,
    empresa.direccion_sucursal ? `Dir. establecimiento: ${empresa.direccion_sucursal}` : null,
    `Contribuyente: ${empresa.obligado_contabilidad === 'SI' ? 'Obligado a llevar contabilidad' : 'No obligado'}`,
    `Ambiente: ${empresa.ambiente === 'PRODUCCION' ? 'PRODUCCIÓN' : 'PRUEBAS'}`,
  ].filter(Boolean);

  doc.font(FUENTES.regular).fontSize(8).fillColor(COLORES.secundario);
  datosEmisor.forEach((l, i) => doc.text(l, MARGENES.left+8, y+30+i*13, {width: ANCHO_UTIL/2-20}));

  doc.rect(xDer, y, anchoDer, altoCabecera).fillAndStroke(COLORES.fondo, COLORES.borde);
  doc.rect(xDer, y, anchoDer, 26).fillAndStroke(COLORES.fondoHeader, COLORES.fondoHeader);
  doc.font(FUENTES.bold).fontSize(11).fillColor(COLORES.blanco).text('FACTURA', xDer, y+8, {width:anchoDer, align:'center'});
  doc.font(FUENTES.bold).fontSize(8.5).fillColor(COLORES.secundario).text('R.U.C.:', xDer+8, y+34);
  doc.font(FUENTES.bold).fontSize(10).fillColor(COLORES.texto).text(empresa.ruc ?? '9999999999001', xDer+50, y+33);
  doc.font(FUENTES.bold).fontSize(8.5).fillColor(COLORES.secundario).text('No.:', xDer+8, y+52);
  doc.font(FUENTES.bold).fontSize(10).fillColor(COLORES.primario).text(factura.numero_factura ?? '001-001-000000001', xDer+50, y+51);
  doc.font(FUENTES.regular).fontSize(8).fillColor(COLORES.secundario)
    .text(`Fecha emisión: ${fmt.fecha(factura.fecha_emision)}`, xDer+8, y+70)
    .text(factura.fecha_autorizacion ? `Fecha autorización: ${fmt.fecha(factura.fecha_autorizacion)}` : 'Pendiente de autorización SRI', xDer+8, y+83);
  const estadoColor = factura.estado === 'AUTORIZADA' ? COLORES.verde : factura.estado === 'ANULADA' ? COLORES.rojo : COLORES.primario;
  doc.font(FUENTES.bold).fontSize(8).fillColor(estadoColor).text(`Estado: ${factura.estado ?? 'EMITIDA'}`, xDer+8, y+96);

  return y + altoCabecera + 10;
}

function dibujarDatosCliente(doc, factura, y) {
  const altoBloque = 72;
  doc.rect(MARGENES.left, y, ANCHO_UTIL, altoBloque).fillAndStroke(COLORES.fondo, COLORES.borde);
  doc.rect(MARGENES.left, y, ANCHO_UTIL, 18).fillAndStroke(COLORES.secundario, COLORES.secundario);
  doc.font(FUENTES.bold).fontSize(9).fillColor(COLORES.blanco).text('DATOS DEL CLIENTE', MARGENES.left+8, y+5);
  y += 22;
  const col1 = MARGENES.left+8, col2 = MARGENES.left+ANCHO_UTIL/2+8, ancho = ANCHO_UTIL/2-16;
  const filasIzq = [
    ['Razón Social / Nombre:', factura.cliente_nombre ?? 'CONSUMIDOR FINAL'],
    [factura.cliente_tipo_identificacion === 'RUC' ? 'RUC:' : 'Cédula / Pasaporte:', factura.cliente_identificacion ?? '9999999999'],
  ];
  const filasDer = [
    ['Teléfono:', factura.cliente_telefono ?? '—'],
    ['Email:',   factura.cliente_email    ?? '—'],
  ];
  filasIzq.forEach(([label, val], i) => {
    doc.font(FUENTES.bold).fontSize(8).fillColor(COLORES.textoGris).text(label, col1, y+i*16, {width:ancho});
    doc.font(FUENTES.regular).fontSize(9).fillColor(COLORES.texto).text(val, col1+130, y+i*16, {width:ancho-130});
  });
  filasDer.forEach(([label, val], i) => {
    doc.font(FUENTES.bold).fontSize(8).fillColor(COLORES.textoGris).text(label, col2, y+i*16, {width:ancho});
    doc.font(FUENTES.regular).fontSize(9).fillColor(COLORES.texto).text(val, col2+65, y+i*16, {width:ancho-65});
  });
  doc.font(FUENTES.bold).fontSize(8).fillColor(COLORES.textoGris).text('Dirección:', col1, y+32, {width:80});
  doc.font(FUENTES.regular).fontSize(9).fillColor(COLORES.texto).text(factura.cliente_direccion ?? '—', col1+60, y+32, {width:ANCHO_UTIL-80});
  return y + altoBloque - 10;
}

function dibujarTablaItems(doc, factura, y) {
  const items = factura.detalle ?? factura.items ?? [];
  const cols  = [
    {label:'Cód.',        x:MARGENES.left,       w:45,  align:'left' },
    {label:'Descripción', x:MARGENES.left+45,    w:165, align:'left' },
    {label:'Cant.',       x:MARGENES.left+210,   w:45,  align:'right'},
    {label:'P. Unitario', x:MARGENES.left+255,   w:65,  align:'right'},
    {label:'Descuento',   x:MARGENES.left+320,   w:55,  align:'right'},
    {label:'% IVA',       x:MARGENES.left+375,   w:40,  align:'right'},
    {label:'Total',       x:MARGENES.left+415,   w:60,  align:'right'},
  ];
  const altoHeader = 20, altoFila = 22, padX = 4;
  doc.rect(MARGENES.left, y, ANCHO_UTIL, altoHeader).fillAndStroke(COLORES.fondoHeader, COLORES.fondoHeader);
  cols.forEach(col => doc.font(FUENTES.bold).fontSize(8).fillColor(COLORES.blanco).text(col.label, col.x+padX, y+6, {width:col.w-padX*2, align:col.align}));
  y += altoHeader;

  items.forEach((item, idx) => {
    const fondoFila  = idx % 2 === 0 ? COLORES.blanco : COLORES.fondo;
    const lineasDesc = Math.ceil((item.descripcion?.length ?? 0) / 28) || 1;
    const altoFila_  = Math.max(altoFila, lineasDesc * 13 + 8);
    if (y + altoFila_ > ALTO_PAGINA - MARGENES.bottom - 120) { doc.addPage(); y = MARGENES.top; }
    doc.rect(MARGENES.left, y, ANCHO_UTIL, altoFila_).fillAndStroke(fondoFila, COLORES.bordeTabla);
    const sub   = parseFloat(item.precio_total_sin_iva ?? 0);
    const iva   = parseFloat(item.valor_iva            ?? 0);
    const total = sub + iva;
    const valores = [
      item.codigo_principal ?? '—', item.descripcion ?? '',
      fmt.numero(item.cantidad, 4), fmt.moneda(item.precio_unitario),
      fmt.moneda(item.descuento ?? 0), `${fmt.numero(item.porcentaje_iva, 0)}%`, fmt.moneda(total),
    ];
    cols.forEach((col, i) => doc.font(FUENTES.regular).fontSize(8.5).fillColor(COLORES.texto)
      .text(valores[i], col.x+padX, y+5, {width:col.w-padX*2, align:col.align, lineBreak:i===1}));
    y += altoFila_;
  });

  doc.moveTo(MARGENES.left, y).lineTo(MARGENES.left+ANCHO_UTIL, y).strokeColor(COLORES.borde).lineWidth(1).stroke();
  return y + 8;
}

function dibujarTotales(doc, factura, y) {
  const xLabel = MARGENES.left+ANCHO_UTIL-230, xValor = MARGENES.left+ANCHO_UTIL-80;
  const anchoLabel = 140, anchoValor = 75;
  const filas = [
    {label:'Subtotal sin IVA 0%',                                       valor:fmt.moneda(factura.subtotal_sin_iva), bold:false},
    {label:`Subtotal IVA ${obtenerPorcentajeStr(factura)}%`,            valor:fmt.moneda(factura.subtotal_con_iva), bold:false},
    {label:`IVA ${obtenerPorcentajeStr(factura)}%`,                     valor:fmt.moneda(factura.iva),             bold:false},
    ...(parseFloat(factura.descuento??0)>0 ? [{label:'Descuento',       valor:`- ${fmt.moneda(factura.descuento)}`, bold:false}] : []),
    ...(parseFloat(factura.propina??0)>0   ? [{label:'Propina',         valor:fmt.moneda(factura.propina),          bold:false}] : []),
    {label:'TOTAL', valor:fmt.moneda(factura.total), bold:true, destacado:true},
  ];
  const altoFila = 18, altoBloque = filas.length * altoFila + 8;
  doc.rect(xLabel-8, y, anchoLabel+anchoValor+16, altoBloque).fillAndStroke(COLORES.fondo, COLORES.borde);
  filas.forEach((fila, i) => {
    const yFila = y + 4 + i * altoFila;
    if (fila.destacado) {
      doc.rect(xLabel-8, yFila, anchoLabel+anchoValor+16, altoFila).fillAndStroke(COLORES.fondoHeader, COLORES.fondoHeader);
      doc.font(FUENTES.bold).fontSize(10).fillColor(COLORES.blanco)
        .text(fila.label, xLabel, yFila+4, {width:anchoLabel, align:'right'})
        .text(fila.valor, xValor, yFila+4, {width:anchoValor, align:'right'});
    } else {
      doc.font(fila.bold?FUENTES.bold:FUENTES.regular).fontSize(8.5).fillColor(COLORES.secundario).text(fila.label, xLabel, yFila+4, {width:anchoLabel, align:'right'});
      doc.font(fila.bold?FUENTES.bold:FUENTES.regular).fontSize(8.5).fillColor(COLORES.texto).text(fila.valor, xValor, yFila+4, {width:anchoValor, align:'right'});
    }
  });
  return y + altoBloque + 12;
}

function dibujarClaveAcceso(doc, factura, y) {
  const altoBloque = 52;
  doc.rect(MARGENES.left, y, ANCHO_UTIL, altoBloque).fillAndStroke(COLORES.fondo, COLORES.borde);
  doc.font(FUENTES.bold).fontSize(8).fillColor(COLORES.secundario).text('CLAVE DE ACCESO:', MARGENES.left+8, y+8);
  doc.font(FUENTES.regular).fontSize(8.5).fillColor(COLORES.texto)
    .text(formatearClaveAcceso(factura.clave_acceso), MARGENES.left+8, y+20, {width:ANCHO_UTIL-16, characterSpacing:1});
  if (factura.numero_autorizacion) {
    doc.font(FUENTES.bold).fontSize(8).fillColor(COLORES.secundario).text('No. AUTORIZACIÓN SRI:', MARGENES.left+8, y+36);
    doc.font(FUENTES.regular).fontSize(8.5).fillColor(COLORES.verde).text(factura.numero_autorizacion, MARGENES.left+130, y+36);
  }
  return y + altoBloque + 8;
}

function dibujarObservaciones(doc, texto, y) {
  doc.font(FUENTES.bold).fontSize(8).fillColor(COLORES.secundario).text('OBSERVACIONES:', MARGENES.left, y);
  y += 14;
  doc.rect(MARGENES.left, y, ANCHO_UTIL, 40).fillAndStroke(COLORES.fondo, COLORES.borde);
  doc.font(FUENTES.regular).fontSize(8.5).fillColor(COLORES.texto).text(texto, MARGENES.left+8, y+8, {width:ANCHO_UTIL-16, lineBreak:true});
  return y + 50;
}

function dibujarPiePagina(doc) {
  const yPie = ALTO_PAGINA - MARGENES.bottom - 30;
  doc.moveTo(MARGENES.left, yPie).lineTo(MARGENES.left+ANCHO_UTIL, yPie).strokeColor(COLORES.borde).lineWidth(0.5).stroke();
  doc.font(FUENTES.oblique).fontSize(7.5).fillColor(COLORES.textoGris)
    .text('Este documento es la representación impresa de un Comprobante Electrónico. Verifique el estado de autorización en: https://srienlinea.sri.gob.ec', MARGENES.left, yPie+6, {width:ANCHO_UTIL*0.7, align:'left'});
  doc.font(FUENTES.regular).fontSize(7.5).fillColor(COLORES.textoClaro)
    .text(`Generado: ${new Date().toLocaleDateString('es-EC')}`, MARGENES.left+ANCHO_UTIL*0.75, yPie+6, {width:ANCHO_UTIL*0.25, align:'right'});
}

const generarRIDE = (factura, empresa = {}) => new Promise((resolve, reject) => {
  try {
    const doc = new PDFDocument({ size:'A4', margins:MARGENES, info:{ Title:`Factura ${factura.numero_factura}`, Author:empresa.razon_social ?? 'Sistema de Facturación', Subject:'RIDE', Keywords:'factura,SRI,Ecuador' } });
    const buffers = [];
    doc.on('data',  c   => buffers.push(c));
    doc.on('end',   ()  => resolve(Buffer.concat(buffers)));
    doc.on('error', err => reject(err));
    let y = MARGENES.top;
    y = dibujarCabecera(doc, factura, empresa, y);
    y = dibujarDatosCliente(doc, factura, y);
    y = dibujarTablaItems(doc, factura, y);
    y = dibujarTotales(doc, factura, y);
    y = dibujarClaveAcceso(doc, factura, y);
    if (factura.observaciones) y = dibujarObservaciones(doc, factura.observaciones, y);
    dibujarPiePagina(doc);
    doc.end();
  } catch (err) { reject(err); }
});

const obtenerDatosEmpresa = () => ({
  ruc:                   process.env.EMPRESA_RUC              ?? '9999999999001',
  razon_social:          process.env.EMPRESA_RAZON_SOCIAL     ?? 'MI EMPRESA S.A.',
  nombre_comercial:      process.env.EMPRESA_NOMBRE_COMERCIAL ?? null,
  direccion_matriz:      process.env.EMPRESA_DIRECCION        ?? 'Guayaquil, Ecuador',
  direccion_sucursal:    process.env.EMPRESA_SUCURSAL         ?? null,
  telefono:              process.env.EMPRESA_TELEFONO         ?? null,
  email:                 process.env.EMPRESA_EMAIL            ?? null,
  obligado_contabilidad: process.env.EMPRESA_OBLIGADO         ?? 'NO',
  ambiente:              process.env.SRI_AMBIENTE             ?? 'PRUEBAS',
});

module.exports = { generarRIDE, obtenerDatosEmpresa };