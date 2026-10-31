/* AURUM · Botones de acción de los temas */
(function () {
  'use strict';

  function iniciar() {
    var iconos = {
      reply: ['ti-message-reply', 'Responder'],
      quote: ['ti-quote', 'Citar'],
      edit: ['ti-pencil', 'Editar'],
      delete: ['ti-trash', 'Eliminar'],
      ip: ['ti-world', 'Ver IP'],
      report: ['ti-flag', 'Reportar']
    };

    document.querySelectorAll(
      '#main-content [data-ak-action]'
    ).forEach(function (contenedor) {
      var accion = contenedor.getAttribute('data-ak-action');
      var datos = iconos[accion];

      if (!datos) return;

      var enlaces = contenedor.matches('a, button')
        ? [contenedor]
        : contenedor.querySelectorAll('a, button');

      Array.prototype.forEach.call(enlaces, function (enlace) {
        if (enlace.classList.contains('ak-action-link')) return;

        var imagen = enlace.querySelector('img');

        var nombre = (
          imagen && (
            imagen.getAttribute('title') ||
            imagen.getAttribute('alt')
          )
        ) || enlace.getAttribute('title') || datos[1];

        var icono = document.createElement('i');
        icono.className = 'ti ' + datos[0];
        icono.setAttribute('aria-hidden', 'true');

        enlace.appendChild(icono);
        enlace.setAttribute('aria-label', nombre);
        enlace.setAttribute('title', nombre);
        enlace.classList.add('ak-action-link');

        contenedor.classList.add('ak-action-ready');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
