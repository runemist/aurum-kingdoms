/* AURUM · Edición de perfil, Archivo personal.
   Añade presentación al formulario original, sin reconstruir sus controles. */
(function () {
  'use strict';
  var ADMIN_FIELDS = ['inventario', 'medallas', 'regalos', 'rango', 'nivel', 'imagen de nivel'];
  function normalize(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[:*]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  }
  function isEditable(control) {
    if (control.matches(':disabled') || control.readOnly || control.closest('[hidden]')) return false;
    if (control.tagName === 'INPUT' && /^(hidden|submit|reset|button|image)$/i.test(control.type)) return false;
    return control.matches('input, select, textarea, [contenteditable="true"]');
  }
  function controls(root) {
    return Array.from(root.querySelectorAll('input, select, textarea, [contenteditable="true"]'));
  }
  function hasAction(root) {
    return Array.from(root.querySelectorAll('a[href], button, input[type="button"], input[type="submit"]')).some(function (node) {
      return !node.matches(':disabled') && !node.closest('[hidden]') &&
        (node.tagName !== 'A' || !/^(#|javascript:)/i.test(node.getAttribute('href') || '#'));
    });
  }
  function init() {
    var main = document.getElementById('main-content');
    var tabs = main && main.querySelector('#tabs');
    if (!main || !tabs || main.querySelector('.ak-edit-layout')) return;
    // No aplicar esta presentación a pestañas ajenas al panel de perfil.
    var profileLinks = tabs.querySelectorAll('a[href*="mode=editprofile"]');
    if (profileLinks.length < 3) return;
    var isAdmin = String((window._userdata || {}).user_level) === '1';
    var originalChildren = Array.from(main.childNodes);
    var carrier = tabs.parentElement;
    var layout = document.createElement('section'); layout.className = 'ak-edit-layout';
    layout.setAttribute('aria-label', 'Configuración de perfil');
    var content = document.createElement('div'); content.className = 'ak-edit-content';
    var title = document.createElement('h1'); title.className = 'ak-edit-title'; title.textContent = 'Editar perfil';
    main.insertBefore(layout, main.firstChild);
    layout.appendChild(tabs); layout.appendChild(content); content.appendChild(title);
    originalChildren.forEach(function (node) {
      if (node === tabs) return;
      // El envoltorio del menú queda vacío al trasladar tabs.
      if (node === carrier && !carrier.textContent.trim() && !carrier.querySelector('input,select,textarea,iframe,img')) { carrier.remove(); return; }
      content.appendChild(node);
    });
    tabs.setAttribute('aria-label', 'Secciones del perfil');
    tabs.querySelectorAll('.activetab a').forEach(function (a) { a.setAttribute('aria-current', 'page'); });
    document.body.classList.add('ak-profile-editing');
    content.querySelectorAll('#cp-main').forEach(function (node) { node.classList.add('ak-edit-native-main'); });

    // Las anchuras inline del formulario impedían que los campos se adaptaran.
    content.querySelectorAll('input, select, textarea').forEach(function (control) {
      var width = parseFloat(control.style.width);
      if (width > 0 && width <= 80) control.classList.add('ak-edit-short');
      control.style.removeProperty('width');
    });
    content.querySelectorAll('dl > dt [style]').forEach(function (label) { label.style.removeProperty('color'); });

    var sections = [];
    // El HTML recibido coloca cada h1 de categoría justo antes de su panel.
    Array.from(content.querySelectorAll('#cp-main form > h1, #cp-main form > h2, #cp-main form > h3')).forEach(function (heading) {
      var panel = heading.nextElementSibling;
      if (!panel || !panel.classList.contains('panel')) return;
      var name = normalize(heading.textContent);
      var details = document.createElement('details'); details.className = 'ak-edit-category';
      details.dataset.akCategory = name;
      var summary = document.createElement('summary');
      var label = document.createElement('span'); label.textContent = heading.textContent.trim(); summary.appendChild(label);
      details.appendChild(summary);
      heading.before(details); heading.remove(); details.appendChild(panel);
      details.open = /registro|personalizado/.test(name);
      sections.push({ details: details, panel: panel, name: name });
    });
    function refresh() {
      sections.forEach(function (section) {
        // hidden de la propia categoría no debe impedir que vuelva a aparecer.
        var wasHidden = section.details.hidden;
        if (wasHidden) section.details.hidden = false;
        if (/personalizado|contacto/.test(section.name)) {
          section.panel.querySelectorAll('fieldset > dl').forEach(function (row) {
            var dt = row.querySelector('dt');
            if (!dt) return;
            var reserved = !isAdmin && ADMIN_FIELDS.indexOf(normalize(dt.textContent)) !== -1;
            // Evaluar antes de ocultar, para poder detectar cambios de permisos.
            var old = row.hidden; if (old) row.hidden = false;
            var editable = controls(row).some(isEditable);
            row.hidden = reserved || !editable;
          });
        }
        var useful = controls(section.panel).some(isEditable) || hasAction(section.panel);
        section.details.hidden = !useful;
      });
    }
    refresh();
    // Permitir que la validación nativa enfoque un campo en una sección cerrada.
    content.addEventListener('invalid', function (event) {
      var category = event.target.closest('details.ak-edit-category');
      if (category && !category.hidden) category.open = true;
    }, true);
    // Responder a controles que la propia página habilite o inserte más tarde.
    var scheduled = false;
    var observer = new MutationObserver(function () {
      if (scheduled) return;
      scheduled = true;
      window.setTimeout(function () { scheduled = false; refresh(); }, 30);
    });
    observer.observe(content, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'readonly'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
