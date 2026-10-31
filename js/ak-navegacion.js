/* Aurum · navbar de prueba. Activar en todas las páginas. */
(() => {
  function start() {
    if (document.getElementById('ak-nav-test')) return;
    const original = document.querySelector('#page-header .navlinks');
    if (!original) return;
    const logged = !!original.querySelector('#logout');
    const name = document.querySelector('#fa_welcome')?.textContent.replace(/^Bienvenido\/?a?\s*/i, '').trim() || 'Invitado';
    const avatar = document.querySelector('#fa_usermenu img')?.src || 'https://2img.net/i.imgur.com/J1trx1b.png';

    const nav = document.createElement('nav');
    nav.id = 'ak-nav-test';
    nav.setAttribute('aria-label', 'Navegación de Aurum');
    nav.innerHTML = `<div class="ak-nav-user"><button type="button" data-panel="ak-nav-personal" aria-controls="ak-nav-personal" aria-expanded="false" aria-label="Abrir menú personal">☰</button><img alt=""><strong></strong></div><div class="ak-nav-center"><a href="/">Índice</a><a href="/f5-ambientacion">Mundo</a><a href="/f4-reglamento">Información</a></div><div class="ak-nav-actions"><a href="/privmsg?folder=inbox">Mensajes</a><button type="button" data-panel="ak-nav-quick" aria-controls="ak-nav-quick" aria-expanded="false">Enlaces rápidos</button></div>`;
    nav.querySelector('img').src = avatar;
    nav.querySelector('strong').textContent = name;
    const personal = document.createElement('aside');
    personal.id = 'ak-nav-personal'; personal.className = 'ak-nav-drawer'; personal.hidden = true;
    personal.setAttribute('aria-label', 'Menú personal');
    const portrait = document.createElement('img'); portrait.src = avatar; portrait.alt = name;
    const title = document.createElement('h2'); title.textContent = name;
    personal.append(portrait, title);
    function link(parent, label, href) { const a = document.createElement('a'); a.textContent = label; a.href = href; parent.append(a); }
    link(personal, 'Índice', '/');
    if (logged) {
      link(personal, 'Editar perfil', '/profile?mode=editprofile');
      link(personal, 'Editar avatar', '/profile?mode=editprofile&page_profil=avatars');
      link(personal, 'Mis temas y mensajes', '/search?search_id=egosearch');
      link(personal, 'Mensajes privados', '/privmsg?folder=inbox');
      link(personal, 'Cerrar sesión', original.querySelector('#logout').href);
    } else {
      link(personal, 'Entrar', '/login'); link(personal, 'Registrarse', '/register');
      nav.querySelector('.ak-nav-actions>a').remove();
    }
    link(personal, 'Nuevos mensajes', '/search?search_id=newposts');
    link(personal, 'Temas sin respuesta', '/search?search_id=unanswered');
    link(personal, 'Buscar', '/search'); link(personal, 'Miembros', '/memberlist'); link(personal, 'Grupos', '/groups'); link(personal, 'FAQ', '/faq');
    const quick = document.createElement('aside');
    quick.id = 'ak-nav-quick'; quick.className = 'ak-nav-drawer'; quick.hidden = true;
    quick.setAttribute('aria-label', 'Enlaces rápidos');
    quick.innerHTML = '<h2>Archivo de Aurum</h2>';
    for (const [group, items] of [
      ['Información', [['Anuncios','/f111-anuncios'],['Reglamento','/f4-reglamento'],['Ambientación','/f5-ambientacion']]],
      ['Personajes', [['Expedientes','/f7-expedientes'],['Registros','/f8-registros'],['Búsquedas','/f9-busquedas'],['Utilidades','/f10-utilidades-de-los-personajes']]],
      ['Administración', [['Gestiones','/f6-gestiones-de-los-usuarios']]]
    ]) { const h = document.createElement('h3'); h.textContent = group; quick.append(h); items.forEach(([label,href])=>link(quick,label,href)); }
    function close() { personal.hidden = quick.hidden = true; nav.querySelectorAll('[data-panel]').forEach(b=>b.setAttribute('aria-expanded','false')); }
    nav.querySelectorAll('[data-panel]').forEach(button=>button.addEventListener('click',()=>{const target = document.getElementById(button.dataset.panel);const open = target.hidden;close();target.hidden = !open;button.setAttribute('aria-expanded',String(open));if(open) target.querySelector('a')?.focus();}));
    document.addEventListener('click',event=>{if(!nav.contains(event.target)&&!personal.contains(event.target)&&!quick.contains(event.target))close();});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'){const active=nav.querySelector('[aria-expanded="true"]');close();active?.focus();}});
    document.body.append(nav,personal,quick);
    document.body.classList.add('ak-nav-testing');
  }
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start, {
    once: true
  });
} else {
  start();
}
})();
