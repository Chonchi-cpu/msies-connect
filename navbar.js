

const NAV_ROLE_LABELS = { admin: 'Admin', teacher: 'Teacher', parent: 'Parent', student: 'Student' };

function renderNavbar(active) {
  const placeholder = document.getElementById('navbar-placeholder');
  if (!placeholder) return;

  const user = getCurrentUser();

  const links = user
    ? `
      <a href="feed.html" class="${active === 'feed' ? 'active' : ''}">Feed</a>
      <a href="calendar.html" class="${active === 'calendar' ? 'active' : ''}">Calendar</a>
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
        <a href="${user ? 'feed.html' : 'index.html'}" class="brand"><span class="logo-badge">M</span>MSIES Connect</a>
        ${search}
        <nav class="navlinks">${links}</nav>
      </div>
    </header>
  `;

  if (user) wireNavSearch();
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
            <span class="avatar">${personInitials(u.name)}</span>
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
