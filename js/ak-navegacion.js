/* AURUM · Navbar con iconos. Reemplaza la versión anterior. */
(() => {
  'use strict';

  /* ENLACES EDITABLES: etiqueta, dirección e icono Tabler. */
  const QUICK_LINKS = [
    ['Reglamento', '/f4-reglamento', 'ti-scroll'],
    ['Ambientación', '/f5-ambientacion', 'ti-book'],
    ['Grupos', '/groups', 'ti-users'],
    ['Registros', '/f8-registros', 'ti-writing'],
    ['Expedientes', '/f7-expedientes', 'ti-folder'],
    ['Búsquedas', '/f9-busquedas', 'ti-search'],
    ['Gestiones', '/f6-gestiones-de-los-usuarios', 'ti-settings'],
    ['Miembros', '/memberlist', 'ti-address-book']
  ];
  /* Enlaces personales opcionales. Los cuatro principales se crean solos. */
  const PERSONAL_LINKS = [];
  /* Mismo icono nativo de MP sin leer que utiliza el buzón instalado. */
  const UNREAD_IMAGES = ['abSKV18.png'];
  const MAX_INBOX_PAGES = 20;

  function start() {
    if (document.getElementById('ak-nav-test')) return;
    const original = document.querySelector('#page-header .navlinks');
    if (!original) return;
    const fallbackAvatar = 'https://2img.net/i.imgur.com/J1trx1b.png';
    const nav = document.createElement('nav');
    nav.id = 'ak-nav-test';
    nav.dataset.akVersion = '2';
    nav.setAttribute('aria-label', 'Navegación de Aurum');

    function icon(name) {
      const node = document.createElement('i');
      node.className = 'ti ' + name;
      node.setAttribute('aria-hidden', 'true');
      return node;
    }
    function safeURL(value) {
      try {
        const url = new URL(String(value || ''), location.href);
        return value && /^https?:$/.test(url.protocol) ? url.href : '';
      } catch (_) { return ''; }
    }
    function readUser() {
      const data = window._userdata || {};
      const logged = data.session_logged_in !== undefined
        ? data.session_logged_in === true || String(data.session_logged_in) === '1'
        : !!original.querySelector('#logout');
      if (!logged) return { logged: false, name: 'Invitado', avatar: fallbackAvatar, href: '' };
      const id = String(data.user_id || '');
      const profile = [...document.querySelectorAll('#fa_usermenu a[href]')].find(a => {
        const url = new URL(a.href, location.href);
        return url.origin === location.origin && /^\/u[1-9]\d*\/?$/.test(url.pathname);
      });
      const name = String(data.username || '').trim() ||
        document.querySelector('#fa_welcome')?.textContent.replace(/^Bienvenid[oa](?:\/[ao])?[\s,:]*/i, '').trim() || 'Usuario';
      let avatar = safeURL(data.avatar_link);
      if (!avatar && data.avatar) avatar = safeURL(new DOMParser().parseFromString(String(data.avatar), 'text/html').querySelector('img')?.getAttribute('src'));
      if (!avatar) avatar = safeURL(document.querySelector('#fa_usermenu img')?.getAttribute('src'));
      return { logged: true, name, avatar: avatar || fallbackAvatar,
        href: /^[1-9]\d*$/.test(id) ? '/u' + id : profile?.getAttribute('href') || '' };
    }
    const user = readUser();
    const left = document.createElement('div'); left.className = 'ak-nav-left';
    const center = document.createElement('div'); center.className = 'ak-nav-center';
    const right = document.createElement('div'); right.className = 'ak-nav-right';
    const actions = document.createElement('div'); actions.className = 'ak-nav-actions';
    const account = document.createElement('div'); account.className = 'ak-nav-user';
    nav.append(left, center, right); left.append(account); right.append(actions);

    function control(tag, label, glyph, href) {
      const element = document.createElement(tag);
      element.className = 'ak-nav-icon';
      element.setAttribute('aria-label', label);
      element.dataset.tooltip = label;
      if (tag === 'button') element.type = 'button';
      if (href) element.href = href;
      element.append(icon(glyph));
      return element;
    }
    function panel(id, label) {
      const element = document.createElement('aside');
      element.id = id; element.className = 'ak-nav-drawer'; element.hidden = true;
      element.setAttribute('aria-label', label);
      return element;
    }
    function entry(parent, label, href, glyph) {
      const url = safeURL(href); if (!url) return null;
      const a = document.createElement('a'); a.href = url;
      if (glyph && !parent.classList.contains('ak-nav-personal-links')) a.append(icon(glyph));
      const text = document.createElement('span'); text.textContent = label; a.append(text);
      parent.append(a); return a;
    }
    const personal = panel('ak-nav-personal', 'Menú personal');
    const quick = panel('ak-nav-quick', 'Enlaces rápidos');
    const notificationFallback = panel('ak-nav-notice', 'Notificaciones');
    notificationFallback.innerHTML = '<h2>Notificaciones</h2><p>Las notificaciones aún no están disponibles. Comprueba que la toolbar nativa esté activada.</p>';
    const home = control('a', 'Inicio', 'ti-home', '/');
    const quickButton = control('button', 'Enlaces rápidos', 'ti-layout-grid');
    quickButton.setAttribute('aria-controls', quick.id);
    quickButton.setAttribute('aria-expanded', 'false');
    center.append(home, quickButton);
    const quickHeading = document.createElement('h2'); quickHeading.textContent = 'Enlaces rápidos';
    const quickGrid = document.createElement('div'); quickGrid.className = 'ak-nav-quick-grid';
    QUICK_LINKS.forEach(([label, href, glyph]) => entry(quickGrid, label, href, glyph));
    quick.append(quickHeading, quickGrid);

    const avatar = document.createElement('img'); avatar.className = 'ak-nav-mini-avatar'; avatar.alt = ''; avatar.src = user.avatar;
    const nameLink = document.createElement('a'); nameLink.className = 'ak-nav-profile';
    const strong = document.createElement('strong'); strong.textContent = user.name; nameLink.append(strong);
    if (user.href) nameLink.href = user.href;
    nameLink.setAttribute('aria-label', user.logged ? 'Ver mi perfil' : 'Invitado');
    const personalButton = control('button', 'Menú personal', 'ti-chevron-down');
    personalButton.setAttribute('aria-controls', personal.id);
    personalButton.setAttribute('aria-expanded', 'false');
    account.append(avatar, nameLink, personalButton);
    const portrait = document.createElement('img'); portrait.className = 'ak-nav-portrait'; portrait.src = user.avatar; portrait.alt = user.name;
    const personalHeading = document.createElement('h2'); personalHeading.textContent = user.name;
    const personalGrid = document.createElement('div'); personalGrid.className = 'ak-nav-personal-links';
    personal.append(portrait, personalHeading, personalGrid);
    let ownProfile, ownTopics, ownPosts;
    if (user.logged) {
      ownProfile = entry(personalGrid, 'Ver perfil', user.href, 'ti-user');
      entry(personalGrid, 'Editar perfil', '/profile?mode=editprofile', 'ti-pencil');
      const query = encodeURIComponent(user.name);
      ownTopics = entry(personalGrid, 'Mis temas', user.href ? '/sta' + user.href : '/search?search_keywords=&search_author=' + query + '&show_results=topics', 'ti-messages');
      ownPosts = entry(personalGrid, 'Mis mensajes', user.href ? '/spa' + user.href : '/search?search_keywords=&search_author=' + query + '&show_results=posts', 'ti-file-text');
      PERSONAL_LINKS.forEach(([label, href, glyph]) => entry(personalGrid, label, href, glyph));
    } else {
      entry(personalGrid, 'Conectarse', '/login', 'ti-login');
      entry(personalGrid, 'Registrarse', '/register', 'ti-user-plus');
    }

    let notificationButton, mpLink, mpBadge, notificationBadge;
    function badge(parent) {
      const node = document.createElement('span'); node.className = 'ak-nav-badge'; node.hidden = true;
      node.setAttribute('aria-hidden', 'true'); parent.append(node); return node;
    }
    function countState(parent, node, label, count) {
      const number = Math.max(0, Math.floor(Number(count) || 0));
      const text = number > 99 ? '99+' : String(number);
      if (node.textContent !== text) node.textContent = text;
      if (node.hidden !== (number === 0)) node.hidden = number === 0;
      parent.classList.toggle('has-unread', number > 0);
      const title = number ? label + ': ' + number + ' sin leer' : label;
      if (parent.getAttribute('aria-label') !== title) parent.setAttribute('aria-label', title);
      if (parent.dataset.tooltip !== title) parent.dataset.tooltip = title;
    }
    if (user.logged) {
      notificationButton = control('button', 'Notificaciones', 'ti-bell');
      notificationButton.setAttribute('aria-controls', 'notif_list');
      notificationButton.setAttribute('aria-expanded', 'false');
      notificationBadge = badge(notificationButton);
      mpLink = control('a', 'Mensajes privados', 'ti-mail', '/privmsg?folder=inbox');
      mpBadge = badge(mpLink);
      actions.append(notificationButton, mpLink);
      const logout = original.querySelector('#logout');
      if (logout) actions.append(control('a', 'Desconectarse', 'ti-logout', logout.href));
    } else {
      actions.append(control('a', 'Conectarse', 'ti-login', '/login'), control('a', 'Registrarse', 'ti-user-plus', '/register'));
    }

    let opened = '';
    function setPanel(kind, focus) {
      opened = kind;
      if (kind) document.body.dataset.akNavOpen = kind;
      else delete document.body.dataset.akNavOpen;
      personal.hidden = kind !== 'personal'; quick.hidden = kind !== 'quick';
      notificationFallback.hidden = kind !== 'notifications' || !!document.getElementById('notif_list');
      personalButton.setAttribute('aria-expanded', String(kind === 'personal'));
      quickButton.setAttribute('aria-expanded', String(kind === 'quick'));
      notificationButton?.setAttribute('aria-expanded', String(kind === 'notifications'));
      if (focus) {
        if (kind === 'personal') personal.querySelector('a')?.focus();
        if (kind === 'quick') quick.querySelector('a')?.focus();
      }
    }
    personalButton.addEventListener('click', () => setPanel(opened === 'personal' ? '' : 'personal', true));
    avatar.addEventListener('click', () => personalButton.click());
    quickButton.addEventListener('click', () => setPanel(opened === 'quick' ? '' : 'quick', true));
    notificationButton?.addEventListener('click', () => {
      if (opened === 'notifications') { setPanel(''); return; }
      // La apertura es nuestra; no alternar el botón oculto ni provocar
      // el marcado automático de lectura que hace la toolbar al cerrarse.
      const api = window.FA?.Notification;
      if (api && typeof api.register === 'function' &&
          (typeof api.registered !== 'function' || !api.registered())) api.register();
      document.getElementById('fa_right')?.classList.remove('notification');
      setPanel('notifications');
      syncNative();
    });
    document.addEventListener('click', event => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const mark = target.closest('[data-ak-mark-notifications]');
      if (mark) { event.preventDefault(); markAllNotifications(mark); return; }
      if (!target.closest('#ak-nav-test, #ak-nav-personal, #ak-nav-quick, #notif_list, #ak-nav-notice')) setPanel('');
    });
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !opened) return;
      const trigger = opened === 'personal' ? personalButton : opened === 'quick' ? quickButton : notificationButton;
      setPanel(''); trigger?.focus();
    });
    document.body.append(nav, personal, quick, notificationFallback);
    document.body.classList.add('ak-nav-testing');

    let marking = false, markTimeout;
    function nativeUnreadCount() {
      const stored = window._toolbar?.notifications?.unread;
      if (typeof stored === 'number' && Number.isFinite(stored)) return Math.max(0, stored);
      const digits = (document.getElementById('notif_unread')?.textContent || '').match(/\d+/);
      return digits ? Number(digits[0]) : 0;
    }
    function enhanceNotifications(list) {
      if (!list) return;
      if (list.getAttribute('aria-label') !== 'Notificaciones') list.setAttribute('aria-label', 'Notificaciones');
      list.querySelectorAll('.contentText').forEach(node => {
        if (node.dataset.akExpanded) return;
        // Restaurar el contenido si el truncador nativo ya lo había acortado.
        if (window.jQuery?.fn?.dotdotdot) window.jQuery(node).trigger('destroy');
        node.classList.remove('ellipsis');
        node.dataset.akExpanded = 'true';
      });
      list.querySelectorAll('a.delete').forEach(link => {
        if (!link.hasAttribute('aria-label')) link.setAttribute('aria-label', 'Eliminar esta notificación');
      });
      const seeAll = list.querySelector('li.see_all');
      if (!seeAll) return;
      let row = list.querySelector('.ak-notif-mark');
      if (!row) {
        row = document.createElement('li'); row.className = 'ak-notif-mark';
        const button = document.createElement('button'); button.type = 'button';
        button.dataset.akMarkNotifications = 'true';
        button.textContent = 'Marcar todas como leídas';
        row.append(button); list.insertBefore(row, seeAll);
      }
      // No envolver ni reordenar los avisos: la toolbar usa sus índices.
      if (list.lastElementChild !== seeAll) list.append(seeAll);
      if (row.nextElementSibling !== seeAll) list.insertBefore(row, seeAll);
      const button = row.querySelector('button');
      const available = typeof window.FA?.Notification?.markAsRead === 'function';
      button.disabled = marking || !available || nativeUnreadCount() === 0;
      button.title = available ? '' : 'La función nativa de lectura no está disponible';
    }
    function markAllNotifications(button) {
      const api = window.FA?.Notification;
      if (marking || button.disabled || typeof api?.markAsRead !== 'function') return;
      marking = true; button.disabled = true;
      button.textContent = 'Marcando…';
      try {
        api.markAsRead();
        // Solo la respuesta nativa actualiza el contador; no fingir éxito.
        markTimeout = window.setTimeout(() => {
          marking = false;
          const current = document.querySelector('[data-ak-mark-notifications]');
          if (current) {
            current.textContent = 'Marcar todas como leídas';
            current.title = nativeUnreadCount() ? 'No se confirmó la lectura. Puedes volver a intentarlo.' : '';
            current.disabled = nativeUnreadCount() === 0;
          }
        }, 8000);
        syncNative();
      } catch (_) {
        marking = false; button.disabled = false;
        button.textContent = 'Marcar todas como leídas';
        button.title = 'No se pudo completar la acción. Vuelve a intentarlo.';
      }
    }

    function syncNative() {
      const next = readUser();
      if (next.logged === user.logged) {
        if (strong.textContent !== next.name) strong.textContent = next.name;
        if (personalHeading.textContent !== next.name) personalHeading.textContent = next.name;
        for (const image of [avatar, portrait]) if (image.getAttribute('src') !== next.avatar) image.src = next.avatar;
        if (portrait.alt !== next.name) portrait.alt = next.name;
        if (next.href) {
          if (nameLink.getAttribute('href') !== next.href) nameLink.href = next.href;
          if (ownProfile && ownProfile.getAttribute('href') !== next.href) ownProfile.href = next.href;
          if (ownTopics && ownTopics.getAttribute('href') !== '/sta' + next.href) ownTopics.href = '/sta' + next.href;
          if (ownPosts && ownPosts.getAttribute('href') !== '/spa' + next.href) ownPosts.href = '/spa' + next.href;
        }
      }
      if (notificationButton) {
        const count = nativeUnreadCount();
        countState(notificationButton, notificationBadge, 'Notificaciones', count);
        if (marking && count === 0) {
          marking = false; window.clearTimeout(markTimeout);
          const button = document.querySelector('[data-ak-mark-notifications]');
          if (button && button.textContent !== 'Marcar todas como leídas') button.textContent = 'Marcar todas como leídas';
        }
      }
      const nativeList = document.getElementById('notif_list');
      enhanceNotifications(nativeList);
      const hideFallback = opened !== 'notifications' || !!nativeList;
      if (notificationFallback.hidden !== hideFallback) notificationFallback.hidden = hideFallback;
    }
    let scheduled = false;
    const observer = new MutationObserver(records => {
      if (!records.some(record => record.type !== 'attributes' || record.attributeName !== 'class' || record.target.id === 'fa_notifications')) return;
      if (scheduled) return;
      scheduled = true;
      window.setTimeout(() => { scheduled = false; syncNative(); }, 40);
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true,
      attributes: true, attributeFilter: ['src', 'href', 'class'] });
    syncNative();

    let busy = false, lastCheck = 0;
    function unreadRow(row) {
      if (row.classList.contains('is-unread')) return true;
      const image = row.getAttribute('data-folder-image') || '';
      const filename = image.split(/[?#]/)[0].split('/').pop();
      return UNREAD_IMAGES.includes(filename);
    }
    async function updateMessages(force) {
      if (!user.logged || !window.fetch || busy || (!force && Date.now() - lastCheck < 60000)) return;
      busy = true; lastCheck = Date.now();
      try {
        let url = new URL('/privmsg?folder=inbox', location.href);
        const seen = new Set(); let total = 0;
        while (url && seen.size < MAX_INBOX_PAGES) {
          if (seen.has(url.href)) throw new Error('Paginación repetida');
          seen.add(url.href);
          const response = await fetch(url.href, { credentials: 'same-origin' });
          if (!response.ok || (response.url && new URL(response.url).origin !== location.origin)) throw new Error('Buzón no disponible');
          const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
          if (!doc.querySelector('.ak-mp-rows')) throw new Error('No se reconoce el buzón');
          total += [...doc.querySelectorAll('.ak-mp-row')].filter(unreadRow).length;
          const currentStart = Number(url.searchParams.get('start') || 0);
          const next = [...doc.querySelectorAll('.pagination a[href]')].map(a => {
            try { return new URL(a.getAttribute('href'), url); } catch (_) { return null; }
          }).filter(next => next && next.origin === location.origin && next.pathname === '/privmsg' &&
            next.searchParams.get('folder') === 'inbox' && Number(next.searchParams.get('start') || 0) > currentStart)
            .sort((a, b) => Number(a.searchParams.get('start')) - Number(b.searchParams.get('start')))[0];
          url = next || null;
        }
        if (url) throw new Error('Buzón incompleto');
        countState(mpLink, mpBadge, 'Mensajes privados', total);
        delete mpLink.dataset.countUnavailable;
      } catch (_) {
        // No mostrar un total falso si falla una página o no está accesible.
        countState(mpLink, mpBadge, 'Mensajes privados', 0);
        mpLink.dataset.countUnavailable = 'true';
        mpLink.setAttribute('aria-label', 'Mensajes privados: contador no disponible');
        mpLink.dataset.tooltip = 'Mensajes privados: contador no disponible';
      } finally { busy = false; }
    }
    updateMessages(true);
    window.addEventListener('focus', () => updateMessages(false));
    document.addEventListener('visibilitychange', () => { if (!document.hidden) updateMessages(false); });
    document.addEventListener('ak:mp-changed', () => updateMessages(true));
    const timer = window.setInterval(() => { if (!document.hidden) updateMessages(false); }, 60000);
    window.addEventListener('pagehide', () => clearInterval(timer), { once: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();


/* Ruta contextual y botones de publicación, integrados en el mismo archivo. */
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
