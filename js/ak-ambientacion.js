(() => {
  function iniciar() {
    const root = document.querySelector('.ak-world');

    if (!root || root.dataset.iniciado) return;

    root.dataset.iniciado = '1';

    /* =========================================
       PESTAÑAS
       ========================================= */

    root.querySelectorAll('[role="tablist"]').forEach(list => {
      const tabs = Array.from(list.children).filter(el => {
        return el.getAttribute('role') === 'tab';
      });

      function activar(tab, enfocar = false) {
        tabs.forEach(item => {
          const active = item === tab;
          const panelId = item.getAttribute('aria-controls');
          const panel = document.getElementById(panelId);

          item.setAttribute('aria-selected', String(active));
          item.tabIndex = active ? 0 : -1;

          if (panel) {
            panel.hidden = !active;
          }
        });

        if (enfocar) {
          tab.focus();
        }
      }

      tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => {
          activar(tab);
        });

        tab.addEventListener('keydown', event => {
          let next;

          if (event.key === 'ArrowRight') {
            next = (i + 1) % tabs.length;
          } else if (event.key === 'ArrowLeft') {
            next = (i + tabs.length - 1) % tabs.length;
          } else if (event.key === 'Home') {
            next = 0;
          } else if (event.key === 'End') {
            next = tabs.length - 1;
          } else {
            return;
          }

          event.preventDefault();
          activar(tabs[next], true);
        });
      });
    });

    /* =========================================
       GALERÍAS DE IMÁGENES
       ========================================= */

    root.querySelectorAll('.ak-gallery').forEach(gallery => {
      const main = gallery.querySelector('.ak-gallery-main');

      const buttons = Array.from(
        gallery.querySelectorAll('.ak-gallery-thumbs button')
      );

      if (!main || !buttons.length) return;

      function mostrar(button) {
        const source = button.querySelector('img');

        if (!source) return;

        const img = document.createElement('img');

        img.src = source.currentSrc || source.src;
        img.alt = source.alt;

        main.replaceChildren(img);

        buttons.forEach(item => {
          item.setAttribute(
            'aria-pressed',
            String(item === button)
          );
        });
      }

      buttons.forEach(button => {
        button.addEventListener('click', () => {
          mostrar(button);
        });
      });

      mostrar(buttons[0]);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar, {
      once: true
    });
  } else {
    iniciar();
  }
})();
