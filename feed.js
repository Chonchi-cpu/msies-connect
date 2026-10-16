/* ============================================================
   feed.js - page logic for feed.html
   Category filtering + post display + upcoming events, plus
   staff-only create/edit/delete of announcements and
   commenting for every logged-in role except the Super Admin.
   ============================================================ */

requireAuth();
if (getCurrentUser() && getCurrentUser().role === 'superadmin') {
  window.location.href = 'dashboard.html'; /* Super Admin uses the Dashboard instead */
}
renderNavbar('feed');

const FILTERS = ['All', 'Events', 'Holidays', 'Reminders', 'Other'];
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
  if (isCurrentUserMuted()) { renderPosts(); return false; }
  const res = addComment(id, text);
  if (res.reason === 'blocked') { showBlockedNotice(res.analysis); return false; } /* keep the typed text */
  renderPosts();
  if (res.flagged) showFlaggedNotice(res.analysis);
  return false;
}

/* ---- Automatic filter messages (spam + abuse) ---- */

function filterIsAbuse(analysis) { return !!analysis && String(analysis.kind || '').indexOf('abuse') >= 0; }

function showBlockedNotice(analysis) {
  const reasons = (analysis && analysis.reasons) || [];
  const abuse = filterIsAbuse(analysis);
  const intro = abuse
    ? 'This comment wasn\'t posted because it may contain abusive, hurtful or threatening language. Please keep comments respectful.'
    : 'Our spam filter stopped this comment because it looks like spam.';
  const tip = abuse
    ? 'If this is a mistake, try rewording it. The school admin can see blocked comments, and repeated abuse can lead to a warning or being muted.'
    : 'If this is a mistake, try rewording it without links or repeated text. The school admin can see blocked comments.';
  openModal(`
    <div class="modal-header">
      <h2>Comment not posted</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="icon-circle danger">&#9888;</div>
    <p style="text-align:center">${intro}</p>
    ${reasons.length ? `<ul class="spam-reasons">${reasons.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}</ul>` : ''}
    <p class="muted" style="text-align:center">${tip}</p>
    <p style="text-align:right"><button type="button" class="btn" onclick="closeModal()">Back to my comment</button></p>
  `);
}

function showFlaggedNotice(analysis) {
  const abuse = filterIsAbuse(analysis);
  openModal(`
    <div class="modal-header">
      <h2>Comment posted</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <p>${abuse
      ? 'Your comment is on the post, but it may come across as unkind, so the school admin may review it. Please keep comments respectful. If it\'s fine, nothing else will happen.'
      : 'Your comment is on the post, but it looks a little like spam, so the school admin may review it. If it\'s fine, nothing else will happen.'}</p>
    <p style="text-align:right"><button type="button" class="btn" onclick="closeModal()">OK</button></p>
  `);
}

/* ---- Comment menu actions: edit / delete / report ---- */

/* Swaps the comment text for an input right inside the bubble. */
function startEditComment(id, index) {
  const a = getAnnouncements().find((x) => x.id === id);
  const c = a && a.comments[index];
  const body = document.getElementById('comment-body-' + id + '-' + index);
  if (!c || !body) return;
  body.innerHTML = `
    <form class="comment-edit-form" onsubmit="return saveEditedComment(event, ${id}, ${index})">
      <input type="text" value="${escapeAttr(c.text)}" aria-label="Edit comment" required>
      <button type="submit" class="btn btn-small">Save</button>
      <button type="button" class="btn btn-small btn-outline" onclick="renderPosts()">Cancel</button>
    </form>
  `;
  const input = body.querySelector('input');
  input.addEventListener('keydown', (e) => { if (e.key === 'Escape') renderPosts(); });
  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
}

function saveEditedComment(e, id, index) {
  e.preventDefault();
  const text = e.target.querySelector('input').value.trim();
  if (!text) return false;
  const a = getAnnouncements().find((x) => x.id === id);
  if (a && a.comments[index] && a.comments[index].text !== text) {
    const res = editComment(id, index, text);
    if (res.reason === 'blocked') { showBlockedNotice(res.analysis); return false; } /* stay in the edit box */
    renderPosts();
    if (res.flagged) showFlaggedNotice(res.analysis);
    return false;
  }
  renderPosts();
  return false;
}

function confirmDeleteComment(id, index) {
  openModal(`
    <div class="modal-header">
      <h2>Delete this comment?</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="icon-circle danger">&#9888;</div>
    <p style="text-align:center">This comment will be removed from the post. This can't be undone.</p>
    <p style="text-align:right">
      <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button type="button" class="btn btn-danger" onclick="doDeleteComment(${id}, ${index})">Delete</button>
    </p>
  `);
}

function doDeleteComment(id, index) {
  deleteComment(id, index);
  closeModal();
  renderPosts();
}

const REPORT_REASONS = ['Spam', 'Offensive or inappropriate', 'Harassment or bullying', 'False information', 'Other'];

/* Reports are addressed by the comment's id (cid), not its position,
   so the right comment is reported even if the list changed while
   this dialog was open. */
function openReportComment(id, cid) {
  const a = getAnnouncements().find((x) => x.id === id);
  const c = a && a.comments.find((x) => x.cid === cid);
  if (!c) return;
  openModal(`
    <div class="modal-header">
      <h2>Report comment</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <p class="muted">Tell us what's wrong with this comment. The report will be sent to the Super Admin, who can review it and remove the comment if needed.</p>
    <div class="warn-quote">${escapeHtml(c.author)}: &ldquo;${escapeHtml(c.text)}&rdquo;</div>
    <form onsubmit="return submitReportComment(event, ${id}, '${cid}')">
      <p><label for="report-reason"><strong>Reason</strong></label><br>
        <select id="report-reason">
          ${REPORT_REASONS.map((r) => `<option value="${r}">${r}</option>`).join('')}
        </select>
      </p>
      <p><label for="report-note"><strong>More details</strong> <span class="muted">(optional)</span></label><br>
        <textarea id="report-note" rows="3" maxlength="200" placeholder="Anything the admin should know..."></textarea>
      </p>
      <p style="text-align:right">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn">Submit report</button>
      </p>
    </form>
  `);
}

function submitReportComment(e, id, cid) {
  e.preventDefault();
  const res = reportComment(id, cid, document.getElementById('report-reason').value, document.getElementById('report-note').value);
  const outcome = {
    ok: ['Report submitted', 'Thank you. The Super Admin has received your report and will review the comment.'],
    duplicate: ['Already reported', "You've already reported this comment."],
    self: ["Can't report your own comment", 'You can edit or delete your own comments from the comment menu.'],
    limit: ['Too many reports', "You've sent a lot of reports in the last hour. Please try again later."],
    missing: ['Comment not found', 'This comment is no longer on the post.'],
    denied: ["Can't send report", 'Your account is not able to report comments.']
  }[res] || ['Something went wrong', 'Please try again.'];
  openModal(`
    <div class="modal-header">
      <h2>${outcome[0]}</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <p>${outcome[1]}</p>
    <p style="text-align:right"><button type="button" class="btn" onclick="closeModal()">Close</button></p>
  `);
  renderPosts();
  return false;
}

renderAll();
