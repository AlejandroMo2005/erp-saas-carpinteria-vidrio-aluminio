// public/load-fonts.js
// Carga asíncrona de Google Fonts SIN violar CSP script-src-attr:'none'.
//
// PROBLEMA: onload="this.media='all'" en <link> es inline event handler.
//   Helmet con scriptSrcAttr:'none' lo bloquea → error en consola.
//
// SOLUCIÓN: archivo 1st-party → permitido por script-src:'self'.
//   defer → corre después de parsear HTML, los <link> ya están en el DOM.
(function () {
  var links = document.querySelectorAll('link[data-async-font]');
  for (var i = 0; i < links.length; i++) {
    links[i].media = 'all';
  }
})();