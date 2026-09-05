/* ============================================================
   feed.js - page logic for feed.html
   Read-only this week: category filtering + post display +
   upcoming events. Posting, editing, deleting, and commenting
   will be added in a later milestone.
   ============================================================ */

requireAuth();
renderNavbar('feed');

const FILTERS = ['All', 'Events', 'Holidays', 'Reminders'];
let currentFilter = 'All';

function renderFilters() {
  document.getElementById('filters').innerHTML = FILTERS.map(
    (f) => `<button type="button" class="btn ${f === currentFilter ? '' : 'btn-outline'}" onclick="setFilter('${f}')">${f}</button>`
  ).join('');
}

function setFilter(f) {
  currentFilter = f;
  renderFilters();
  renderPosts();
}

function renderPosts() {
  const list = getAnnouncements().filter((a) => currentFilter === 'All' || a.category === currentFilter);
  const container = document.getElementById('posts');
  container.innerHTML = list.length
    ? list.map(renderAnnouncementCard).join('')
    : '<p class="muted">No posts in this category.</p>';
}

function renderUpcoming() {
  const upcoming = getAnnouncements().filter((a) => a.date).sort((a, b) => a.date.localeCompare(b.date));
  document.getElementById('upcoming-events').innerHTML = upcoming
    .map((a) => `<li>${fmtDate(a.date)} — ${a.title}${a.time ? ' (' + a.time + ')' : ''}</li>`)
    .join('');
}

function renderAll() {
  renderFilters();
  renderPosts();
  renderUpcoming();
}

renderAll();
