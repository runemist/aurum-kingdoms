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
    // Solo trasladar el panel: los módulos anteriores (p. ej. publicidad)
    // no deben quedar entre el título y los formularios. Se conservan fuera.
    var reachedTabs = carrier === main;
    originalChildren.forEach(function (node) {
      if (node === carrier) reachedTabs = true;
      if (node === tabs) return;
      if (!reachedTabs) return;
      // El envoltorio del menú queda vacío al trasladar tabs.
      if (node === carrier && !carrier.textContent.trim() && !carrier.querySelector('input,select,textarea,iframe,img')) { carrier.remove(); return; }
      content.appendChild(node);
    });
    tabs.setAttribute('aria-label', 'Secciones del perfil');
    var tabIcons = {
      'informaciones': 'ti-user', 'preferencias': 'ti-settings',
      'firma': 'ti-pencil', 'avatar': 'ti-photo',
      'amigos e ignorados': 'ti-users', 'miembros que sigue': 'ti-user-plus',
      'notificaciones': 'ti-bell', 'temas supervisados': 'ti-eye',
      'favoritos': 'ti-star', 'borradores de mensajes': 'ti-file-text',
      'borradores de temas': 'ti-files', 'hoja de personaje': 'ti-book'
    };
    tabs.querySelectorAll('a').forEach(function (a) {
      if (a.querySelector('.ak-edit-tab-icon')) return;
      var name = normalize(a.textContent);
      var icon = document.createElement('i');
      icon.className = 'ti ak-edit-tab-icon ' + (tabIcons[name] || 'ti-folder');
      icon.setAttribute('aria-hidden', 'true'); a.prepend(icon);
    });
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
    var activeTab = normalize(tabs.querySelector('.activetab')?.textContent);
    var isInformation = activeTab === 'informaciones';
    if (isInformation) {
      content.querySelectorAll('#cp-main form').forEach(function (form) {
        var pairs = Array.from(form.children).filter(function (node) {
          return /^H[1-3]$/.test(node.tagName) && node.nextElementSibling?.classList.contains('panel');
        }).map(function (heading) { return { heading: heading, panel: heading.nextElementSibling, name: normalize(heading.textContent) }; });
        var registration = pairs.find(function (item) { return /registro/.test(item.name); });
        var custom = pairs.find(function (item) { return /personalizado/.test(item.name); });
        var contact = pairs.find(function (item) { return /contacto/.test(item.name); });
        var exportData = pairs.find(function (item) { return /exportacion/.test(item.name); });
        if (!pairs.length || (!registration && !custom && !contact)) return;
        var fragment = document.createDocumentFragment();
        var groups = {};
        [
          ['registro', 'Información de Registro'],
          ['contacto', 'Campos de Contacto'],
          ['personaje', 'Datos del Personaje'],
          ['historia', 'Historia y Curiosidades'],
          ['pareja', 'Campos de Pareja']
        ].forEach(function (definition) {
          var details = document.createElement('details'); details.className = 'ak-edit-category';
          details.dataset.akCategory = normalize(definition[1]);
          var summary = document.createElement('summary');
          var label = document.createElement('span'); label.textContent = definition[1]; summary.appendChild(label);
          var body = document.createElement('div'); body.className = 'ak-edit-group-body';
          details.append(summary, body); details.open = false; fragment.appendChild(details);
          var section = { details: details, panel: body, name: normalize(definition[1]), kind: definition[0] };
          sections.push(section); groups[definition[0]] = section;
        });
        pairs[0].heading.before(fragment);
        if (registration) { groups.registro.panel.appendChild(registration.panel); registration.heading.remove(); }
        if (exportData) { groups.registro.panel.appendChild(exportData.panel); exportData.heading.remove(); }
        if (contact) { groups.contacto.panel.appendChild(contact.panel); contact.heading.remove(); }
        if (custom) {
          groups.personaje.panel.appendChild(custom.panel); custom.heading.remove();
          var storyFields = document.createElement('fieldset'); groups.historia.panel.appendChild(storyFields);
          var coupleFields = document.createElement('fieldset'); groups.pareja.panel.appendChild(coupleFields);
          Array.from(custom.panel.querySelectorAll('fieldset > dl')).forEach(function (row) {
            var name = normalize(row.querySelector('dt')?.textContent);
            if (name === 'historia' || name === 'curiosidades') storyFields.appendChild(row);
            else if (name.indexOf('pareja') !== -1) coupleFields.appendChild(row);
          });
        }
      });
    }

    // Botones compactos: los iconos delegan en el control nativo original.
    // Así se conservan name/value, validación, clics y eventos de envío/reset.
    var actionPairs = [];
    content.querySelectorAll('form').forEach(function (form) {
      var originals = Array.from(form.querySelectorAll('.submit-buttons input[type="submit"], .submit-buttons input[type="reset"], .submit-buttons button[type="submit"], .submit-buttons button[type="reset"]'))
        .filter(function (control) { return control.form === form; });
      if (!originals.length) return;
      var top = document.createElement('div'); top.className = 'ak-edit-actions ak-edit-actions-top'; top.setAttribute('role', 'group'); top.setAttribute('aria-label', 'Acciones del formulario');
      var bottom = document.createElement('div'); bottom.className = 'ak-edit-actions ak-edit-actions-bottom'; bottom.setAttribute('role', 'group'); bottom.setAttribute('aria-label', 'Acciones del formulario');
      originals.forEach(function (original) {
        var reset = original.type === 'reset';
        var raw = (original.value || original.textContent || '').trim();
        var label = reset ? 'Reiniciar formulario' : /registrar|guardar|submit|save/i.test(raw) ? 'Guardar cambios' : raw || 'Enviar formulario';
        original.classList.add('ak-edit-native-action');
        [top, bottom].forEach(function (bar) {
          var button = document.createElement('button'); button.type = 'button'; button.className = 'ak-edit-action';
          button.setAttribute('aria-label', label); button.dataset.tooltip = label;
          var icon = document.createElement('i'); icon.className = 'ti ' + (reset ? 'ti-rotate-clockwise' : 'ti-device-floppy'); icon.setAttribute('aria-hidden', 'true'); button.appendChild(icon);
          button.disabled = original.disabled;
          button.addEventListener('click', function () { if (!original.disabled) original.click(); });
          bar.appendChild(button); actionPairs.push({ original: original, button: button });
        });
      });
      form.prepend(top);
      var footer = originals[originals.length - 1].closest('.submit-buttons');
      // Quitar únicamente el espaciado de texto entre los controles originales.
      Array.from(footer.childNodes).forEach(function (node) { if (node.nodeType === 3 && !node.textContent.trim()) node.remove(); });
      footer.appendChild(bottom);
    });
    function refresh() {
      actionPairs.forEach(function (pair) { pair.button.disabled = pair.original.disabled; });
      sections.forEach(function (section) {
        // hidden de la propia categoría no debe impedir que vuelva a aparecer.
        var wasHidden = section.details.hidden;
        if (wasHidden) section.details.hidden = false;
        if (section.kind !== 'registro') {
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
