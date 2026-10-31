/* AURUM · Lectura de mensajes privados */
(function () {
  'use strict';

  function init() {
    document.querySelectorAll(
      '.ak-read-v2:not([data-ak-read-v2-ready])'
    ).forEach(function (root) {
      root.setAttribute('data-ak-read-v2-ready', 'true');

      var icons = {
        reply: 'ti-message-reply',
        edit: 'ti-pencil',
        quote: 'ti-quote'
      };

      root.querySelectorAll('[data-ak-read-control]').forEach(function (slot) {
        var link = slot.querySelector('a');

        if (!link) {
          slot.hidden = true;
          return;
        }

        var icon = document.createElement('i');
        icon.className = 'ti ' + icons[
          slot.getAttribute('data-ak-read-control')
        ];
        icon.setAttribute('aria-hidden', 'true');

        link.appendChild(icon);
        link.setAttribute(
          'aria-label',
          slot.getAttribute('data-tooltip')
        );
        link.removeAttribute('title');

        slot.classList.add('is-enhanced');
      });

      var history = root.querySelector('.ak-read-history');

      if (history) {
        var entries = history.querySelectorAll(
          '.ak-read-history-content .panel'
        );
        var count = history.querySelector('[data-ak-history-count]');

        if (entries.length && count) {
          count.textContent = ' · ' + entries.length;
        }
      }

      var capacity = root.querySelector('.ak-read-capacity');

      if (capacity && window.fetch) {
        var inbox = root.querySelector('[data-folder="inbox"] a');

        var url = new URL(
          inbox
            ? inbox.getAttribute('href')
            : '/privmsg?folder=inbox',
          window.location.href
        );

        if (url.origin !== window.location.origin) return;

        fetch(url.href, {
          credentials: 'same-origin'
        })
          .then(function (response) {
            if (!response.ok) throw new Error('No disponible');
            return response.text();
          })
          .then(function (html) {
            var doc = new DOMParser().parseFromString(
              html,
              'text/html'
            );

            var source = doc.querySelector(
              '.ak-mp:not(.ak-mp-read) .ak-mp-capacity'
            );

            if (!source || !source.textContent.trim()) return;

            var notice = source.querySelector('p');
            var value = (notice || source).textContent.trim();

            capacity.querySelector(
              '[data-ak-capacity-text]'
            ).textContent = value;

            var match = value.match(/(\d+(?:[.,]\d+)?)\s*%/);
            var bar = capacity.querySelector('progress');

            if (match && bar) {
              bar.value = Math.max(
                0,
                Math.min(100, Number(match[1].replace(',', '.')))
              );
              bar.hidden = false;
            }

            capacity.hidden = false;
          })
          .catch(function () {
            /* El mensaje funciona sin el aviso de capacidad. */
          });
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
