/* AURUM · Colocar widgets después del pie nativo, fuera de #wrap. */
(function () {
  'use strict';
  function init() {
    var root = document.getElementById('footer_widgets');
    var nativeFooter = document.getElementById('page-footer');
    if (!root || !nativeFooter || !root.querySelector('.ak-affiliates')) return;
    root.querySelectorAll('.widget').forEach(function (widget) {
      widget.classList.toggle('ak-footer-aff-widget', !!widget.querySelector('.ak-affiliates'));
      widget.classList.toggle('ak-footer-credit-widget', !!widget.querySelector('.ak-footer-credits'));
    });
    // Mover el nodo real conserva los widgets y sus eventos. Los enlaces
    // nativos, incluido el del panel de administración, permanecen intactos.
    document.body.appendChild(root);
    root.classList.add('ak-footer-ready');
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
