const path = require('path');

module.exports = function(app) {
  // ⚡ CACHE HEADERS para archivos estáticos en desarrollo
  app.use((req, res, next) => {
    const ext = path.extname(req.path);
    
    // JavaScript y CSS con hash
    if (['.js', '.css'].includes(ext)) {
      // Si tiene hash en el nombre (archivos inmutables)
      if (/\.[a-f0-9]{8}\./i.test(req.path)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hora
      }
    }
    // Imágenes y fuentes
    else if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.woff', '.woff2'].includes(ext)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
    // HTML
    else if (ext === '.html') {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    }
    
    next();
  });
};