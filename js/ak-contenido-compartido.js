/* AURUM · Seleccionar todo y copiar enlaces. Ejecutar en todas las páginas.
   Sustituye el script anterior dedicado únicamente a Seleccionar todo. */
(function () {
  'use strict';
  function init() {
    document.querySelectorAll('#main-content dl.codebox:not(.spoiler):not(.hidecode)').forEach(function (box) {
      var dt = box.querySelector(':scope > dt');
      var code = box.querySelector(':scope > dd code') || box.querySelector(':scope > dd pre');
      if (!dt || !code || dt.querySelector('.ak-select-all, .selectCode, [onclick*="selectCode"]')) return;
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'ak-select-all';
      button.textContent = 'Seleccionar todo';
      button.addEventListener('click', function () {
        var selection = window.getSelection();
        if (!selection) return;
        var range = document.createRange();
        range.selectNodeContents(code);
        selection.removeAllRanges();
        selection.addRange(range);
      });
      dt.appendChild(button);
    });
    document.querySelectorAll('.ak-search-post').forEach(function (post) {
      // Usa el color real del autor sin cambiar su enlace ni sus permisos.
      var author = post.querySelector('.ak-search-author [style*="color"]') || post.querySelector('.ak-search-author .usr_grp_clr');
      if (author) post.style.setProperty('--ak-aurum', getComputedStyle(author).color);
      var button = post.querySelector('.ak-copy-post');
      if (!button || button.dataset.akCopyReady) return;
      button.dataset.akCopyReady = 'true';
      var label = button.querySelector('span');
      var status = post.querySelector('.ak-search-status');
      var timer;
      function legacyCopy(url) {
        var field = document.createElement('textarea');
        field.value = url;
        field.style.cssText = 'position:fixed;top:0;left:-9999px;';
        document.body.appendChild(field);
        field.select();
        var ok = false;
        try { ok = document.execCommand('copy'); } catch (error) {}
        field.remove();
        button.focus();
        return ok;
      }
      button.addEventListener('click', async function () {
        var raw = button.getAttribute('data-post-url');
        if (!raw) return;
        var url = new URL(raw, window.location.href).href;
        var copied = false;
        try {
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(url);
            copied = true;
          }
        } catch (error) {}
        if (!copied) copied = legacyCopy(url);
        clearTimeout(timer);
        if (copied) {
          var manual = post.querySelector('.ak-search-manual-link');
          if (manual) manual.remove();
          label.textContent = 'Enlace copiado';
          status.textContent = 'Enlace del mensaje copiado.';
          timer = setTimeout(function () { label.textContent = 'Copiar enlace'; status.textContent = ''; }, 2200);
        } else {
          var field = post.querySelector('.ak-search-manual-link');
          if (!field) {
            field = document.createElement('input');
            field.type = 'text'; field.readOnly = true;
            field.className = 'ak-search-manual-link';
            field.setAttribute('aria-label', 'Enlace del mensaje: copia esta dirección');
            post.querySelector('.ak-search-meta').appendChild(field);
          }
          field.value = url; field.focus(); field.select();
          status.textContent = 'No se pudo copiar automáticamente. Copia la dirección seleccionada.';
        }
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
