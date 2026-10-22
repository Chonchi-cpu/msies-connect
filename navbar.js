/* ============================================================
   navbar.js - reusable top navigation bar component.
   Injected into #navbar-placeholder on every page.
   Usage: renderNavbar('feed' | 'calendar' | 'chat' | 'profile' | 'home' | 'dashboard')
   Also wires the "search people" bar shown to logged-in users,
   which links out to view-profile.html for whoever they pick.
   ============================================================ */

const NAV_ROLE_LABELS = { superadmin: 'Super Admin', teacher: 'Teacher', parent: 'Parent', student: 'Student' };

function renderNavbar(active) {
  const placeholder = document.getElementById('navbar-placeholder');
  if (!placeholder) return;

  const user = getCurrentUser();

  /* Super Admin: Feed and Calendar are replaced by the Dashboard
     (which already manages posts and the calendar). */
  const isSuper = !!user && user.role === 'superadmin';
  const home = isSuper ? 'dashboard.html' : 'feed.html';
  const waiting = isSuper && typeof getAdminAttentionCount === 'function' ? getAdminAttentionCount() : 0;
  const waitingBadge = waiting ? `<span class="tab-badge" title="${waiting} waiting for review">${waiting}</span>` : '';

  const links = user
    ? `
      ${isSuper
        ? `<a href="dashboard.html" class="${active === 'dashboard' || active === 'accounts' ? 'active' : ''}">Dashboard${waitingBadge}</a>`
        : `<a href="feed.html" class="${active === 'feed' ? 'active' : ''}">Feed</a>
      <a href="calendar.html" class="${active === 'calendar' ? 'active' : ''}">Calendar</a>`}
      <a href="chat.html" class="${active === 'chat' ? 'active' : ''}">Chat</a>
      <a href="profile.html" class="${active === 'profile' ? 'active' : ''}">Profile</a>
    `
    : '';

  const search = user
    ? `
      <div class="nav-search" id="nav-search">
        <input type="text" id="nav-search-input" placeholder="Search people..." autocomplete="off">
        <div class="nav-search-results" id="nav-search-results"></div>
      </div>
    `
    : '';

  placeholder.innerHTML = `
    <header class="topbar">
      <div class="container topbar-inner">
        <a href="${user ? home : 'index.html'}" class="brand"><img class="logo-badge" src="images/logos/school-seal.png" alt="">MSIES Connect</a>
        ${user ? `<button type="button" class="nav-toggle" id="nav-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="nav-menu">
          <span class="nav-toggle-bars" aria-hidden="true"><span></span><span></span><span></span></span>
          ${waiting ? '<span class="nav-toggle-dot" aria-hidden="true"></span>' : ''}
        </button>` : ''}
        <div class="nav-menu" id="nav-menu">
          ${search}
          <nav class="navlinks">${links}</nav>
        </div>
      </div>
    </header>
  `;

  if (user) wireNavToggle();
  if (user) wireNavSearch();
  if (user) showPendingWarnings();
}

/* Hamburger menu (phones). On small screens the search bar and links
   live inside #nav-menu, which this button opens and closes. On wider
   screens the button is hidden and the menu is always shown. */
function wireNavToggle() {
  const btn = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');
  if (!btn || !menu) return;

  function setOpen(open) {
    menu.classList.toggle('open', open);
    btn.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(!menu.classList.contains('open'));
  });
  /* tapping a link, tapping outside the bar, or pressing Esc closes it */
  menu.addEventListener('click', (e) => {
    if (e.target.closest('.navlinks a')) setOpen(false);
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.topbar')) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });
  /* rotating to landscape / widening the window resets it */
  const mq = window.matchMedia('(min-width: 721px)');
  const reset = () => { if (mq.matches) setOpen(false); };
  if (mq.addEventListener) mq.addEventListener('change', reset);
  else if (mq.addListener) mq.addListener(reset);
}

/* Shows any admin warnings the user hasn't acknowledged yet. The
   modal can't be dismissed by clicking outside; the user has to
   press "I understand", which marks the warnings as seen. */
function showPendingWarnings() {
  if (typeof getUnseenWarnings !== 'function' || typeof openModal !== 'function') return;
  const pending = getUnseenWarnings();
  if (!pending.length) return;
  const e = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  openModal(`
    <div class="modal-header"><h2>Warning from the school admin</h2></div>
    <div class="icon-circle danger">&#9888;</div>
    <p style="text-align:center">Your account received ${pending.length === 1 ? 'a warning' : pending.length + ' warnings'} for violating the community rules.</p>
    ${pending.map((w) => `
      <div class="warning-item">
        <strong>${e(w.reason)}</strong>
        ${w.note ? `<div>${e(w.note)}</div>` : ''}
        <small class="muted">${e(w.by)} &middot; ${new Date(w.at).toLocaleString()}</small>
      </div>`).join('')}
    <p style="text-align:center" class="muted">Please keep comments and chats respectful. Repeated violations may get your account muted.</p>
    <p style="text-align:right">
      <button type="button" class="btn" onclick="markWarningsSeen(); closeModal()">I understand</button>
    </p>
  `);
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.addEventListener('click', (ev) => {
    // Only swallow clicks on the dark background, so clicking outside
    // doesn't dismiss the modal. Clicks on the button must pass through.
    if (ev.target === overlay) ev.stopImmediatePropagation();
  }, true);
}

function wireNavSearch() {
  const wrap = document.getElementById('nav-search');
  const input = document.getElementById('nav-search-input');
  const results = document.getElementById('nav-search-results');
  if (!wrap || !input || !results) return;

  function renderResults(matches) {
    if (!matches.length) {
      results.innerHTML = '<div class="nav-search-empty">No one found</div>';
      results.classList.add('open');
      return;
    }
    results.innerHTML = matches
      .map(
        (u) => `
          <a class="nav-search-item" href="view-profile.html?email=${encodeURIComponent(u.email)}">
            <span class="avatar">${avatarInner(u)}</span>
            <span class="nav-search-item-text">
              <strong>${u.name}</strong>
              <small>${NAV_ROLE_LABELS[u.role] || u.role}${u.section ? ' · ' + u.section : ''}</small>
            </span>
          </a>
        `
      )
      .join('');
    results.classList.add('open');
  }

  input.addEventListener('input', () => {
    const q = input.value.trim();
    if (!q) {
      results.innerHTML = '';
      results.classList.remove('open');
      return;
    }
    renderResults(searchUsers(q));
  });

  input.addEventListener('focus', () => {
    if (input.value.trim()) renderResults(searchUsers(input.value.trim()));
  });

  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) results.classList.remove('open');
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      results.classList.remove('open');
      input.blur();
    }
    if (e.key === 'Enter') {
      const first = results.querySelector('.nav-search-item');
      if (first) window.location.href = first.getAttribute('href');
    }
  });
}
