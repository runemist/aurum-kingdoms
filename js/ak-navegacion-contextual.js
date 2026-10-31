/* Aurum · ruta en navbar y botones de publicación.
   Activar en todas las páginas, junto al JS actual de la navbar. */
(() => {
  'use strict';

  function install() {
    const nav = document.getElementById('ak-nav-test');
    const center = nav?.querySelector('.ak-nav-center');
    if (!center) return false;
    if (nav.querySelector('.ak-nav-middle')) return true;

    const middle = document.createElement('div');
    middle.className = 'ak-nav-middle';
    center.before(middle);
    middle.append(center);

    const source = document.querySelector(
      '#main-content .topic-actions .pathname-box p, ' +
      '#main-content .topic-actions p.path'
    );
    if (source) {
      const route = document.createElement('div');
      route.className = 'ak-nav-route';
      route.setAttribute('aria-label', 'Ruta de navegación');
      const links = [...source.querySelectorAll('a[href]')];
      links.forEach((link, index) => {
        if (index === 0 && links.length > 1) return;
        const copy = link.cloneNode(true);
        copy.title = copy.textContent.trim();
        if (index === links.length - 1) {
          copy.setAttribute('aria-current', 'page');
        }
        if (route.children.length) {
          const separator = document.createElement('span');
          separator.className = 'ak-nav-route-separator';
          separator.textContent = '›';
          separator.setAttribute('aria-hidden', 'true');
          route.append(separator);
        }
        route.append(copy);
      });
      if (route.children.length) {
        middle.prepend(route);
        document.body.classList.add('ak-route-ready');
      }
    }

    document.querySelectorAll('#main-content .topic-actions .buttons a[href]')
      .forEach(link => {
        const url = new URL(link.href, location.href);
        if (url.pathname !== '/post') return;
        const mode = url.searchParams.get('mode');
        if (mode !== 'newtopic' && mode !== 'reply') return;
        const image = link.querySelector('img');
        const alt = image?.alt || '';
        const label = /cerrad|locked|closed/i.test(alt)
          ? (alt || 'Tema cerrado')
          : mode === 'newtopic' ? 'Nuevo tema' : 'Responder';
        link.classList.add('ak-publish-button');
        link.setAttribute('aria-label', label);
        link.title = label;
        if (image) image.hidden = true;
        const text = document.createElement('span');
        text.textContent = label;
        link.append(text);
      });
    document.body.classList.add('ak-actions-ready');
    return true;
  }

  function start() {
    if (install()) return;
    const observer = new MutationObserver(() => {
      if (install()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 15000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
