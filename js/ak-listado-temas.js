/* AURUM · Clasificación y composición de la lista de temas. */
(function () {
  'use strict';

  var cacheAvatares = Object.create(null);

  function normalizar(texto) {
    return (texto || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }


  /* =======================================================
     ENLACE AL ÚLTIMO MENSAJE
     ======================================================= */

  function prepararUltimoMensaje(tarjeta) {
    var fuente = tarjeta.querySelector(
      '.ak-topic-last-source, .ak-topic-last-link'
    );

    var enlace = fuente && fuente.querySelector('a');

    var etiqueta = tarjeta.querySelector(
      '.ak-topic-last-label'
    );

    if (!enlace || !etiqueta) return;

    /*
     * Foroactivo genera enlaces como #12345.
     * Ese marcador puede terminar visualmente al final del post.
     *
     * El contenedor #p12345 comienza en el encabezado real
     * del mensaje.
     */
    try {
      var destino = new URL(
        enlace.href,
        window.location.href
      );

      var idMensaje = destino.hash.replace(/^#/, '');

      if (/^\d+$/.test(idMensaje)) {
        destino.hash = 'p' + idMensaje;
        enlace.href = destino.href;
      }
    } catch (error) {
      /*
       * Si la URL no puede analizarse, se conserva
       * el destino original generado por Foroactivo.
       */
    }

    enlace.textContent = 'Último Mensaje';
    enlace.className = 'ak-topic-last-target';

    enlace.setAttribute(
      'aria-label',
      'Ir al último mensaje'
    );

    enlace.setAttribute(
      'title',
      'Ir al último mensaje'
    );

    etiqueta.replaceChildren(enlace);
  }


  /* =======================================================
     CANTIDAD TOTAL DE MENSAJES
     ======================================================= */

  function prepararCantidadMensajes(tarjeta) {
    if (
      tarjeta.dataset.akMensajesPreparados === 'true'
    ) {
      return;
    }

    var numero = tarjeta.querySelector(
      '.ak-topic-replies-number'
    );

    var etiqueta = tarjeta.querySelector(
      '.ak-topic-replies-label'
    );

    if (!numero || !etiqueta) return;

    /*
     * La variable REPLIES de Foroactivo sólo muestra
     * las respuestas. No incluye el mensaje inicial.
     */
    var respuestas = parseInt(
      numero.textContent.replace(/[^0-9]/g, ''),
      10
    );

    if (!Number.isFinite(respuestas)) return;

    var mensajes = respuestas + 1;

    numero.textContent = String(mensajes);

    etiqueta.textContent =
      mensajes === 1
        ? 'mensaje'
        : 'mensajes';

    tarjeta.dataset.akMensajesPreparados = 'true';
  }


  /* =======================================================
     CLASIFICACIÓN DE LOS TEMAS
     ======================================================= */

  function clasificarTarjeta(tarjeta) {
  var tipoEl = tarjeta.querySelector(
    '.ak-topic-type'
  );

  var estadoEl = tarjeta.querySelector(
    '.ak-topic-state'
  );

  var contenidoEl = tarjeta.querySelector(
    '.dterm'
  );

  var tipo = normalizar(
    tipoEl && tipoEl.textContent
  );

  /*
   * Consultamos tanto el elemento auxiliar como
   * el contenedor principal del tema.
   *
   * Foroactivo normalmente coloca el aviso
   * “Este tema está cerrado...” en .dterm.
   */
  var estado = normalizar(
    (
      (
        estadoEl &&
        (
          estadoEl.getAttribute('title') ||
          estadoEl.getAttribute('aria-label')
        )
      ) || ''
    ) +
    ' ' +
    (
      (
        contenidoEl &&
        (
          contenidoEl.getAttribute('title') ||
          contenidoEl.getAttribute('aria-label')
        )
      ) || ''
    )
  );

  var especial = false;

  tarjeta.classList.remove(
    'ak-especial',
    'ak-normal',
    'ak-cerrado',
    'ak-nota',
    'ak-anuncio',
    'ak-global'
  );

  if (
    tipo.indexOf('anuncio global') !== -1
  ) {
    tarjeta.classList.add('ak-global');
    especial = true;
  } else if (
    tipo.indexOf('anuncio') !== -1
  ) {
    tarjeta.classList.add('ak-anuncio');
    especial = true;
  } else if (
    tipo.indexOf('importante') !== -1 ||
    tipo.indexOf('nota') !== -1
  ) {
    tarjeta.classList.add('ak-nota');
    especial = true;
  }

  tarjeta.classList.add(
    especial
      ? 'ak-especial'
      : 'ak-normal'
  );

/*
 * Sólo los temas normales cerrados cambian a gris.
 * Las notas y anuncios conservan su aspecto dorado.
 */
if (
  !especial &&
  estado.indexOf('cerrado') !== -1
) {
  tarjeta.classList.add('ak-cerrado');
}

  prepararUltimoMensaje(tarjeta);
  prepararCantidadMensajes(tarjeta);

  return especial;
}


  /* =======================================================
     CREACIÓN DE LAS SECCIONES
     ======================================================= */

  function crearSeccion(
    modificador,
    titulo,
    tarjetas
  ) {
    if (!tarjetas.length) return null;

    var seccion = document.createElement('section');
    var encabezado = document.createElement('h2');
    var lista = document.createElement('ul');

    seccion.className =
      'ak-topics-section ' +
      'ak-topics-section--' +
      modificador;

    encabezado.className =
      'ak-topics-heading';

    encabezado.textContent = titulo;

    lista.className =
      'topiclist topics ' +
      'ak-topic-grid ' +
      'ak-topic-grid--' +
      modificador;

    tarjetas.forEach(function (tarjeta) {
      lista.appendChild(tarjeta);
    });

    if (titulo) seccion.appendChild(encabezado);
    seccion.appendChild(lista);

    return seccion;
  }


  /* =======================================================
     CONSTRUCCIÓN DEL TABLERO
     ======================================================= */

  function construirTablero(tablero) {
    if (
      tablero.dataset.akPreparado === 'true'
    ) {
      return;
    }

    var fuente = tablero.querySelector(
      '.ak-topics-source'
    );

    if (!fuente) return;

    var filas = Array.prototype.slice
      .call(fuente.children)
      .filter(function (nodo) {
        return (
          nodo.classList &&
          nodo.classList.contains('row')
        );
      });

    /* En búsqueda, conserva la secuencia original y la paginación.
       Cada tramo consecutivo utiliza la misma cuadrícula del foro. */
    if (tablero.hasAttribute('data-ak-topics-search')) {
      var resultado = document.createDocumentFragment();
      var tramo = [];
      var tipoTramo = null;
      function guardarTramo() {
        if (!tramo.length) return;
        var seccion = crearSeccion(tipoTramo ? 'staff' : 'community', null, tramo);
        if (seccion) resultado.appendChild(seccion);
        tramo = [];
      }
      filas.forEach(function (tarjeta) {
        var especial = clasificarTarjeta(tarjeta);
        if (tipoTramo !== null && especial !== tipoTramo) guardarTramo();
        tipoTramo = especial;
        tramo.push(tarjeta);
      });
      guardarTramo();
      fuente.replaceWith(resultado);
      tablero.dataset.akPreparado = 'true';
      return;
    }

    var especiales = [];
    var normales = [];

    filas.forEach(function (tarjeta) {
      if (
        tarjeta.classList.contains('ak-no-topics')
      ) {
        normales.push(tarjeta);
      } else if (clasificarTarjeta(tarjeta)) {
        especiales.push(tarjeta);
      } else {
        normales.push(tarjeta);
      }
    });

    var fragmento =
      document.createDocumentFragment();

    var equipo = crearSeccion(
      'staff',
      'Del equipo de Aurum',
      especiales
    );

    var comunidad = crearSeccion(
      'community',
      'Temas de la comunidad',
      normales
    );

    if (equipo) {
      fragmento.appendChild(equipo);
    }

    if (comunidad) {
      fragmento.appendChild(comunidad);
    }

    fuente.replaceWith(fragmento);

    tablero.dataset.akPreparado = 'true';
  }


  /* =======================================================
     OBTENCIÓN DE AVATARES
     ======================================================= */

  function obtenerAvatar(perfil) {
    var url;

    try {
      url = new URL(
        perfil,
        window.location.href
      );
    } catch (error) {
      return Promise.resolve(null);
    }

    if (
      url.origin !== window.location.origin
    ) {
      return Promise.resolve(null);
    }

    if (cacheAvatares[url.href]) {
      return cacheAvatares[url.href];
    }

    cacheAvatares[url.href] = fetch(
      url.href,
      {
        credentials: 'same-origin'
      }
    )
      .then(function (respuesta) {
        if (!respuesta.ok) {
          throw new Error(
            'No se pudo leer el perfil'
          );
        }

        return respuesta.text();
      })
      .then(function (html) {
        var documento = new DOMParser()
          .parseFromString(
            html,
            'text/html'
          );

        var imagen = documento.querySelector(
          '#main-content .perfil-avatar img'
        );

        return imagen
          ? imagen.getAttribute('src')
          : null;
      })
      .catch(function () {
        return null;
      });

    return cacheAvatares[url.href];
  }


  /* =======================================================
     INSERCIÓN DE AVATARES
     ======================================================= */

  function insertarAvatarDesdePerfil(
    tarjeta,
    recorte
  ) {
    if (recorte.querySelector('img')) return;

    if (tarjeta.dataset.akAvatarEstado) {
      return;
    }

    var autor = tarjeta.querySelector(
      '.ak-topic-last-author a[href*="/u"]'
    );

    if (!autor) {
      tarjeta.dataset.akAvatarEstado =
        'sin-perfil';

      return;
    }

    tarjeta.dataset.akAvatarEstado =
      'cargando';

    obtenerAvatar(autor.href)
      .then(function (src) {
        if (
          !src ||
          !tarjeta.isConnected ||
          recorte.querySelector('img')
        ) {
          tarjeta.dataset.akAvatarEstado =
            src
              ? 'listo'
              : 'sin-avatar';

          return;
        }

        var contenedor =
          document.createElement('span');

        var imagen =
          document.createElement('img');

        contenedor.className =
          'lastpost-avatar ' +
          'ak-topic-avatar-cargado';

        imagen.src = src;
        imagen.alt = autor.textContent.trim();
        imagen.loading = 'lazy';
        imagen.decoding = 'async';

        contenedor.appendChild(imagen);
        recorte.appendChild(contenedor);

        tarjeta.dataset.akAvatarEstado =
          'listo';
      });
  }


  /*
   * Foroactivo puede insertar el avatar después
   * de construir el HTML.
   *
   * Si no lo entrega, recuperamos la imagen desde
   * el perfil del último autor.
   */
  function acomodarAvatares(raiz) {
    (raiz || document)
      .querySelectorAll(
        '#main-content ' +
        '.ak-topics-board ' +
        'li.row'
      )
      .forEach(function (tarjeta) {
        var recorte = tarjeta.querySelector(
          '.ak-topic-crop'
        );

        var avatar = tarjeta.querySelector(
          '.lastpost-avatar'
        );

        if (!recorte) return;

        if (
          avatar &&
          !recorte.contains(avatar)
        ) {
          recorte.appendChild(avatar);
        }

        insertarAvatarDesdePerfil(
          tarjeta,
          recorte
        );
      });
  }


  /* =======================================================
     ACTUALIZACIÓN GENERAL
     ======================================================= */

  function actualizar() {
    document
      .querySelectorAll(
        '#main-content ' +
        '[data-ak-topics-board]'
      )
      .forEach(construirTablero);

    acomodarAvatares(document);
  }


  /* =======================================================
     INICIALIZACIÓN
     ======================================================= */

  function iniciar() {
    actualizar();

    var contenido = document.querySelector(
      '#main-content'
    );

    if (!contenido) return;

    var observador = new MutationObserver(
      function () {
        acomodarAvatares(contenido);
      }
    );

    observador.observe(
      contenido,
      {
        childList: true,
        subtree: true
      }
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      iniciar
    );
  } else {
    iniciar();
  }

  window.addEventListener(
    'load',
    actualizar
  );
})();
