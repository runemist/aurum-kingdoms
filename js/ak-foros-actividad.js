/* Aurum · funciones del foro. Activar en todas las páginas. */
(() => {
  'use strict';

  const groups = new Set([
    'aeris', 'cascata', 'ignis', 'lux',
    'teram', 'tuono', 'umbra'
  ]);

  const ready = fn => document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', fn, { once: true })
    : fn();

  function privateAreas() {
    document.querySelectorAll('#main-content .forabg').forEach(section => {
      let found = false;

      section.querySelectorAll('.topiclist.forums > li.row').forEach(row => {
        const title = row.querySelector('a.forumtitle');
        const name = title?.textContent.trim().toLocaleLowerCase('es');

        if (!groups.has(name)) return;

        found = true;
        row.classList.add('ak-private-card', `ak-${name}`);

        const latest = row.querySelector(
          'dd.lastpost a[href*="/t"][title]'
        );

        if (latest?.title) latest.textContent = latest.title;
      });

      if (found) section.classList.add('ak-private-areas');
    });
  }

  function localTopic(href) {
    try {
      const url = new URL(href, location.href);

      if (
        url.origin !== location.origin ||
        !/^\/t\d+(?:-|$)/.test(url.pathname)
      ) return null;

      return url.pathname + url.search + url.hash;
    } catch (_) {
      return null;
    }
  }

  async function fromLatestSearch() {
    const response = await fetch('/search?search_id=latest', {
      credentials: 'same-origin',
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('Lista de temas no disponible');
    }

    const doc = new DOMParser().parseFromString(
      await response.text(),
      'text/html'
    );

    const seen = new Set();
    const topics = [];

    doc.querySelectorAll('a.topictitle').forEach(link => {
      const href = localTopic(link.getAttribute('href'));
      const title = link.textContent.trim();
      const key = href?.match(/^\/t\d+/)?.[0];

      if (!key || !title || seen.has(key)) return;

      seen.add(key);

      const row = link.closest('li.row');
      const author = row
        ?.querySelector('.span-tab a[href^="/u"]')
        ?.textContent.trim() || '';
      const date = row
        ?.querySelector('dd.lastpost br')
        ?.nextSibling?.textContent.trim() || '';

      topics.push({ href, title, author, date });
    });

    return topics.slice(0, 6);
  }

  function render(list, topics) {
    const fragment = document.createDocumentFragment();

    topics.forEach(topic => {
      const row = document.createElement('div');
      row.className = 'ak-topic';

      const link = document.createElement('a');
      link.href = topic.href;
      link.textContent = topic.title;
      row.append(link);

      if (topic.author || topic.date) {
        const info = document.createElement('div');
        info.className = 'ak-topic-info';

        if (topic.author) {
          const author = document.createElement('span');
          author.className = 'ak-topic-author';
          author.textContent = topic.author;
          info.append(author);
        }

        if (topic.date) {
          const time = document.createElement('time');
          time.textContent = topic.date;
          info.append(time);
        }

        row.append(info);
      }

      fragment.append(row);
    });

    list.replaceChildren(fragment);
  }

  async function recentTopics() {
    const list = document.getElementById('ak-latest-list');
    if (!list) return;

    try {
      const topics = await fromLatestSearch();

      if (!topics.length) {
        throw new Error('Sin temas visibles');
      }

      render(list, topics);
    } catch (_) {
      list.textContent = 'No se pudieron cargar los últimos temas.';
    }
  }

  ready(() => {
    privateAreas();
    recentTopics();
  });
})();
