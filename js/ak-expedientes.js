/* AURUM · Instalar una sola vez, en todas las páginas.
   Genera los controles; cada ficha funciona de forma independiente. */
(function () {
  'use strict';
  if (window.akExpedienteInstalado) return;
  window.akExpedienteInstalado = true;
  var contador = 0;
  var titulos = ['Presentación', 'Datos e historia', 'Extras'];

  function preparar(ficha) {
    if (ficha.dataset.akExpLista) return;
    var paneles = Array.from(ficha.children).filter(function (nodo) {
      return nodo.classList.contains('ak-exp-panel');
    });
    if (paneles.length !== 3) return;
    ficha.dataset.akExpLista = '1';

    /* Foroactivo puede insertar saltos entre etiquetas estructurales.
       Solo se retiran los saltos ajenos a los bloques de texto. */
    [ficha].concat(paneles, Array.from(ficha.querySelectorAll('.ak-exp-datos, .ak-exp-presentacion'))).forEach(function (contenedor) {
      Array.from(contenedor.children).forEach(function (nodo) {
        if (nodo.tagName === 'BR') nodo.remove();
      });
    });

    /* Evita sumar dos saltos si el foro conserva el salto de código junto al br. */
    ficha.querySelectorAll('.ak-exp-texto').forEach(function (texto) {
      Array.from(texto.childNodes).forEach(function (nodo) {
        if (nodo.nodeType !== 3) return;
        if (nodo.previousSibling && nodo.previousSibling.nodeName === 'BR') {
          nodo.textContent = nodo.textContent.replace(/^[\t ]*\r?\n/, '');
        }
        if (nodo.nextSibling && nodo.nextSibling.nodeName === 'BR') {
          nodo.textContent = nodo.textContent.replace(/\r?\n[\t ]*$/, '');
        }
      });
      texto.querySelectorAll('br').forEach(function (salto) {
        salto.replaceWith(document.createTextNode('\n'));
      });
    });

    var prefijo;
    do { prefijo = 'ak-exp-auto-' + (++contador); }
    while (document.getElementById(prefijo + '-panel-0'));
    var menu = document.createElement('div');
    menu.className = 'ak-exp-menu';
    menu.setAttribute('role', 'tablist');
    menu.setAttribute('aria-label', 'Secciones del expediente');

    var botones = paneles.map(function (panel, indice) {
      var boton = document.createElement('button');
      boton.type = 'button';
      boton.textContent = titulos[indice];
      boton.id = prefijo + '-tab-' + indice;
      boton.setAttribute('role', 'tab');
      panel.id = prefijo + '-panel-' + indice;
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', boton.id);
      panel.tabIndex = 0;
      boton.setAttribute('aria-controls', panel.id);
      menu.appendChild(boton);
      return boton;
    });

    function activar(indice, enfocar) {
      paneles.forEach(function (panel, posicion) {
        panel.hidden = posicion !== indice;
        botones[posicion].setAttribute('aria-selected', String(posicion === indice));
        botones[posicion].tabIndex = posicion === indice ? 0 : -1;
      });
      if (enfocar) botones[indice].focus();
    }
    botones.forEach(function (boton, indice) {
      boton.addEventListener('click', function () { activar(indice, false); });
      boton.addEventListener('keydown', function (evento) {
        var destino;
        if (evento.key === 'ArrowRight') destino = (indice + 1) % 3;
        if (evento.key === 'ArrowLeft') destino = (indice + 2) % 3;
        if (evento.key === 'Home') destino = 0;
        if (evento.key === 'End') destino = 2;
        if (destino !== undefined) {
          evento.preventDefault();
          activar(destino, true);
        }
      });
    });
    ficha.appendChild(menu);
    ficha.classList.add('ak-exp-lista');
    activar(0, false);
  }
  function buscar(raiz) {
    if (raiz.nodeType !== 1) return;
    if (raiz.matches('.ak-expediente')) preparar(raiz);
    raiz.querySelectorAll('.ak-expediente').forEach(preparar);
    var padre = raiz.closest('.ak-expediente');
    if (padre) preparar(padre);
  }
  function iniciar() {
    buscar(document.body);
    new MutationObserver(function (cambios) {
      cambios.forEach(function (cambio) {
        cambio.addedNodes.forEach(buscar);
      });
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  } else iniciar();
})();
