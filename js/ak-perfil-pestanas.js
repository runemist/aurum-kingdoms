/* AURUM · Tres pestañas para el perfil editorial.
   Añadir DESPUÉS del organizador, o como código independiente en todas las páginas.
   Mantener ak-perfil-usuario.js activo. No requiere editar la plantilla. */
(function () {
  'use strict';
  var opciones = [
    { campo: 'personaje', titulo: 'Datos del personaje' },
    { campo: 'historia', titulo: 'Historia' },
    { campo: 'curiosidades', titulo: 'Curiosidades' }
  ];
  function construir(root, numero) {
    if (root.dataset.perfilPestanas === 'true') return true;
    // Espera al organizador para no alterar su distribución ni ocultación inicial.
    if (root.dataset.perfilListo !== 'true') return false;
    var secciones = opciones.map(function (opcion) {
      var slot = root.querySelector('[data-perfil-slot="' + opcion.campo + '"]');
      return slot && slot.closest('section');
    });
    if (secciones.some(function (s) { return !s; })) return false;
    if (new Set(secciones).size !== 3) return false;
    var caja = document.createElement('div');
    caja.className = 'perfil-tabs';
    var barra = document.createElement('div');
    barra.className = 'perfil-tabs-barra';
    barra.setAttribute('role', 'tablist');
    barra.setAttribute('aria-label', 'Información del personaje');
    caja.appendChild(barra);
    var botones = [];
    function activar(indice, enfocar) {
      botones.forEach(function (boton, i) {
        var activo = i === indice;
        boton.setAttribute('aria-selected', String(activo));
        boton.tabIndex = activo ? 0 : -1;
        secciones[i].hidden = !activo;
      });
      if (enfocar) botones[indice].focus();
    }
    // Primero inserta el contenedor; después mueve los nodos originales.
    secciones[0].parentNode.insertBefore(caja, secciones[0]);
    opciones.forEach(function (opcion, i) {
      var id = 'ak-perfil-' + numero + '-' + opcion.campo;
      var boton = document.createElement('button');
      boton.type = 'button';
      boton.className = 'perfil-tab';
      boton.id = id + '-tab';
      boton.textContent = opcion.titulo;
      boton.setAttribute('role', 'tab');
      boton.setAttribute('aria-controls', id + '-panel');
      boton.addEventListener('click', function () { activar(i, false); });
      boton.addEventListener('keydown', function (event) {
        var siguiente;
        if (event.key === 'ArrowRight') siguiente = (i + 1) % opciones.length;
        else if (event.key === 'ArrowLeft') siguiente = (i + opciones.length - 1) % opciones.length;
        else if (event.key === 'Home') siguiente = 0;
        else if (event.key === 'End') siguiente = opciones.length - 1;
        else return;
        event.preventDefault(); activar(siguiente, true);
      });
      botones.push(boton); barra.appendChild(boton);
      var panel = secciones[i];
      panel.classList.add('perfil-tab-panel');
      panel.id = id + '-panel';
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', boton.id);
      panel.tabIndex = 0;
      // No se clona ni se sustituye innerHTML: los eventos AJAX siguen en sus nodos.
      caja.appendChild(panel);
      if (!panel.querySelector('.perfil-campo')) {
        var vacio = document.createElement('p');
        vacio.className = 'perfil-tab-vacio';
        vacio.textContent = 'Sin información disponible.';
        panel.appendChild(vacio);
      }
    });
    activar(0, false);
    root.dataset.perfilPestanas = 'true';
    return true;
  }
  function iniciar() {
    document.querySelectorAll('.perfilreal.perfil-editorial').forEach(function (root, i) {
      if (construir(root, i + 1)) return;
      // Soporta cualquier orden de carga respecto a ak-perfil-usuario.js.
      var observador = new MutationObserver(function () {
        if (root.dataset.perfilListo !== 'true') return;
        observador.disconnect(); construir(root, i + 1);
      });
      observador.observe(root, { attributes: true, attributeFilter: ['data-perfil-listo'] });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
