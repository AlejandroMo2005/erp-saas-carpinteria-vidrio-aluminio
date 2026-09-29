#!/usr/bin/env node

/**
 * Punto de entrada para la generación automatizada de documentación.
 *
 * Este archivo coordina los generadores de documentación del proyecto.
 * Los generadores individuales se incorporarán progresivamente a medida
 * que cada fuente técnica tenga una representación automatizable.
 */

const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const GENERATED_DIR = path.join(ROOT_DIR, 'docs', 'generated');

function ensureGeneratedDirectory() {
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
}

function main() {
  ensureGeneratedDirectory();

  console.log('Documentación automatizada inicializada.');
  console.log(`Repositorio: ${ROOT_DIR}`);
  console.log(`Salida: ${GENERATED_DIR}`);
}

main();
