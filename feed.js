
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

function renderNewPostButton() {
  const wrap = document.getElementById('new-post-wrap');
  wrap.innerHTML = isStaff()
    ? '<button type="button" class="btn" onclick="openNewAnnouncement()">+ New post</button>'
    : '';
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
  renderNewPostButton();
  renderPosts();
  renderUpcoming();
}

/* ---- New / edit post modal ---- */

function openNewAnnouncement() {
  openModal(`
    <div class="modal-header">
      <h2>New announcement</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <p class="muted">Post something for parents, teachers, and students to see.</p>
    <form id="post-form" onsubmit="return submitNewAnnouncement(event)">
      ${postFormFields()}
      <p style="text-align:right">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn">Publish</button>
      </p>
    </form>
  `);
}

function submitNewAnnouncement(e) {
  e.preventDefault();
  addAnnouncement(readPostForm());
  closeModal();
  renderAll();
  return false;
}

function openEditAnnouncement(id) {
  const a = getAnnouncements().find((x) => x.id === id);
  if (!a) return;
  openModal(`
    <div class="modal-header">
      <h2>Edit announcement</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <p class="muted">Update the details below, then save your changes.</p>
    <form id="post-form" onsubmit="return submitEditAnnouncement(event, ${id})">
      ${postFormFields(a)}
      <p style="text-align:right">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn">Save changes</button>
      </p>
    </form>
  `);
}

function submitEditAnnouncement(e, id) {
  e.preventDefault();
  updateAnnouncement(id, readPostForm());
  closeModal();
  renderAll();
  return false;
}

function confirmDeleteAnnouncement(id) {
  const a = getAnnouncements().find((x) => x.id === id);
  if (!a) return;
  openModal(`
    <div class="modal-header">
      <h2>Delete this announcement?</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="icon-circle danger">&#9888;</div>
    <p style="text-align:center">This post will be removed from the feed and calendar. This can't be undone.</p>
    <p style="text-align:right">
      <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button type="button" class="btn btn-danger" onclick="doDeleteAnnouncement(${id})">Delete</button>
    </p>
  `);
}

function doDeleteAnnouncement(id) {
  deleteAnnouncement(id);
  closeModal();
  renderAll();
}

/* ---- Comments ---- */

function submitComment(e, id) {
  e.preventDefault();
  const input = e.target.querySelector('input');
  const text = input.value.trim();
  if (!text) return false;
  addComment(id, text);
  renderPosts();
  return false;
}

renderAll();

/* Keep this tab's feed in sync if a post is created/edited/deleted,
   or a comment is added, from another tab (or another logged-in
   user in another window). */
onDataChange(STORAGE_KEYS.announcements, renderAll);
