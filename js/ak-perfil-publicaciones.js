(function () {
  'use strict';
  /* Misma clasificación que ak-perfil-usuario.js: la pestaña Datos recibe la categoría personaje.
     Los campos ausentes se completan desde el perfil visible para el visitante. */
  var CAMPOS = {
    banner: ['banner', 'banner del perfil', 'portada', 'imagen de portada'],
    frase: ['frase', 'frase personal', 'frase del personaje'],
    recursos: ['monedas', 'experiencia', 'exp', 'puntos de experiencia'],
    generales: ['fecha de inscripcion', 'fecha de registro', 'inscrito el', 'registrado', 'mensajes', 'numero de mensajes', 'faceclaim', 'face claim', 'fc'],
    personaje: ['f de nacimiento', 'fecha de nacimiento', 'nacimiento', 'edad', 'estatura', 'altura', 'orientacion sexual', 'orientacion', 'ocupacion', 'profesion', 'intereses', 'apodos', 'apodo'],
    historia: ['historia', 'historia del personaje', 'biografia'],
    curiosidades: ['curiosidades', 'datos curiosos'],
    pareja: ['pareja', 'relacion', 'relacion sentimental'],
    imagenPareja: ['imagen de pareja', 'imagen de la pareja', 'foto de pareja', 'foto de la pareja'],
    regalos: ['regalos', 'regalos recibidos'],
    medallas: ['medallas', 'logros'],
    inventario: ['inventario', 'objetos', 'pertenencias'],
    grupo: ['grupo', 'nacion', 'reino'],
    nivel: ['nivel', 'imagen de nivel', 'banner de nivel']
  };
  function normalizar(texto) {
    return (texto || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function etiqueta(campo) {
    var label = campo.querySelector('.ak-profile-label');
    var texto = label.textContent;
    if (!texto.replace(/[:\s]/g, '')) {
      var img = label.querySelector('img');
      texto = img ? img.alt || img.title : '';
    }
    return normalizar(texto);
  }
  function destino(label) {
    return Object.keys(CAMPOS).find(function (key) {
      return CAMPOS[key].indexOf(label) !== -1;
    }) || 'otros';
  }
  function convertirImagen(campo, alt) {
    var valor = campo.querySelector('.ak-profile-value');
    if (!valor || valor.querySelector('img')) return;
    var url = valor.textContent.trim();
    if (!/^https?:\/\/[^\s<>]+$/i.test(url)) return;
    var img = document.createElement('img');
    img.src = url; img.alt = alt;
    valor.replaceChildren(img);
  }
  function vacio(contenedor, texto) {
    if (contenedor.textContent.trim() || contenedor.querySelector('img,input,select,textarea,iframe,video')) return;
    var p = document.createElement('p');
    p.className = 'ak-profile-empty'; p.textContent = texto;
    contenedor.appendChild(p);
  }
  function crearMascara(img, clase) {
    var icono = document.createElement('span');
    icono.className = 'ak-color-icon ' + clase;
    icono.setAttribute('aria-hidden', 'true');
    icono.style.setProperty('--ak-icon-url', 'url(' + JSON.stringify(img.getAttribute('src')) + ')');
    return icono;
  }
  function prepararIconos(perfil) {
    perfil.querySelectorAll('.ak-profile-tabbar button img').forEach(function (img) {
      img.replaceWith(crearMascara(img, 'ak-tab-icon'));
    });
    var imagen = perfil.querySelector('.ak-profile-rank-image img');
    if (!imagen) return;
    function ajustar() {
      if (imagen.naturalWidth) imagen.style.width = (imagen.naturalWidth / 2) + 'px';
    }
    if (imagen.complete) ajustar();
    else imagen.addEventListener('load', ajustar, {once:true});
  }

  var perfiles = new Map();
  function limpiar(nodo) {
    var copia = nodo.cloneNode(true);
    copia.querySelectorAll('script,style,.field_editable,.ajax-profil_edit,.ajax-profil_valid,input,select,textarea,button').forEach(function (el) { el.remove(); });
    [copia].concat(Array.from(copia.querySelectorAll('*'))).forEach(function (el) {
      Array.from(el.attributes).forEach(function (attr) {
        if (attr.name === 'id' || /^on/i.test(attr.name) || attr.name === 'srcdoc' ||
            (/^(href|src|action|formaction)$/i.test(attr.name) && /^\s*javascript:/i.test(attr.value))) el.removeAttribute(attr.name);
      });
    });
    return copia;
  }
  function extraerPerfil(doc) {
    var root = doc.querySelector('.perfilreal.perfil-editorial');
    if (!root) throw new Error('Perfil no disponible');
    return Array.from(root.querySelectorAll('.perfil-campo')).map(function (original) {
      var dt = original.querySelector('dt');
      var valor = original.querySelector('.field_uneditable') || original.querySelector('dd');
      if (!dt || !valor) return null;
      var campo = document.createElement('div'); campo.className = 'ak-profile-field';
      var label = document.createElement('div'); label.className = 'ak-profile-label';
      var contenido = document.createElement('div'); contenido.className = 'ak-profile-value';
      var dtLimpio = limpiar(dt), valorLimpio = limpiar(valor);
      dtLimpio.querySelectorAll('[style]').forEach(function (el) { el.style.removeProperty('color'); });
      while (dtLimpio.firstChild) label.appendChild(dtLimpio.firstChild);
      while (valorLimpio.firstChild) contenido.appendChild(valorLimpio.firstChild);
      campo.appendChild(label); campo.appendChild(contenido);
      return campo;
    }).filter(Boolean);
  }
  function cargarPerfil(url) {
    if (!perfiles.has(url)) {
      perfiles.set(url, fetch(url, {credentials:'same-origin', cache:'no-store'})
        .then(function (respuesta) {
          if (!respuesta.ok) throw new Error('Perfil no disponible');
          return respuesta.text();
        }).then(function (texto) {
          return extraerPerfil(new DOMParser().parseFromString(texto, 'text/html'));
        }));
    }
    return perfiles.get(url).then(function (campos) {
      return campos.map(function (campo) { return campo.cloneNode(true); });
    });
  }
  function iniciar() {
    document.querySelectorAll('.postprofile.ak-profile-tabs').forEach(function (perfil) {
      if (perfil.dataset.akTabsReady) return;
      perfil.dataset.akTabsReady = '1';
      prepararIconos(perfil);
      var post = perfil.closest('.post');
      var extras = post.querySelector('.ak-post-extras');
      var rank = perfil.querySelector('.ak-profile-rank-fields');
      var recursos = perfil.querySelector('.ak-profile-resources');
      var nivel = perfil.querySelector('.ak-profile-level');
      var inventario = perfil.querySelector('.ak-profile-inventory-fields');
      var reserva = perfil.querySelector('.ak-profile-unused');
      function distribuir(campos) {
        post.querySelectorAll('.ak-profile-field').forEach(function (campo) { campo.remove(); });
        post.querySelectorAll('.ak-profile-empty').forEach(function (p) { p.remove(); });
      campos.forEach(function (campo) {
        var label = etiqueta(campo);
        var key = destino(label);
        campo.dataset.akCampo = key;
        if (key === 'recursos') {
          campo.dataset.akRecurso = label === 'monedas' ? 'monedas' : 'exp';
          recursos.appendChild(campo);
        } else if (key === 'nivel') {
          convertirImagen(campo, 'Nivel del personaje'); nivel.appendChild(campo);
        } else if (key === 'grupo') rank.appendChild(campo);
        else if (key === 'inventario') inventario.appendChild(campo);
        else if (key === 'imagenPareja') {
          convertirImagen(campo, 'Pareja del personaje');
          extras.querySelector('.ak-post-partner-media').appendChild(campo);
        } else if (key === 'regalos' || key === 'medallas') {
          extras.querySelector('[data-ak-collection="' + key + '"]').appendChild(campo);
        } else if (key === 'personaje') perfil.querySelector('.ak-profile-fields').appendChild(campo);
        else reserva.appendChild(campo);
      });
      /* EXP antes que Monedas, sin duplicar ni reconstruir los campos. */
      Array.from(recursos.children).sort(function (a, b) {
        return Number(a.dataset.akRecurso === 'monedas') - Number(b.dataset.akRecurso === 'monedas');
      }).forEach(function (campo) { recursos.appendChild(campo); });
      recursos.querySelectorAll('.ak-profile-field').forEach(function (campo) {
        var label = campo.querySelector('.ak-profile-label');
        var img = label.querySelector('img');
        var nombre = campo.dataset.akRecurso === 'monedas' ? 'Monedas' : 'EXP';
        var icono = img && crearMascara(img, 'ak-resource-icon');
        label.replaceChildren();
        if (icono) label.appendChild(icono);
        var texto = document.createElement('span'); texto.textContent = nombre;
        label.appendChild(texto);
      });
      vacio(perfil.querySelector('.ak-profile-fields'), 'Sin datos del personaje visibles.');
      vacio(inventario, 'Sin inventario visible.');
      vacio(perfil.querySelector('.ak-profile-rpg'), 'Sin hoja de personaje visible.');
      vacio(extras.querySelector('[data-ak-collection="regalos"]'), 'Sin regalos visibles.');
      vacio(extras.querySelector('[data-ak-collection="medallas"]'), 'Sin medallas visibles.');
        extras.querySelector('.ak-post-partner').hidden = !extras.querySelector('.ak-post-partner-media img');
      }
      distribuir(Array.from(perfil.querySelectorAll('.ak-profile-fields > .ak-profile-field')));
      var enlace = perfil.querySelector('.ak-profile-name a[href]') || perfil.querySelector('.ak-profile-photo a[href]');
      var url = enlace && new URL(enlace.getAttribute('href'), location.href);
      if (url && url.origin === location.origin && /^\/u\d+\/?$/.test(url.pathname)) {
        cargarPerfil(url.pathname).then(function (campos) {
          if (campos.length) distribuir(campos);
        }).catch(function () {
          /* Conserva los campos locales si el perfil no es accesible. */
          var aviso = document.createElement('p');
          aviso.className = 'ak-profile-empty';
          aviso.textContent = 'No se pudieron cargar los datos adicionales del perfil.';
          perfil.querySelector('.ak-profile-fields').appendChild(aviso);
        });
      }
      var tabs = Array.from(perfil.querySelectorAll('[role="tab"]'));
      var panels = Array.from(perfil.querySelectorAll('[role="tabpanel"]'));
      function seleccionar(tab, enfocar) {
        tabs.forEach(function (item) {
          var activo = item === tab;
          item.setAttribute('aria-selected', String(activo));
          item.tabIndex = activo ? 0 : -1;
        });
        panels.forEach(function (panel) { panel.hidden = panel.id !== tab.getAttribute('aria-controls'); });
        if (enfocar) tab.focus();
      }
      tabs.forEach(function (tab, i) {
        tab.addEventListener('click', function () { seleccionar(tab, false); });
        tab.addEventListener('keydown', function (event) {
          var target;
          if (event.key === 'ArrowRight') target = (i + 1) % tabs.length;
          else if (event.key === 'ArrowLeft') target = (i + tabs.length - 1) % tabs.length;
          else if (event.key === 'Home') target = 0;
          else if (event.key === 'End') target = tabs.length - 1;
          else return;
          event.preventDefault(); seleccionar(tabs[target], true);
        });
      });
      seleccionar(tabs[0], false);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
