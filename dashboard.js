/* ============================================================
   dashboard.js - page logic for dashboard.html (Super Admin only)
   Two sections, switched with the tab bar (#posts / #calendar):
     Manage posts    - list, search, filter, add, edit, delete
                       announcements, plus reported comments.
     Manage calendar - month grid; click a day to add, edit or
                       delete events.
   Posts and events are the same data (announcements), so changes
   here show up on the Feed and Calendar pages too.
   ============================================================ */

requireAuth();
if (!getCurrentUser() || getCurrentUser().role !== 'superadmin') {
  window.location.href = 'feed.html';
}
renderNavbar('dashboard');

const DASH_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const DASH_FILTERS = ['All', 'Events', 'Holidays', 'Reminders', 'Other'];
let dashFilter = 'All';
const dashToday = new Date();
let dashYear = dashToday.getFullYear();
let dashMonth = dashToday.getMonth();

const dashPad = (n) => String(n).padStart(2, '0');
const dashIso = (y, m, d) => `${y}-${dashPad(m + 1)}-${dashPad(d)}`;
function dashEsc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

/* ---- Tabs ---- */

function dashShowTab() {
  const tab = window.location.hash === '#calendar' ? 'calendar' : 'posts';
  document.getElementById('section-posts').hidden = tab !== 'posts';
  document.getElementById('section-calendar').hidden = tab !== 'calendar';
  renderDashTabs(tab);
}
window.addEventListener('hashchange', dashShowTab);

/* ---- Stats ---- */

/* Comments waiting for review: user reports and spam/abuse-filter flags. */
function dashReportedList() {
  return getModerationQueue();
}

function dashRenderStats() {
  const list = getAnnouncements();
  const todayIso = dashIso(dashToday.getFullYear(), dashToday.getMonth(), dashToday.getDate());
  const upcoming = list.filter((a) => a.date && a.date >= todayIso).length;
  const stats = [
    { n: list.length, label: 'Total posts' },
    { n: upcoming, label: 'Upcoming events' },
    { n: dashReportedList().length, label: 'Comments to review' },
    { n: getUsers().length, label: 'Accounts' }
  ];
  document.getElementById('dash-stats').innerHTML = stats
    .map((s) => `<div class="card dash-stat"><strong>${s.n}</strong><span class="muted">${s.label}</span></div>`)
    .join('');
}

/* ============================================================
   Manage posts
   ============================================================ */

function dashRenderFilters() {
  document.getElementById('dash-filters').innerHTML = DASH_FILTERS.map(
    (f) => `<button type="button" class="btn ${f === dashFilter ? '' : 'btn-outline'}" onclick="dashSetFilter('${f}')">${f}</button>`
  ).join('');
}
function dashSetFilter(f) {
  dashFilter = f;
  dashRenderFilters();
  dashRenderPosts();
}

function dashRenderPosts() {
  const q = document.getElementById('dash-post-search').value.trim().toLowerCase();
  const list = getAnnouncements()
    .filter((a) => dashFilter === 'All' || a.category === dashFilter)
    .filter((a) => !q || String(a.title).toLowerCase().includes(q))
    .slice()
    .reverse();

  document.getElementById('dash-post-list').innerHTML = list.length
    ? list.map((a) => {
        const meta = [a.date ? fmtDate(a.date) : '', a.time, a.location].filter(Boolean).join(' · ');
        const reported = (a.comments || []).filter((c) => (c.reports || []).length || c.autoFlag).length;
        return `
          <div class="card account-row post-row" role="button" tabindex="0" aria-label="Preview ${dashEsc(a.title)}"
               onclick="dashOpenPreview(${a.id})" onkeydown="if (event.key === 'Enter') dashOpenPreview(${a.id})">
            <div class="account-info">
              <span class="badge badge-${a.category.toLowerCase()}">${a.category}</span>
              <strong style="display:block;margin-top:6px;">${dashEsc(a.title)}</strong>
              <div class="muted">${dashEsc(meta) || 'No date'} · ${(a.comments || []).length} comment(s)${reported ? ` · <span class="comment-flag">&#9873; ${reported} to review</span>` : ''}</div>
            </div>
            <div class="card-menu" onclick="event.stopPropagation()" onkeydown="event.stopPropagation()">
              <button type="button" class="card-menu-btn" aria-label="Post options" aria-haspopup="true" aria-expanded="false" onclick="dashToggleMenu(event, 'p${a.id}')">&#8942;</button>
              <div class="card-menu-list" id="dash-menu-p${a.id}" role="menu" hidden>
                <button type="button" role="menuitem" onclick="dashCloseMenus(); dashOpenEditPost(${a.id})">&#9998; Edit post</button>
                <button type="button" role="menuitem" class="danger" onclick="dashCloseMenus(); dashConfirmDeletePost(${a.id})">&#128465; Delete post</button>
              </div>
            </div>
          </div>`;
      }).join('')
    : '<p class="muted">No posts found.</p>';
}

/* ---- Preview a post: full content + everyone's comments ---- */

function dashOpenPreview(id) {
  const a = getAnnouncements().find((x) => x.id === id);
  if (!a) return;
  const meta = [a.date ? fmtDate(a.date) : '', a.time, a.location].filter(Boolean).join(' · ');
  const comments = (a.comments || []).map((c, i) => {
    const author = findCommentAuthor(c);
    const reports = c.reports || [];
    const auto = c.autoFlag || null;
    const role = author ? (NAV_ROLE_LABELS[author.role] || author.role) : '';
    const canModerate = !!author && canModerateUser(author.email);
    const warnCount = canModerate ? getWarnings(author.email).length : 0;
    const muted = canModerate && isUserMuted(author.email);
    return `
      <div class="comment-item">
        ${author ? `<span class="avatar">${avatarInner(author)}</span>` : `<span class="avatar">${dashEsc(personInitials(c.author))}</span>`}
        <div class="comment-bubble">
          <div class="comment-head">
            ${author ? `<a class="comment-author" href="view-profile.html?email=${encodeURIComponent(author.email)}">${dashEsc(c.author)}</a>` : `<strong>${dashEsc(c.author)}</strong>`}
            ${role ? `<span class="muted">${dashEsc(role)}</span>` : ''}
            ${reports.length ? `<span class="comment-flag">&#9873; Reported (${reports.length})</span>` : ''}
            ${auto ? `<span class="comment-flag comment-flag-auto">${auto.kind === 'abuse' ? 'Abuse' : auto.kind === 'spam+abuse' ? 'Spam &amp; abuse' : 'Spam'} filter flag</span>` : ''}
            ${warnCount ? `<span class="comment-flag comment-flag-warn">&#9888; ${warnCount} warning${warnCount === 1 ? '' : 's'}</span>` : ''}
            ${muted ? `<span class="comment-flag comment-flag-mute">&#128263; Muted</span>` : ''}
          </div>
          <div>${dashEsc(c.text)}${c.edited ? ' <span class="comment-edited">(edited)</span>' : ''}</div>
          ${reports.length || auto ? `<div class="comment-report-note">${[
            ...(auto ? [`${auto.kind === 'abuse' ? 'Abuse' : auto.kind === 'spam+abuse' ? 'Spam & abuse' : 'Spam'} filter (score ${auto.score}/100): ${dashEsc((auto.reasons || []).join(', ') || 'flagged')}`] : []),
            ...reports.map((r) => {
              const u = getUserByEmail(r.by);
              return `Report from ${dashEsc(u ? u.name : r.by)}${u ? ' (' + dashEsc(NAV_ROLE_LABELS[u.role] || u.role) + ')' : ''}: ${dashEsc(r.reason)}`;
            })
          ].join('<br>')}</div>` : ''}
        </div>
        <div class="card-menu comment-menu">
          <button type="button" class="card-menu-btn" aria-label="Comment options" aria-haspopup="true" aria-expanded="false" onclick="dashToggleMenu(event, 'c${a.id}-${i}')">&#8942;</button>
          <div class="card-menu-list" id="dash-menu-c${a.id}-${i}" role="menu" hidden>
            ${canModerate ? `<button type="button" role="menuitem" onclick="dashCloseMenus(); dashOpenWarn(${a.id}, ${i})">Warn user</button>` : ''}
            ${canModerate ? (muted
              ? `<button type="button" role="menuitem" onclick="dashCloseMenus(); dashDoMute(${a.id}, ${i}, false)">Unmute user</button>`
              : `<button type="button" role="menuitem" onclick="dashCloseMenus(); dashConfirmMute(${a.id}, ${i})">Mute user</button>`) : ''}
            <button type="button" role="menuitem" class="danger" onclick="dashCloseMenus(); dashConfirmDeleteComment(${a.id}, ${i}, true)">Delete comment</button>
          </div>
        </div>
      </div>`;
  }).join('');
  openModal(`
    <div class="modal-header">
      <h2>Post preview</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <span class="badge badge-${a.category.toLowerCase()}">${a.category}</span>
    <h3>${dashEsc(a.title)}</h3>
    ${meta ? `<p class="muted">${dashEsc(meta)}</p>` : ''}
    ${postPhotoHtml(a, 'post-photo')}
    <p class="post-details">${sanitizeDetails(a.details)}</p>
    <hr>
    <p><strong>Comments</strong> <span class="muted">(${(a.comments || []).length})</span></p>
    <div class="comment-list">${comments || '<p class="muted">No comments yet.</p>'}</div>
    <p style="text-align:right">
      <button type="button" class="btn btn-outline" onclick="closeModal()">Close</button>
    </p>
  `);
}

function dashOpenNewPost() {
  openModal(`
    <div class="modal-header">
      <h2>New announcement</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <p class="muted">Post something for parents, teachers, and students to see.</p>
    <form id="post-form" onsubmit="return dashSubmitNewPost(event)">
      ${postFormFields()}
      <p style="text-align:right">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn">Publish</button>
      </p>
    </form>
  `);
}
function dashSubmitNewPost(e) {
  e.preventDefault();
  addAnnouncement(readPostForm());
  closeModal();
  dashRenderAll();
  return false;
}

function dashOpenEditPost(id) {
  const a = getAnnouncements().find((x) => x.id === id);
  if (!a) return;
  openModal(`
    <div class="modal-header">
      <h2>Edit announcement</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <form id="post-form" onsubmit="return dashSubmitEditPost(event, ${id})">
      ${postFormFields(a)}
      <p style="text-align:right">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn">Save changes</button>
      </p>
    </form>
  `);
}
function dashSubmitEditPost(e, id) {
  e.preventDefault();
  updateAnnouncement(id, readPostForm());
  closeModal();
  dashRenderAll();
  return false;
}

function dashConfirmDeletePost(id) {
  const a = getAnnouncements().find((x) => x.id === id);
  if (!a) return;
  openModal(`
    <div class="modal-header">
      <h2>Delete this post?</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="icon-circle danger">&#9888;</div>
    <p style="text-align:center">"${dashEsc(a.title)}" will be removed from the feed and calendar. This can't be undone.</p>
    <p style="text-align:right">
      <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button type="button" class="btn btn-danger" onclick="dashDoDeletePost(${id})">Delete</button>
    </p>
  `);
}
function dashDoDeletePost(id) {
  deleteAnnouncement(id);
  closeModal();
  dashRenderAll();
}

/* ---- Comment options menu (Warn / Mute / Delete) ----
   The list is position:fixed so it never gets clipped by the
   scrolling preview modal; it flips upward near the screen bottom. */
function dashCloseMenus() {
  document.querySelectorAll('.card-menu-list').forEach((m) => { m.hidden = true; });
  document.querySelectorAll('.card-menu-btn').forEach((b) => b.setAttribute('aria-expanded', 'false'));
}
function dashToggleMenu(e, key) {
  e.stopPropagation();
  const btn = e.currentTarget;
  const menu = document.getElementById('dash-menu-' + key);
  if (!menu) return;
  const wasOpen = !menu.hidden;
  dashCloseMenus();
  if (wasOpen) return;
  menu.hidden = false;
  btn.setAttribute('aria-expanded', 'true');
  const r = btn.getBoundingClientRect();
  const h = menu.offsetHeight;
  const w = menu.offsetWidth;
  const below = r.bottom + 4 + h <= window.innerHeight - 8;
  menu.style.position = 'fixed';
  menu.style.top = (below ? r.bottom + 4 : Math.max(8, r.top - 4 - h)) + 'px';
  menu.style.left = Math.max(8, r.right - w) + 'px';
  menu.style.right = 'auto';
}
document.addEventListener('click', dashCloseMenus);

/* The registered account behind a comment (null for guests). */
function dashCommentAuthor(id, index) {
  const a = getAnnouncements().find((x) => x.id === id);
  const c = a && a.comments[index];
  return c ? findCommentAuthor(c) : null;
}

/* ---- Warn a user for a violation (e.g. chat abuse) ---- */
function dashOpenWarn(id, index) {
  const author = dashCommentAuthor(id, index);
  if (!author) return;
  const a = getAnnouncements().find((x) => x.id === id);
  const c = a.comments[index];
  const prior = getWarnings(author.email).length;
  openModal(`
    <div class="modal-header">
      <h2>Warn ${dashEsc(author.name)}</h2>
      <button class="modal-close" onclick="dashOpenPreview(${id})">&times;</button>
    </div>
    <div class="icon-circle danger">&#9888;</div>
    <p class="muted" style="text-align:center">They will see this warning the next time they open MSIES Connect.${prior ? ` They already have ${prior} previous warning${prior === 1 ? '' : 's'}.` : ''}</p>
    <div class="warn-quote">&ldquo;${dashEsc(c.text)}&rdquo;</div>
    <form onsubmit="return dashSendWarn(event, ${id}, ${index})">
      <label for="warn-reason"><strong>Violation</strong></label>
      <select id="warn-reason" required>
        ${WARNING_REASONS.map((r) => `<option value="${dashEsc(r)}">${dashEsc(r)}</option>`).join('')}
      </select>
      <label for="warn-note"><strong>Message to the user</strong> <span class="muted">(optional)</span></label>
      <textarea id="warn-note" rows="3" maxlength="300" placeholder="Add details about what they did wrong..."></textarea>
      <p style="text-align:right">
        <button type="button" class="btn btn-outline" onclick="dashOpenPreview(${id})">Cancel</button>
        <button type="submit" class="btn btn-danger">Send warning</button>
      </p>
    </form>
  `);
}
function dashSendWarn(e, id, index) {
  e.preventDefault();
  const author = dashCommentAuthor(id, index);
  const reason = document.getElementById('warn-reason').value;
  const note = document.getElementById('warn-note').value.trim();
  if (author) warnUser(author.email, reason, note);
  dashOpenPreview(id);
  return false;
}

/* ---- Mute / unmute a user ---- */
function dashConfirmMute(id, index) {
  const author = dashCommentAuthor(id, index);
  if (!author) return;
  openModal(`
    <div class="modal-header">
      <h2>Mute ${dashEsc(author.name)}?</h2>
      <button class="modal-close" onclick="dashOpenPreview(${id})">&times;</button>
    </div>
    <div class="icon-circle danger">&#128263;</div>
    <p style="text-align:center">They will still be able to read posts and chats, but they won't be able to comment or send messages until you unmute them.</p>
    <p style="text-align:right">
      <button type="button" class="btn btn-outline" onclick="dashOpenPreview(${id})">Cancel</button>
      <button type="button" class="btn btn-danger" onclick="dashDoMute(${id}, ${index}, true)">Mute user</button>
    </p>
  `);
}
function dashDoMute(id, index, mute) {
  const author = dashCommentAuthor(id, index);
  if (author) setUserMuted(author.email, mute);
  dashOpenPreview(id);
}

function dashConfirmDeleteComment(id, index, fromPreview) {
  openModal(`
    <div class="modal-header">
      <h2>Delete this comment?</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="icon-circle danger">&#9888;</div>
    <p style="text-align:center">This comment will be removed from the post. This can't be undone.</p>
    <p style="text-align:right">
      <button type="button" class="btn btn-outline" onclick="${fromPreview ? `dashOpenPreview(${id})` : 'closeModal()'}">Cancel</button>
      <button type="button" class="btn btn-danger" onclick="dashDoDeleteComment(${id}, ${index}, ${!!fromPreview})">Delete</button>
    </p>
  `);
}
function dashDoDeleteComment(id, index, fromPreview) {
  deleteComment(id, index);
  closeModal();
  dashRenderAll();
  if (fromPreview) dashOpenPreview(id);
}

/* ============================================================
   Manage calendar
   ============================================================ */

function dashPrevMonth() {
  dashMonth--;
  if (dashMonth < 0) { dashMonth = 11; dashYear--; }
  dashRenderCalendar();
}
function dashNextMonth() {
  dashMonth++;
  if (dashMonth > 11) { dashMonth = 0; dashYear++; }
  dashRenderCalendar();
}

function dashRenderCalendar() {
  document.getElementById('dash-cal-title').textContent = `${DASH_MONTHS[dashMonth]} ${dashYear}`;
  const firstDay = new Date(dashYear, dashMonth, 1).getDay();
  const daysInMonth = new Date(dashYear, dashMonth + 1, 0).getDate();
  const events = getAnnouncements().filter((a) => a.date);
  const todayIso = dashIso(dashToday.getFullYear(), dashToday.getMonth(), dashToday.getDate());

  let html = '<tr>' + ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => `<th>${d}</th>`).join('') + '</tr>';
  let day = 1;
  for (let row = 0; row < 6 && day <= daysInMonth; row++) {
    html += '<tr>';
    for (let col = 0; col < 7; col++) {
      if ((row === 0 && col < firstDay) || day > daysInMonth) {
        html += '<td></td>';
      } else {
        const iso = dashIso(dashYear, dashMonth, day);
        const badges = events
          .filter((a) => a.date === iso)
          .map((a) => `<div class="day-event badge-${a.category.toLowerCase()}">${a.photo ? '📷 ' : ''}${dashEsc(a.title)}</div>`)
          .join('');
        html += `<td class="clickable${iso === todayIso ? ' is-today' : ''}" onclick="dashOpenDay('${iso}')">
          <div class="day-num">${day}</div>${badges}</td>`;
        day++;
      }
    }
    html += '</tr>';
  }
  document.getElementById('dash-calendar-table').innerHTML = html;
}

function dashOpenDay(iso) {
  const events = getAnnouncements().filter((a) => a.date === iso);
  if (!events.length) {
    dashOpenEventForm(null, { date: iso });
    return;
  }
  const rows = events.map((a) => `
    <div class="card">
      <div class="card-top">
        <span class="badge badge-${a.category.toLowerCase()}">${a.category}</span>
        <div>
          <button type="button" class="btn btn-small btn-outline" onclick="dashOpenEventForm(${a.id}, {})">Edit</button>
          <button type="button" class="btn btn-small btn-danger" onclick="dashConfirmDeleteEvent(${a.id})">Delete</button>
        </div>
      </div>
      <h3>${dashEsc(a.title)}</h3>
      <p class="muted">${dashEsc([a.time, a.location].filter(Boolean).join(' · '))}</p>
      ${postPhotoHtml(a, 'post-photo')}
      <p class="post-details">${sanitizeDetails(a.details)}</p>
    </div>`).join('');
  openModal(`
    <div class="modal-header">
      <h2>${fmtDate(iso)}</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    ${rows}
    <p style="text-align:right">
      <button type="button" class="btn btn-outline" onclick="dashOpenEventForm(null, {date:'${iso}'})">+ Add another event</button>
      <button type="button" class="btn" onclick="closeModal()">Close</button>
    </p>
  `);
}

function dashOpenEventForm(id, presets) {
  const existing = id ? getAnnouncements().find((a) => a.id === id) : { ...presets };
  const isEdit = !!id;
  openModal(`
    <div class="modal-header">
      <h2>${isEdit ? 'Edit event' : 'New event'}</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <form id="event-form" onsubmit="return ${isEdit ? `dashSubmitEditEvent(event, ${id})` : 'dashSubmitNewEvent(event)'}">
      ${postFormFields(existing)}
      <p style="text-align:right">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn">Save event</button>
      </p>
    </form>
  `);
}
function dashSubmitNewEvent(e) {
  e.preventDefault();
  addAnnouncement(readPostForm());
  closeModal();
  dashRenderAll();
  return false;
}
function dashSubmitEditEvent(e, id) {
  e.preventDefault();
  updateAnnouncement(id, readPostForm());
  closeModal();
  dashRenderAll();
  return false;
}

function dashConfirmDeleteEvent(id) {
  const a = getAnnouncements().find((x) => x.id === id);
  if (!a) return;
  openModal(`
    <div class="modal-header">
      <h2>Delete this event?</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="icon-circle danger">&#9888;</div>
    <p style="text-align:center">"${dashEsc(a.title)}" will be removed from the calendar and feed. This can't be undone.</p>
    <p style="text-align:right">
      <button type="button" class="btn btn-outline" onclick="dashOpenDay('${a.date}')">Cancel</button>
      <button type="button" class="btn btn-danger" onclick="dashDoDeleteEvent(${id})">Delete</button>
    </p>
  `);
}
function dashDoDeleteEvent(id) {
  deleteAnnouncement(id);
  closeModal();
  dashRenderAll();
}

/* ---- Init ---- */

function dashRenderAll() {
  dashRenderStats();
  dashRenderFilters();
  dashRenderPosts();
  dashRenderCalendar();
}

dashShowTab();
dashRenderAll();
