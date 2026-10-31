/* AURUM · Gabinete de mensajes privados */
(function () {
  'use strict';

  /*
   * Imagen nativa de MP sin leer observada en tu foro.
   * Si la cambias desde el panel, actualiza este nombre.
   */
  var UNREAD_IMAGES = ['abSKV18.png'];

  function filename(url) {
    return String(url || '').split(/[?#]/)[0].split('/').pop();
  }

  function init() {
    document.querySelectorAll('.ak-mp:not([data-ak-ready])').forEach(function (root) {
      root.setAttribute('data-ak-ready', 'true');

      var folder = new URLSearchParams(window.location.search).get('folder') || 'inbox';

      var titles = {
        inbox: 'Bandeja de entrada',
        sentbox: 'Elementos enviados',
        outbox: 'Bandeja de envío',
        savebox: 'Elementos guardados'
      };

      var title = root.querySelector('[data-ak-folder-title]');

      if (title) {
        title.textContent = titles[folder] || titles.inbox;
      }

      var personLabel = root.querySelector('.ak-mp-person-label');

      if (personLabel && (folder === 'sentbox' || folder === 'outbox')) {
        personLabel.textContent = 'Destinatario';
      }

      /* Carpetas: conserva los enlaces generados por Foroactivo. */
      root.querySelectorAll('.ak-mp-folders li').forEach(function (item) {
        var span = item.querySelector('span');
        var link = span.querySelector('a');
        var name = item.getAttribute('data-folder');

        if (link) {
          link.textContent = titles[name];
        } else {
          span.textContent = titles[name];
        }

        var active = name === folder;

        item.classList.toggle('is-active', active);

        if (active && link) {
          link.setAttribute('aria-current', 'page');
        }
      });

      /* Dorado para mensajes sin leer; gris para los leídos. */
      root.querySelectorAll('.ak-mp-row').forEach(function (row) {
        var source = row.getAttribute('data-folder-image');

        var unread = UNREAD_IMAGES.some(function (image) {
          return source === image || filename(source) === filename(image);
        });

        row.classList.toggle('is-unread', unread);

        row.querySelector('.ak-mp-emblem').setAttribute(
          'aria-label',
          unread ? 'Sin leer' : 'Leído'
        );
      });

      /* Indicador de capacidad de la bandeja. */
      var capacity = root.querySelector('.ak-mp-capacity');

      if (capacity) {
        var match = capacity.textContent.match(/(\d+(?:[.,]\d+)?)\s*%/);
        var bar = capacity.querySelector('progress');

        if (match && bar) {
          bar.value = Math.max(
            0,
            Math.min(100, Number(match[1].replace(',', '.')))
          );

          bar.hidden = false;
        }
      }

      /* Marcar y desmarcar todos los mensajes del listado. */
      root.querySelectorAll('[data-ak-mark]').forEach(function (action) {
        action.addEventListener('click', function (event) {
          event.preventDefault();

          var checked = action.getAttribute('data-ak-mark') === 'all';

          root.querySelectorAll('input[name="mark[]"]').forEach(function (box) {
            box.checked = checked;
          });
        });
      });

      /*
       * Conserva los enlaces nativos de responder, citar y editar.
       * Sustituye únicamente su presentación por íconos Tabler.
       */
      root.querySelectorAll('.post-icon a, .profile-icons a').forEach(function (link) {
        var img = link.querySelector('img');

        if (!img) return;

        var url = new URL(link.href, window.location.href);
        var mode = url.searchParams.get('mode');

        var actions = {
          post: ['ti-message-plus', 'Nuevo mensaje'],
          reply: ['ti-arrow-back-up', 'Responder'],
          quote: ['ti-quote', 'Citar'],
          edit: ['ti-pencil', 'Editar']
        };

        var info = actions[mode];

        if (!info) return;

        link.classList.add('ak-mp-native-action');

        var icon = document.createElement('i');
        icon.className = 'ti ' + info[0];
        icon.setAttribute('aria-hidden', 'true');

        var text = document.createElement('span');
        text.textContent = info[1];

        link.appendChild(icon);
        link.appendChild(text);
        link.setAttribute('aria-label', info[1]);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
