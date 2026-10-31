/* AURUM · Áreas privadas y contenidos del tablón. Cargar una vez desde overall_header. */
(() => {
  'use strict';
  const CONFIG = { busquedas: '/f9-busquedas', limiteUltimos: 20, limiteBusquedas: 6 };
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
  function renderRecent(target, topics) {
    const fragment = document.createDocumentFragment();
    topics.forEach(topic => {
      const row = document.createElement('div'); row.className = 'ak-topic';
      const link = document.createElement('a'); link.href = topic.href; link.textContent = topic.title; link.title = topic.title;
      row.append(link);
      const info = document.createElement('div'); info.className = 'ak-topic-info';
      if (topic.author?.name) info.append(authorNode(topic.author));
      if (topic.date) { const time = document.createElement('span'); time.className = 'ak-topic-date'; time.textContent = topic.date; info.append(time); }
      if (info.childNodes.length) row.append(info);
      fragment.append(row);
    });
    target.replaceChildren(fragment);
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
  function readSearchTopics(doc) {
    const seen = new Set(); const topics = [];
    doc.querySelectorAll('li.row a.topictitle, .forumline a.topictitle').forEach(link => {
      const href = topicURL(link.getAttribute('href')); const key = href.match(/^\/t\d+/)?.[0];
      const title = link.textContent.trim();
      if (!key || !title || seen.has(key)) return;
      seen.add(key);
      const row = link.closest('li.row, tr');
      const poster = Array.from(row?.querySelectorAll('.span-tab a[href], .topic-author a[href]') || [])
        .find(a => profileURL(a.getAttribute('href')));
      topics.push({ href, title, author: authorData(poster) });
    });
    return topics.slice(0, CONFIG.limiteBusquedas);
  }
  async function topicImage(topic, media) {
    try {
      const doc = await loadDocument(topic.href);
      const content = doc.querySelector('.post[id^="p"] .postbody .content, .post .postbody .content, .postbody .content');
      const img = Array.from(content?.querySelectorAll('img') || []).find(image => {
        const src = image.getAttribute('src') || '';
        return imageURL(src) && !/\/smiles\/|\/smilies\/|\/emoticons\//i.test(src) && !image.closest('blockquote, .signature_div');
      });
      const src = img && imageURL(img.getAttribute('src'), new URL(topic.href, location.href));
      if (!src) return;
      const image = document.createElement('img'); image.alt = ''; image.loading = 'lazy'; image.decoding = 'async';
      image.addEventListener('load', () => media.classList.add('has-image'), { once: true });
      image.addEventListener('error', () => { image.remove(); media.classList.remove('has-image'); }, { once: true });
      image.src = src; media.append(image);
    } catch (_) { /* La tarjeta permanece legible sin imagen. */ }
  }
  async function searchTopics() {
    const target = document.getElementById('ak-search-grid'); if (!target) return;
    const more = document.createElement('a'); more.className = 'ak-search-more'; more.href = CONFIG.busquedas; more.textContent = 'Ver todas las búsquedas';
    target.replaceChildren(more);
    try {
      const doc = await loadDocument(CONFIG.busquedas);
      const topics = readSearchTopics(doc);
      if (!topics.length) {
        const list = doc.querySelector('.ak-topics-board, .forumbg, .forumline');
        const p = document.createElement('p'); p.className = 'ak-empty';
        p.textContent = list ? 'Todavía no hay búsquedas visibles para tu cuenta.' : 'No se pudo consultar el listado de Búsquedas.';
        target.prepend(p); return;
      }
      const fragment = document.createDocumentFragment();
      topics.forEach(topic => {
        const card = document.createElement('article'); card.className = 'ak-search-card';
        const link = document.createElement('a'); link.className = 'ak-search-card-link'; link.href = topic.href;
        const media = document.createElement('span'); media.className = 'ak-search-card-media'; media.setAttribute('aria-hidden', 'true');
        const icon = document.createElement('i'); icon.className = 'ti ti-search'; media.append(icon);
        const title = document.createElement('span'); title.className = 'ak-search-card-title'; title.textContent = topic.title;
        link.append(media, title); card.append(link);
        if (topic.author?.name) card.append(authorNode(topic.author));
        fragment.append(card); topicImage(topic, media);
      });
      target.prepend(fragment);
    } catch (_) {
      const p = document.createElement('p'); p.className = 'ak-empty'; p.textContent = 'No se pudieron cargar las búsquedas. Puedes abrir el subforo.'; target.prepend(p);
    }
  }

  ready(() => { privateAreas(); recentTopics(); searchTopics(); });
})();
