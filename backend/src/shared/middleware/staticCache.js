// src/shared/middleware/staticCache.js
// 📦 Sprint 20 — Movido de middleware/staticCache.js
'use strict';

const path    = require('path');
const express = require('express');
const { buildPath } = require('../../../config/preload');

const cacheHeaders = (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    return next();
  }
  const filename = path.basename(req.path), ext = path.extname(req.path);
  const hasHashedName = /[\.\-][a-zA-Z0-9_\-]{6,12}\.(chunk\.)?(js|css)$/.test(filename);
  if (hasHashedName)                                            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  else if (['.js','.css'].includes(ext))                        res.setHeader('Cache-Control', 'public, max-age=3600');
  else if (['.jpg','.jpeg','.png','.gif','.webp','.svg','.woff','.woff2','.ttf','.eot'].includes(ext)) res.setHeader('Cache-Control', 'public, max-age=31536000');
  else if (ext === '.html' || req.path === '/' || req.path === '/index.html') res.setHeader('Cache-Control', 'no-cache, must-revalidate, max-age=0');
  else                                                          res.setHeader('Cache-Control', 'public, max-age=86400');
  next();
};

const referenciasStatic = [
  (req, res, next) => { res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); next(); },
  express.static(path.join(__dirname, '../../../public/referencias')),
];

const buildStatic  = express.static(buildPath, { maxAge: 0, etag: true, lastModified: true, index: false });
const publicStatic = express.static(path.join(__dirname, '../../../public'), { maxAge: 0, etag: true, lastModified: true });

module.exports = { cacheHeaders, referenciasStatic, buildStatic, publicStatic };