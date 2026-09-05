/* ============================================================
   navbar.js - reusable top navigation bar component.
   Injected into #navbar-placeholder on every page.
   Usage: renderNavbar('feed' | 'calendar' | 'chat' | 'profile' | 'home')
   ============================================================ */

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

  placeholder.innerHTML = `
    <header class="topbar">
      <div class="container topbar-inner">
        <a href="${user ? 'feed.html' : 'index.html'}" class="brand">MSIES Connect</a>
        <nav class="navlinks">${links}</nav>
      </div>
    </header>
  `;
}
