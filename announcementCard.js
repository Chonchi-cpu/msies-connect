/* ============================================================
   announcementCard.js - reusable announcement/post card component.
   Renders one announcement with its category badge, meta line,
   details, staff edit/delete controls, and a comment thread.
   Relies on global functions defined by the page that uses it:
     openEditAnnouncement(id), confirmDeleteAnnouncement(id),
     submitComment(event, id)
   ============================================================ */

function renderAnnouncementCard(a) {
  const metaParts = [];
  if (a.date) metaParts.push(fmtDate(a.date));
  if (a.time) metaParts.push(a.time);
  if (a.location) metaParts.push(a.location);
  const meta = metaParts.length ? `<p class="muted">${metaParts.join(' · ')}</p>` : '';

  const controls = isStaff()
    ? `
      <div class="card-menu">
        <button type="button" class="card-menu-btn" aria-label="Post options" aria-haspopup="true" aria-expanded="false" onclick="toggleCardMenu(event, ${a.id})">&#8942;</button>
        <div class="card-menu-list" id="card-menu-${a.id}" role="menu" hidden>
          <button type="button" role="menuitem" onclick="closeCardMenus(); openEditAnnouncement(${a.id})">&#9998; Edit</button>
          <button type="button" role="menuitem" class="danger" onclick="closeCardMenus(); confirmDeleteAnnouncement(${a.id})">&#128465; Delete</button>
        </div>
      </div>
    `
    : '';

  const me = getCurrentUser();
  const comments = (a.comments || [])
    .map((c, i) => {
      const author = findCommentAuthor(c);
      const isMe = !!(author && me && author.email.toLowerCase() === me.email.toLowerCase());
      const profileHref = author
        ? (isMe ? 'profile.html' : `view-profile.html?email=${encodeURIComponent(author.email)}`)
        : '';
      const avatar = author
        ? `<a class="avatar comment-avatar" href="${profileHref}" title="View profile" aria-label="View ${escapeAttr(author.name)}'s profile">${avatarInner(author)}</a>`
        : `<span class="avatar">${initialsFor(c.author)}</span>`;
      const name = author
        ? `<a class="comment-author" href="${profileHref}">${c.author}</a>`
        : `<strong>${c.author}</strong>`;
      const canDelete = isMe || isSuperAdmin(); /* teachers can only delete their own comments */
      const canReport = !isMe && !isSuperAdmin(); /* teachers, parents and students report; the Super Admin receives */
      const reports = c.reports || [];
      const reportCount = reports.length;
      const flag = isSuperAdmin() && reportCount
        ? `<span class="comment-flag" title="Reported by ${reportCount} user(s)">&#9873; Reported (${reportCount})</span>`
        : '';
      const reportNote = isSuperAdmin() && reportCount
        ? `<div class="comment-report-note">${reports.map((r) => {
            const u = getUserByEmail(r.by);
            return `Report from ${escapeHtml(u ? u.name : r.by)}${u ? ' (' + escapeHtml(NAV_ROLE_LABELS[u.role] || u.role) + ')' : ''}: ${escapeHtml(r.reason)}`;
          }).join('<br>')}</div>`
        : '';
      const canEdit = isMe;
      const menu = (canEdit || canDelete || canReport)
        ? `
          <div class="card-menu comment-menu">
            <button type="button" class="card-menu-btn" aria-label="Comment options" aria-haspopup="true" aria-expanded="false" onclick="toggleCardMenu(event, 'c${a.id}-${i}')">&#8942;</button>
            <div class="card-menu-list" id="card-menu-c${a.id}-${i}" role="menu" hidden>
              ${canEdit ? `<button type="button" role="menuitem" onclick="closeCardMenus(); startEditComment(${a.id}, ${i})">Edit comment</button>` : ''}
              ${canReport ? `<button type="button" role="menuitem" onclick="closeCardMenus(); openReportComment(${a.id}, '${c.cid}')">Report comment</button>` : ''}
              ${canDelete ? `<button type="button" role="menuitem" class="danger" onclick="closeCardMenus(); ${isMe ? `doDeleteComment(${a.id}, ${i})` : `confirmDeleteComment(${a.id}, ${i})`}">Delete comment</button>` : ''}
            </div>
          </div>`
        : '';
      return `
        <div class="comment-item">
          ${avatar}
          <div class="comment-bubble">
            <div class="comment-head">${name}${flag}</div>
            <div id="comment-body-${a.id}-${i}"><span>${escapeHtml(c.text)}</span>${c.edited ? ' <span class="comment-edited">(edited)</span>' : ''}</div>
            ${reportNote}
          </div>
          ${menu}
        </div>
      `;
    })
    .join('');

  return `
    <div class="card" id="card-${a.id}">
      <div class="card-top">
        <span class="badge badge-${a.category.toLowerCase()}">${a.category}</span>
        ${controls}
      </div>
      <h3>${a.title}</h3>
      ${meta}
      ${postPhotoHtml(a, 'post-photo')}
      <p class="post-details">${sanitizeDetails(a.details)}</p>
      <hr>
      <p><strong>Comments</strong> <span class="muted">(${(a.comments || []).length})</span></p>
      <div class="comment-list">${comments}</div>
      ${isSuperAdmin() ? '' : isCurrentUserMuted() ? `<p class="mute-notice">&#128263; ${escapeHtml(getCurrentUserBlockMessage())}</p>` : `<form class="comment-form" onsubmit="return submitComment(event, ${a.id})">
        <input type="text" placeholder="Write a comment..." required>
        <button type="submit" class="btn btn-small">Send</button>
      </form>`}
    </div>
  `;
}

function initialsFor(name) {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}


/* ---- Post options menu (Edit / Delete) ---- */
function closeCardMenus() {
  document.querySelectorAll('.card-menu-list').forEach((m) => { m.hidden = true; });
  document.querySelectorAll('.card-menu-btn').forEach((b) => b.setAttribute('aria-expanded', 'false'));
}

function toggleCardMenu(e, id) {
  e.stopPropagation();
  const menu = document.getElementById('card-menu-' + id);
  const wasOpen = !menu.hidden;
  closeCardMenus();
  if (!wasOpen) {
    menu.hidden = false;
    e.currentTarget.setAttribute('aria-expanded', 'true');
  }
}

document.addEventListener('click', closeCardMenus);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCardMenus(); });
