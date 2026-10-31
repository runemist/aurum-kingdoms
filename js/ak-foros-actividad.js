/* AURUM · Áreas privadas y contenidos del tablón. Cargar una vez desde overall_header. */
(() => {
  'use strict';
  const CONFIG = { busquedas: '/f9-busquedas', limiteUltimos: 20, limiteBusquedas: 14, maxPaginas: 20 };
  const groups = new Set(['aeris', 'cascata', 'ignis', 'lux', 'teram', 'tuono', 'umbra']);
  const ready = fn => document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', fn, { once: true }) : fn();

  function privateAreas() {
    document.querySelectorAll('#main-content .forabg').forEach(section => {
      let found = false;
      section.querySelectorAll('.topiclist.forums > li.row').forEach(row => {
        const title = row.querySelector('a.forumtitle');
        const name = title?.textContent.trim().toLocaleLowerCase('es');
        if (!groups.has(name)) return;
        found = true;
        row.classList.add('ak-private-card', `ak-${name}`);
        const latest = row.querySelector('dd.lastpost a[href*="/t"][title]');
        if (latest?.title) latest.textContent = latest.title;
      });
      if (found) section.classList.add('ak-private-areas');
    });
  }

  function localURL(value, type) {
    if (!value) return '';
    try {
      const url = new URL(value, location.href);
      if (url.origin !== location.origin || !type.test(url.pathname)) return '';
      return url.pathname + url.search + url.hash;
    } catch (_) { return ''; }
  }
  const topicURL = value => localURL(value, /^\/t\d+(?:p\d+)?(?:-|\/|$)/);
  const profileURL = value => localURL(value, /^\/u[1-9]\d*\/?$/);
  function imageURL(value, base = location.href) {
    if (!value) return '';
    try { const url = new URL(value, base); return /^https?:$/.test(url.protocol) ? url.href : ''; }
    catch (_) { return ''; }
  }
  function authorData(link) {
    if (!link) return null;
    const colorNode = link.querySelector('[style*="color"]') || link;
    return { name: link.textContent.trim(), href: profileURL(link.getAttribute('href')), color: colorNode.style.color };
  }
  function authorNode(author) {
    const node = document.createElement(author.href ? 'a' : 'span');
    if (author.href) node.href = author.href;
    node.className = 'ak-topic-author';
    node.textContent = author.name;
    if (author.color) node.style.color = author.color;
    return node;
  }
  function notice(target, text) {
    const p = document.createElement('p'); p.className = 'ak-empty'; p.textContent = text;
    target.replaceChildren(p);
  }

  /* Utiliza exclusivamente el widget nativo; no sustituye sus datos por /search. */
  function findRecentWidget() {
    const known = document.querySelectorAll(
      '[data-ak-recent-source], #comments_scroll_div, #recent_topics, #recent-topics, .mod-recent'
    );
    for (const source of known) {
      if (!source.closest('#ak-hero') && Array.from(source.querySelectorAll('a[href]')).some(a => topicURL(a.getAttribute('href')))) return source;
    }
    const modules = document.querySelectorAll('#left .module, #right .module, #left table.forumline, #right table.forumline');
    for (const module of modules) {
      const heading = module.querySelector('.h3, h3, .maintitle, .catHead, caption');
      const title = (heading?.textContent || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      if (/ultimos temas|ultimos mensajes|recent topics|latest topics|derniers sujets/.test(title)) return module;
    }
    return null;
  }
  function readRecent(source) {
    const links = Array.from(source.querySelectorAll('a[href]')).filter(a => topicURL(a.getAttribute('href')));
    const seen = new Set(); const topics = [];
    links.forEach((link, i) => {
      const href = topicURL(link.getAttribute('href'));
      const key = href.match(/^\/t\d+/)?.[0];
      const title = (link.getAttribute('title') || link.textContent).trim();
      if (!title || !key || seen.has(key)) return;
      seen.add(key);
      let block;
      const row = link.closest('.mod-recent-row, p, li, tr');
      if (row && source.contains(row) && links.filter(a => row.contains(a)).length === 1) {
        block = row.cloneNode(true);
        block.querySelectorAll('a[href]').forEach(a => { if (topicURL(a.getAttribute('href'))) a.remove(); });
      } else {
        const range = document.createRange(); range.setStartAfter(link);
        if (links[i + 1]) range.setEndBefore(links[i + 1]);
        else range.setEnd(source, source.childNodes.length);
        block = document.createElement('div'); block.append(range.cloneContents());
      }
      const poster = Array.from(block.querySelectorAll('a[href]')).find(a => profileURL(a.getAttribute('href')));
      let author = authorData(poster);
      const dateNode = block.querySelector('time, .mod-recent-time');
      const copy = block.cloneNode(true);
      copy.querySelectorAll('a, img, script, style').forEach(el => el.remove());
      let date = (dateNode?.textContent || copy.textContent).replace(/\s+/g, ' ').replace(/^[\s»›]+|[\s»›]+$/g, '').trim();
      if (!author) {
        const guest = date.match(/\s(?:por|by|par)\s+(.+)$/i);
        if (guest) { author = { name: guest[1].trim(), href: '', color: '' }; date = date.slice(0, guest.index).trim(); }
      }
      date = date.replace(/\s*(?:por|by|par)\s*$/i, '').trim();
      topics.push({ href, title, author, date });
    });
    return topics.slice(0, CONFIG.limiteUltimos);
  }
  const avatarCache = new Map();
  function readAvatar(profile) {
    if (!profile) return Promise.resolve('');
    if (!avatarCache.has(profile)) {
      avatarCache.set(profile, loadDocument(profile).then(doc => {
        const img = doc.querySelector('.perfil-avatar img, .profile-avatar img, .module .avatar img');
        return imageURL(img?.getAttribute('src'), new URL(profile, location.href));
      }).catch(() => ''));
    }
    return avatarCache.get(profile);
  }
  async function fillAvatars(entries) {
    let cursor = 0;
    await Promise.all(Array.from({ length: Math.min(4, entries.length) }, async () => {
      while (cursor < entries.length) {
        const item = entries[cursor++];
        const src = await readAvatar(item.author.href);
        if (!src || !item.photo.isConnected) continue;
        const image = document.createElement('img');
        image.alt = ''; image.loading = 'lazy'; image.decoding = 'async';
        image.addEventListener('error', () => image.remove(), { once: true });
        image.src = src; item.photo.append(image);
      }
    }));
  }
  function renderRecent(target, topics) {
    const fragment = document.createDocumentFragment(); const avatars = [];
    topics.forEach(topic => {
      const row = document.createElement('div'); row.className = 'ak-topic';
      const author = topic.author;
      const photo = document.createElement(author?.href ? 'a' : 'span'); photo.className = 'ak-latest-avatar';
      if (author?.href) { photo.href = author.href; photo.setAttribute('aria-label', 'Ver perfil de ' + author.name); }
      else photo.setAttribute('aria-hidden', 'true');
      if (author?.color) photo.style.setProperty('--ak-author-color', author.color);
      // Un único perfil recuperado por autor; no se confunde con el creador del tema.
      if (author?.href) avatars.push({ photo, author });
      const copy = document.createElement('div'); copy.className = 'ak-latest-copy';
      const link = document.createElement('a'); link.className = 'ak-latest-title'; link.href = topic.href; link.textContent = topic.title; link.title = topic.title;
      copy.append(link);
      if (author?.name) {
        const by = document.createElement('div'); by.className = 'ak-latest-by';
        by.append(document.createTextNode('por '), authorNode(author)); copy.append(by);
      }
      if (topic.date) { const time = document.createElement('span'); time.className = 'ak-topic-date'; time.textContent = topic.date; copy.append(time); }
      row.append(photo, copy); fragment.append(row);
    });
    target.replaceChildren(fragment); fillAvatars(avatars);
  }
  function boardBackground() {
    const board = document.querySelector('#ak-hero .ak-board'); const wrap = document.getElementById('wrap');
    if (!board || !wrap) return;
    const value = getComputedStyle(wrap).backgroundColor;
    const parts = value.match(/^rgba?\(([^)]+)\)$/)?.[1].split(',').map(v => v.trim());
    if (!parts || parts.length < 3) {
      if (value && value !== 'transparent') board.style.setProperty('--ak-board-background', 'color-mix(in srgb, ' + value + ' 94%, transparent)');
      return;
    }
    if (parts.length === 4 && Number(parts[3]) === 0) return;
    // Mismo RGB que #wrap, con opacidad del 94%; la transparencia no afecta al texto.
    board.style.setProperty('--ak-board-background', 'rgba(' + parts.slice(0, 3).join(',') + ',0.94)');
  }
  function recentTopics() {
    const target = document.getElementById('ak-latest-list');
    if (!target) return;
    let signature = '';
    function update() {
      const source = findRecentWidget();
      if (!source) return false;
      const topics = readRecent(source);
      if (!topics.length) return false;
      const next = JSON.stringify(topics);
      if (next !== signature) { signature = next; renderRecent(target, topics); }
      return true;
    }
    if (update()) return;
    notice(target, 'Esperando el widget de Últimos temas…');
    const observer = new MutationObserver(() => { if (update()) { observer.disconnect(); clearTimeout(timeout); } });
    observer.observe(document.body, { childList: true, subtree: true });
    const timeout = setTimeout(() => {
      observer.disconnect();
      if (!update()) notice(target, 'El widget de Últimos temas no está disponible en esta página.');
    }, 12000);
  }

  async function loadDocument(href) {
    const response = await fetch(href, { credentials: 'same-origin', cache: 'no-store' });
    if (!response.ok) throw new Error('Contenido no disponible');
    if (response.url && new URL(response.url, location.href).origin !== location.origin) throw new Error('Destino externo');
    return new DOMParser().parseFromString(await response.text(), 'text/html');
  }
  const normalize = text => (text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const forumPattern = /^\/f9(?:p\d+)?(?:-|\/|$)/;
  function readSearchTopics(doc) {
    const seen = new Set(); const topics = [];
    doc.querySelectorAll('li.row a.topictitle, .forumline a.topictitle').forEach(link => {
      const href = topicURL(link.getAttribute('href')); const key = href.match(/^\/t\d+/)?.[0];
      const title = link.textContent.trim(); const row = link.closest('li.row, tr');
      if (!row || !key || !title || seen.has(key)) return;
      seen.add(key);
      const kind = normalize(row.querySelector('.ak-topic-type')?.textContent);
      const state = normalize(Array.from(row.querySelectorAll('.dterm[title], .ak-topic-state, dl.icon > dt img, .topic-folder img'))
        .map(el => [el.getAttribute('title'), el.getAttribute('alt'), el.getAttribute('aria-label')].filter(Boolean).join(' ')).join(' '));
      if (row.matches('.ak-cerrado, .ak-especial, .ak-nota, .ak-anuncio, .ak-global') ||
          /cerrad|locked|closed|verrouill/.test(state) || /nota|importante|anuncio|sticky|announcement/.test(kind)) return;
      const poster = Array.from(row.querySelectorAll('.span-tab a[href], .topic-author a[href]'))
        .find(a => profileURL(a.getAttribute('href')));
      topics.push({ href, key, title, author: authorData(poster) });
    });
    return topics;
  }
  function nextPage(doc, current) {
    const start = url => Number(new URL(url, location.href).pathname.match(/p(\d+)(?:-|$)/)?.[1] || new URL(url, location.href).searchParams.get('start') || 0);
    return Array.from(doc.querySelectorAll('.pagination a[href], a[rel="next"][href]'))
      .filter(a => !a.closest('li.row, tr'))
      .map(a => localURL(a.getAttribute('href'), forumPattern))
      .filter(href => href && start(href) > start(current))
      .sort((a, b) => start(a) - start(b))[0] || '';
  }
  async function topicImage(topic, media) {
    try {
      // La URL del listado abre el tema desde su primera página, no desde la última respuesta.
      const doc = await loadDocument(topic.href);
      const content = doc.querySelector('.post[id^="p"] .postbody .content, .post .postbody .content, .postbody .content');
      const img = Array.from(content?.querySelectorAll('img.ak-busqueda-portada, .ak-busqueda-portada img') || [])
        .find(image => !image.closest('blockquote, .signature_div'));
      const src = img && imageURL(img.getAttribute('src'), new URL(topic.href, location.href));
      if (!src) return;
      const image = document.createElement('img'); image.alt = ''; image.loading = 'lazy'; image.decoding = 'async';
      image.addEventListener('load', () => media.classList.add('has-image'), { once: true });
      image.addEventListener('error', () => { image.remove(); media.classList.remove('has-image'); }, { once: true });
      image.src = src; media.append(image);
    } catch (_) { /* Se mantiene la tarjeta sin tomar imágenes ajenas a su portada. */ }
  }
  function searchCard(topic) {
    const card = document.createElement('article'); card.className = 'ak-search-card';
    const link = document.createElement('a'); link.className = 'ak-search-card-link'; link.href = topic.href; link.title = topic.title;
    const media = document.createElement('span'); media.className = 'ak-search-card-media'; media.setAttribute('aria-hidden', 'true');
    const title = document.createElement('span'); title.className = 'ak-search-card-title'; title.textContent = topic.title;
    link.append(media, title); card.append(link);
    if (topic.author?.name) card.append(authorNode(topic.author));
    else { const blank = document.createElement('span'); blank.className = 'ak-topic-author'; blank.setAttribute('aria-hidden', 'true'); card.append(blank); }
    return { card, media, topic };
  }
  function moreCard() {
    const item = searchCard({ href: CONFIG.busquedas, title: 'Ver todas las búsquedas' });
    item.card.classList.add('ak-search-card--more');
    const forumLink = Array.from(document.querySelectorAll('a.forumtitle[href]'))
      .find(a => localURL(a.getAttribute('href'), /^\/f9(?:-|\/|$)/));
    const cover = forumLink?.closest('li.row')?.querySelector('.ak-forum-cover');
    const background = cover && (cover.style.backgroundImage || getComputedStyle(cover).backgroundImage);
    if (background && background !== 'none') {
      item.media.style.backgroundImage = background;
      item.media.classList.add('has-forum-image');
    }
    return item.card;
  }
  async function searchTopics() {
    const target = document.getElementById('ak-search-grid'); if (!target) return;
    if (target.dataset.akSearchReady) return;
    target.dataset.akSearchReady = 'true';
    const more = moreCard(); target.replaceChildren(more); target.setAttribute('aria-busy', 'true');
    const found = []; const seen = new Set(); const pages = new Set();
    let current = CONFIG.busquedas; let partial = false; let readable = false;
    try {
      while (current && found.length < CONFIG.limiteBusquedas && pages.size < CONFIG.maxPaginas) {
        if (pages.has(current)) break;
        pages.add(current);
        let doc;
        try { doc = await loadDocument(current); } catch (_) { partial = true; break; }
        if (!doc.querySelector('.ak-topics-board, .forumbg, .forumline')) { partial = true; break; }
        readable = true;
        for (const topic of readSearchTopics(doc)) {
          if (!seen.has(topic.key)) { seen.add(topic.key); found.push(topic); }
          if (found.length === CONFIG.limiteBusquedas) break;
        }
        current = nextPage(doc, current);
      }
      const fragment = document.createDocumentFragment();
      const entries = found.map(searchCard);
      entries.forEach(item => fragment.append(item.card)); target.prepend(fragment);
      if (!found.length) {
        const message = document.createElement('p'); message.className = 'ak-empty ak-search-notice';
        message.textContent = readable && !partial ? 'No hay búsquedas abiertas disponibles.' : 'No se pudieron consultar las búsquedas. Puedes abrir el subforo.';
        target.before(message);
      } else if (partial) {
        const message = document.createElement('p'); message.className = 'ak-search-notice'; message.textContent = 'Algunas búsquedas no pudieron cargarse.'; target.before(message);
      }
      // Como máximo cuatro lecturas de portadas simultáneas; el orden visual se conserva.
      let cursor = 0;
      await Promise.all(Array.from({ length: Math.min(4, entries.length) }, async () => {
        while (cursor < entries.length) { const item = entries[cursor++]; await topicImage(item.topic, item.media); }
      }));
    } finally { target.setAttribute('aria-busy', 'false'); }
  }

  ready(() => { boardBackground(); privateAreas(); recentTopics(); searchTopics(); });
})();
