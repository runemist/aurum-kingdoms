/* Aurum: avatar automático del último miembro; conserva el fondo fijo si falla. */
(function () {
  'use strict';
  function ready(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, {once:true}); else fn(); }
  ready(function () {
    var section = document.querySelector('.ak-stats');
    var photo = section && section.querySelector('.ak-stats-feature-photo');
    var member = section && section.querySelector('.ak-stats-newest a[href]');
    if (!photo || !member) return;
    var url;
    try { url = new URL(member.getAttribute('href'), location.href); } catch (_) { return; }
    if (url.origin !== location.origin || !/^\/u\d+/.test(url.pathname)) return;
    fetch(url.pathname, {credentials:'same-origin'}).then(function (r) { return r.ok ? r.text() : ''; }).then(function (html) {
      if (!html) return;
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var image = doc.querySelector('.perfil-avatar img, .module .avatar img, .profile-avatar img');
      if (!image) return;
      var src = new URL(image.getAttribute('src'), url.href);
      if (!/^https?:$/.test(src.protocol)) return;
      photo.style.backgroundImage = 'url(' + JSON.stringify(src.href) + ')';
      photo.style.setProperty('--ak-photo-symbol', '""');
      photo.setAttribute('role','img'); photo.setAttribute('aria-label','Avatar de ' + member.textContent.trim());
    }).catch(function () {});
  });
})();
