/* AURUM · Organizador del perfil editorial.
   Cargar desde overall_header; no duplicar en Gestión de códigos JavaScript.
   Solo actúa dentro de .perfilreal.perfil-editorial.
   Mueve los campos originales: no duplica IDs ni controles de edición. */
(function () {
  'use strict';
  // Si tu campo tiene otro nombre, añade su etiqueta a la lista correspondiente.
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
  // Opcional: asignaciones exactas por ID, útiles para etiquetas solo con iconos.
  // Ejemplo de formato: 'field_id-10': 'historia' (sustituir por un ID real).
  var POR_ID = {};
  var GRUPOS = ['admin', 'aeris', 'cascata', 'ignis', 'lux', 'teram', 'tuono', 'umbra', 'humanos'];
  var IDS_GRUPO = {1: 'admin', 3: 'aeris', 4: 'cascata', 5: 'ignis', 6: 'lux', 7: 'teram', 8: 'tuono', 9: 'umbra'};
  // Humanos no tiene número supuesto: se reconoce por clase, campo o color.
  function normalizar(s) {
    return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }
  function etiqueta(campo) {
    var dt = campo.querySelector('dt');
    if (!dt) return '';
    var texto = dt.textContent.trim();
    if (!texto.replace(/[:\s]/g, '')) {
      var img = dt.querySelector('img');
      texto = img ? img.alt || img.title || '' : '';
    }
    return normalizar(texto);
  }
  function destino(campo) {
    if (POR_ID[campo.id]) return POR_ID[campo.id];
    var label = etiqueta(campo);
    return Object.keys(CAMPOS).find(function (key) { return CAMPOS[key].indexOf(label) !== -1; }) || 'otros';
  }
  function contenido(campo) {
    return campo && (campo.querySelector('.field_uneditable') || campo.querySelector('dd'));
  }
  function convertirImagen(campo, alt) {
    var nodo = contenido(campo);
    if (!nodo || nodo.querySelector('img')) return;
    // Acepta un campo Imagen o una URL HTTP(S) completa en un campo de texto.
    var url = nodo.textContent.trim();
    if (!/^https?:\/\/[^\s<>]+$/i.test(url)) return;
    var img = document.createElement('img'); img.src = url; img.alt = alt;
    if (nodo.classList.contains('field_uneditable')) nodo.replaceChildren(img);
    else {
      // No reemplazar un dd completo que pueda contener controles de edición.
      var visible = document.createElement('span'); visible.className = 'perfil-imagen-url';
      Array.from(nodo.childNodes).filter(function (n) { return n.nodeType === 3 || (n.nodeType === 1 && n.tagName === 'A'); }).forEach(function (n) { n.remove(); });
      visible.appendChild(img); nodo.insertBefore(visible, nodo.firstChild);
    }
  }
  function detectarGrupo(root) {
    var rank = root.querySelector('.perfil-rango');
    var nodes = [root].concat(Array.from(root.querySelectorAll('[class]')));
    var byRank = GRUPOS.find(function (g) { return rank && rank.querySelector('.ak' + g + ', .' + g + ', .ak-' + g); });
    if (byRank) return byRank;
    var byClass = GRUPOS.find(function (g) { return nodes.some(function (el) { return el.classList.contains(g) || el.classList.contains('ak-' + g); }); });
    if (byClass) return byClass;
    for (var i = 0; i < nodes.length; i++) {
      var match = nodes[i].className.match && nodes[i].className.match(/(?:^|\s)group-(\d+)(?:\s|$)/);
      if (match && IDS_GRUPO[match[1]]) return IDS_GRUPO[match[1]];
    }
    var grupo = root.querySelector('[data-perfil-slot="grupo"] .perfil-campo');
    var label = normalizar(contenido(grupo) && contenido(grupo).textContent);
    var byField = GRUPOS.find(function (g) { return label.split(' ').indexOf(g) !== -1 || (g === 'admin' && label.indexOf('administracion') !== -1); });
    if (byField) return byField;
    // Último recurso: compara el color real del nombre con las variables de grupos.
    var name = root.querySelector('.perfil-nombre [style*="color"]');
    if (!name) return null;
    var originalColor = name.style.color;
    var probe = document.createElement('span'); probe.hidden = true; root.appendChild(probe);
    probe.style.color = originalColor;
    var target = getComputedStyle(probe).color;
    var found = GRUPOS.find(function (g) {
      var value = getComputedStyle(root).getPropertyValue('--ak-' + g).trim();
      if (!value) return false;
      probe.style.color = value; return getComputedStyle(probe).color === target;
    });
    probe.remove(); return found || null;
  }
  function iniciar(root) {
    if (root.dataset.perfilListo) return;
    var slots = {};
    root.querySelectorAll('[data-perfil-slot]').forEach(function (el) { slots[el.dataset.perfilSlot] = el; });
    root.querySelectorAll('.perfil-origen > .perfil-campo').forEach(function (campo) {
      var key = destino(campo); (slots[key] || slots.otros).appendChild(campo);
      campo.dataset.perfilCampo = key;
    });
    // Orden solicitado, independientemente del orden del panel.
    ['recursos', 'generales', 'personaje'].forEach(function (key) {
      var orden = CAMPOS[key];
      Array.from(slots[key].children).sort(function (a, b) { return orden.indexOf(etiqueta(a)) - orden.indexOf(etiqueta(b)); })
        .forEach(function (campo) { slots[key].appendChild(campo); });
    });
    ['banner', 'imagenPareja', 'nivel'].forEach(function (key) {
      slots[key].querySelectorAll('.perfil-campo').forEach(function (campo) { convertirImagen(campo, key === 'nivel' ? 'Nivel del personaje' : key === 'banner' ? '' : 'Pareja del personaje'); });
    });
    if (!slots.banner.children.length) {
      var avatar = root.querySelector('.perfil-avatar img');
      if (avatar) { var fondo = document.createElement('img'); fondo.src = avatar.src; fondo.alt = ''; fondo.className = 'perfil-banner-respaldo'; slots.banner.appendChild(fondo); }
    }
    var grupo = detectarGrupo(root);
    if (grupo) root.classList.add(grupo);
    var simbolo = root.querySelector('.perfil-simbolo');
    if (grupo) simbolo.setAttribute('aria-label', 'Emblema de ' + grupo);
    else simbolo.setAttribute('aria-label', 'Emblema de Aurum');
    root.querySelectorAll('[data-perfil-section]').forEach(function (section) { section.hidden = !section.querySelector('.perfil-campo'); });
    root.dataset.perfilListo = 'true';
  }
  function ready() { document.querySelectorAll('.perfilreal.perfil-editorial').forEach(iniciar); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();

/* Nombres de los iconos y eliminación del cartel original */
(function () {
  function prepararEtiquetas() {
    var enlaces = [
      ['a:has(#i_icon_pm)', 'Enviar mensaje privado'],
      ['#field_id2 a', 'Expediente'],
      ['#field_id3 a', 'Cronología'],
      ['#field_id5 a', 'Diario'],
      ['#field_id4 a', 'Relaciones'],
      ['a[href^="/sta/"]', 'Temas del personaje'],
      ['a[href^="/spa/"]', 'Mensajes del personaje']
    ];

    document.querySelectorAll(
      ".perfil-editorial .perfil-contactos"
    ).forEach(function (barra) {
      enlaces.forEach(function (dato) {
        barra.querySelectorAll(dato[0]).forEach(function (enlace) {
          enlace.setAttribute("data-perfil-ayuda", dato[1]);
          enlace.setAttribute("aria-label", dato[1]);
          enlace.removeAttribute("title");

          enlace.querySelectorAll("[title]").forEach(function (elemento) {
            elemento.removeAttribute("title");
          });
        });
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", prepararEtiquetas);
  } else {
    prepararEtiquetas();
  }

  window.addEventListener("load", prepararEtiquetas);
})();

(function () {
  function configurarIconos() {
    const perfil = document.querySelector(".perfil-editorial");
    if (!perfil) return;

    function actualizar() {
      perfil.querySelectorAll(
        '.perfil-recursos .perfil-campo'
      ).forEach(function (campo) {
        const imagen = campo.querySelector(".pslabel img");
        if (!imagen) return;

        const mascara = 'url(' + JSON.stringify(imagen.src) + ')';

        if (campo.style.getPropertyValue("--perfil-icono") !== mascara) {
          campo.style.setProperty("--perfil-icono", mascara);
        }
      });
    }

    actualizar();

    new MutationObserver(actualizar).observe(perfil, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src"]
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", configurarIconos);
  } else {
    configurarIconos();
  }
})();

/* Añadir después del organizador del perfil. Conserva los campos originales. */
(function () {
  'use strict';
  function montar(root) {
    if (root.dataset.parejaLista || root.dataset.perfilListo !== 'true') return;
    var section = root.querySelector('.perfil-pareja');
    if (!section) return;
    function campo(id) { return root.querySelector('[id="' + id + '"]'); }
    var nombre = campo('field_id18');
    var imagen = campo('field_id19');
    var descripcion = campo('field_id12');
    var frase = campo('field_id20');
    if (!nombre || !imagen || !descripcion || !frase) return;
    var titulo = section.querySelector('.perfil-titulo');
    var body = section.querySelector('.perfil-pareja-body');
    var zonaImagen = section.querySelector('[data-perfil-slot="imagenPareja"]');
    var zonaTexto = section.querySelector('[data-perfil-slot="pareja"]');
    if (!titulo || !body || !zonaImagen || !zonaTexto) return;
    // El título admite el campo editable completo sin duplicarlo.
    var encabezado = document.createElement('div');
    encabezado.className = titulo.className + ' pareja-nombre';
    encabezado.appendChild(nombre);
    titulo.replaceWith(encabezado);
    zonaImagen.appendChild(imagen);
    zonaTexto.classList.add('pareja-descripcion');
    zonaTexto.appendChild(descripcion);
    var cita = document.createElement('div');
    cita.className = 'pareja-frase';
    cita.appendChild(frase);
    body.appendChild(cita);
    section.classList.add('pareja-editorial');
    section.hidden = false;
    root.dataset.parejaLista = 'true';
    root.querySelectorAll('[data-perfil-section]').forEach(function (zona) {
      if (!zona.querySelector('.perfil-campo')) zona.hidden = true;
    });
  }
  function iniciar() {
    document.querySelectorAll('.perfil-editorial').forEach(function (root) {
      montar(root);
      if (root.dataset.parejaLista) return;
      var observer = new MutationObserver(function () {
        observer.disconnect();
        montar(root);
        if (!root.dataset.parejaLista) observar();
      });
      function observar() {
        observer.observe(root, { childList: true, subtree: true,
          attributes: true, attributeFilter: ['data-perfil-listo'] });
      }
      observar();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
