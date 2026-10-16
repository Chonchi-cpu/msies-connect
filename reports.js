/* ============================================================
   reports.js - page logic for reports.html (Super Admin only)
   The page also holds contact-info requests (see requests.js).

   Comment moderation has three views:
     Review queue      - comments with user reports and/or a
                         spam-filter flag. Dismiss (keep) or delete,
                         optionally warning / muting the author.
     Blocked by filter - comments the spam filter refused to post.
     History           - every resolved review, kept for the record.
   Comments are always addressed by their id (cid), never by list
   position, so an action can't hit the wrong comment if the list
   changed while a dialog was open.
   ============================================================ */

requireAuth();
if (!getCurrentUser() || getCurrentUser().role !== 'superadmin') {
  window.location.href = 'feed.html';
}
renderNavbar('dashboard');
renderDashTabs('reports');

let modView = 'queue';
const MOD_VIEWS = [['queue', 'Review queue'], ['blocked', 'Blocked by filter'], ['history', 'History']];
let reportSort = 'Most reported';
const REPORT_SORTS = ['Most reported', 'Newest', 'Spam score'];

function repEsc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
function repWhen(at) {
  return at ? new Date(at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
}
function repEmpty(icon, title, text) {
  return `
    <div class="card empty-state">
      <div class="icon-circle success">${icon}</div>
      <strong>${title}</strong>
      <p class="muted">${text}</p>
    </div>`;
}
function repPlural(n, word) { return n + ' ' + word + (n === 1 ? '' : 's'); }

/* ---------- queue helpers ---------- */

function modScore(c) { return c.autoFlag ? Number(c.autoFlag.score) || 0 : 0; }
function modLatest(c) {
  return Math.max(0, ...(c.reports || []).map((r) => r.at || 0), c.autoFlag ? c.autoFlag.at || 0 : 0);
}
function modQueue() {
  const out = getModerationQueue();
  out.sort((x, y) => {
    const a = x.comment;
    const b = y.comment;
    if (reportSort === 'Newest') return modLatest(b) - modLatest(a);
    if (reportSort === 'Spam score') return modScore(b) - modScore(a) || (b.reports || []).length - (a.reports || []).length;
    return (b.reports || []).length - (a.reports || []).length || modScore(b) - modScore(a);
  });
  return out;
}
function modFind(postId, cid) {
  const post = getAnnouncements().find((a) => a.id === postId);
  const comment = post ? (post.comments || []).find((c) => c.cid === cid) : null;
  return { post, comment };
}

/* Picks the warning that best matches why a comment was in the queue. */
const MOD_REASON_MAP = {
  'Spam': 'Spam or irrelevant content',
  'Offensive or inappropriate': 'Abusive or offensive language',
  'Harassment or bullying': 'Harassment or bullying',
  'False information': 'Other violation of the community rules',
  'Other': 'Other violation of the community rules'
};
/* Which warning fits what the abuse filter found. */
function modAbuseReason(categories) {
  const cats = categories || [];
  if (cats.some((x) => x === 'threat' || x === 'harassment' || x === 'self-harm')) return 'Harassment or bullying';
  if (cats.length) return 'Abusive or offensive language';
  return '';
}
/* Name of the filter that fired: 'spam', 'abuse' or 'spam+abuse'. */
function modFilterName(kind) {
  return kind === 'abuse' ? 'Abuse filter' : kind === 'spam+abuse' ? 'Spam & abuse filter' : 'Spam filter';
}
function modSuggestReason(c) {
  const counts = {};
  (c.reports || []).forEach((r) => { counts[r.reason] = (counts[r.reason] || 0) + 1; });
  const top = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
  if (top && MOD_REASON_MAP[top]) return MOD_REASON_MAP[top];
  const fromAbuse = c.autoFlag ? modAbuseReason(c.autoFlag.categories) : '';
  return fromAbuse || 'Spam or irrelevant content';
}

/* ---------- shared bits of markup ---------- */

function modPerson(email, fallbackName) {
  const u = getUserByEmail(email);
  const role = u ? (NAV_ROLE_LABELS[u.role] || u.role) : 'Guest';
  const avatar = u ? avatarInner(u) : repEsc(personInitials(fallbackName));
  const name = u
    ? `<a class="comment-author" href="view-profile.html?email=${encodeURIComponent(u.email)}"><strong>${repEsc(fallbackName || u.name)}</strong></a>`
    : `<strong>${repEsc(fallbackName)}</strong>`;
  return { user: u, role, avatar, name };
}

function modStatusChips(u) {
  if (!u || !canModerateUser(u.email)) return '';
  const warns = getWarnings(u.email).length;
  const chips = [];
  if (warns) chips.push(`<span class="comment-flag comment-flag-warn">&#9888; ${repPlural(warns, 'warning')}</span>`);
  if (isUserMuted(u.email)) chips.push('<span class="comment-flag comment-flag-mute">&#128263; Muted</span>');
  return chips.length ? `<div class="mod-chips">${chips.join('')}</div>` : '';
}

function scorePill(score) {
  const cls = score >= SPAM_BLOCK_AT_UI ? 'score-high' : 'score-mid';
  return `<span class="score-pill ${cls}" title="Filter score out of 100">Score ${Number(score) || 0}/100</span>`;
}
const SPAM_BLOCK_AT_UI = 70; /* same cut-off as spamFilter.js (not loaded on this page) */

function spamBox(reasons, matches, score, kind) {
  const rs = reasons || [];
  const ms = (matches || []).filter(Boolean);
  return `
    <div class="auto-flag-box">
      <div class="auto-flag-head"><strong>${modFilterName(kind)}</strong>${scorePill(score)}</div>
      ${rs.length ? `<ul class="spam-reasons">${rs.map((r) => `<li>${repEsc(r)}</li>`).join('')}</ul>` : ''}
      ${ms.length ? `<div class="spam-matches">Matched: ${ms.map((m) => `<code>${repEsc(m)}</code>`).join(' ')}</div>` : ''}
    </div>`;
}

/* ---------- stats + tabs ---------- */

function renderRepStats() {
  const reqs = typeof getContactRequests === 'function' ? getContactRequests() : [];
  const n = (st) => reqs.filter((r) => r.status === st).length;
  const open = getOpenModerationCount();
  const blocked = getSpamLog().length;
  const stats = [
    { n: open, label: 'Comments to review', cls: open ? 'stat-alert' : '' },
    { n: blocked, label: 'Blocked by filters', cls: blocked ? 'stat-warn' : '' },
    { n: n('pending'), label: 'Pending requests', cls: n('pending') ? 'stat-warn' : '' },
    { n: n('approved'), label: 'Approved requests', cls: '' },
    { n: n('declined'), label: 'Declined requests', cls: '' }
  ];
  document.getElementById('rep-stats').innerHTML = stats
    .map((s) => `<div class="card dash-stat ${s.cls}"><strong>${s.n}</strong><span class="muted">${s.label}</span></div>`)
    .join('');
  if (typeof refreshDashTabs === 'function') refreshDashTabs();
}

function setModView(v) { modView = v; renderReports(); }
function setReportSort(s) { reportSort = s; renderReports(); }

function renderReports() {
  const counts = { queue: getOpenModerationCount(), blocked: getSpamLog().length, history: getModerationCases().length };
  document.getElementById('report-filters').innerHTML = MOD_VIEWS
    .map(([id, label]) => `<button type="button" class="btn btn-small ${id === modView ? '' : 'btn-outline'}" onclick="setModView('${id}')">${label} (${counts[id]})</button>`)
    .join('');

  const intro = {
    queue: 'Comments reported by teachers, parents and students, or flagged by the automatic spam and abuse filters. Keep the comment (dismiss), or delete it and optionally warn or mute the author.',
    blocked: 'Comments the spam or abuse filter refused to post. They never appeared on a post. Warn or mute repeat senders, or clear entries you have checked.',
    history: 'Every review you have closed, with the comment as it was, who closed it, and what happened.'
  };
  document.getElementById('report-intro').textContent = intro[modView];

  document.getElementById('report-sort').innerHTML = modView === 'queue' && counts.queue > 1
    ? '<span class="muted">Sort by</span> ' + REPORT_SORTS
        .map((s) => `<button type="button" class="btn btn-small ${s === reportSort ? '' : 'btn-outline'}" onclick="setReportSort('${s}')">${s}</button>`).join('')
    : '';

  const body = modView === 'blocked' ? renderBlocked() : modView === 'history' ? renderHistory() : renderQueue();
  document.getElementById('report-list').innerHTML = body;
  renderRepStats();
}

/* ============================================================
   Review queue
   ============================================================ */

function renderQueue() {
  const list = modQueue();
  if (!list.length) return repEmpty('&#10003;', 'All clear', 'Nothing to review. Reported and spam-flagged comments will show up here.');
  return list.map(({ post, comment }) => {
    const p = modPerson(comment.authorEmail, comment.author);
    const user = p.user || findCommentAuthor(comment);
    const reports = comment.reports || [];
    const auto = comment.autoFlag || null;
    const flags = [
      reports.length ? `<span class="comment-flag">&#9873; ${repPlural(reports.length, 'report')}</span>` : '',
      auto ? `<span class="comment-flag comment-flag-auto">${modFilterName(auto.kind)} flag</span>` : ''
    ].join(' ');
    const reportItems = reports.map((r) => {
      const u = getUserByEmail(r.by);
      const who = u ? u.name : r.by;
      const rrole = u ? (NAV_ROLE_LABELS[u.role] || u.role) : '';
      const when = repWhen(r.at);
      return `
        <li class="report-item">
          <span class="avatar">${u ? avatarInner(u) : repEsc(personInitials(who))}</span>
          <div>
            <div><strong>${repEsc(who)}</strong>${rrole ? ` <span class="muted">${repEsc(rrole)}</span>` : ''}${when ? ` <span class="muted">&middot; ${when}</span>` : ''}</div>
            <div class="report-reason">${repEsc(r.reason)}</div>
            ${r.note ? `<div class="muted">&ldquo;${repEsc(r.note)}&rdquo;</div>` : ''}
          </div>
        </li>`;
    }).join('');
    return `
      <div class="card report-card">
        <div class="report-head">
          <span class="avatar lg">${p.avatar}</span>
          <div class="account-info">
            ${p.name} <span class="badge badge-other">${repEsc(p.role)}</span>
            <div class="muted">On post: ${repEsc(post.title)}</div>
          </div>
          <div>${flags}</div>
        </div>
        ${modStatusChips(user)}
        <blockquote class="report-quote">${repEsc(comment.text)}${comment.edited ? ' <span class="comment-edited">(edited)</span>' : ''}</blockquote>
        ${auto ? spamBox(auto.reasons, auto.matches, auto.score, auto.kind) : ''}
        ${reports.length ? `<div class="report-sub">Reported by</div><ul class="report-list">${reportItems}</ul>` : ''}
        <div class="report-actions">
          <button type="button" class="btn btn-small btn-outline" onclick="modDismiss(${post.id}, '${comment.cid}')">Dismiss &amp; keep comment</button>
          <button type="button" class="btn btn-small btn-danger" onclick="modOpenDelete(${post.id}, '${comment.cid}')">Delete comment&hellip;</button>
        </div>
      </div>`;
  }).join('');
}

function modDismiss(postId, cid) {
  dismissComment(postId, cid);
  renderReports();
}

function modOpenDelete(postId, cid) {
  const { comment } = modFind(postId, cid);
  if (!comment) { renderReports(); return; }
  const author = findCommentAuthor(comment);
  const can = !!author && canModerateUser(author.email);
  const alreadyMuted = can && isUserMuted(author.email);
  const reason = modSuggestReason(comment);
  openModal(`
    <div class="modal-header">
      <h2>Delete this comment?</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="icon-circle danger">&#9888;</div>
    <p style="text-align:center">It will be removed from the post. This can't be undone, but a copy is kept in History.</p>
    <div class="warn-quote">${repEsc(comment.author)}: &ldquo;${repEsc(comment.text)}&rdquo;</div>
    <form onsubmit="return modDoDelete(event, ${postId}, '${cid}')">
      ${can ? `
        <label class="frame-toggle"><input type="checkbox" id="mod-warn" onchange="document.getElementById('mod-warn-fields').hidden = !this.checked"> Also warn ${repEsc(author.name)}</label>
        <div id="mod-warn-fields" hidden>
          <label for="mod-warn-reason"><strong>Violation</strong></label>
          <select id="mod-warn-reason">
            ${WARNING_REASONS.map((r) => `<option value="${repEsc(r)}"${r === reason ? ' selected' : ''}>${repEsc(r)}</option>`).join('')}
          </select>
          <label for="mod-warn-note"><strong>Message to the user</strong> <span class="muted">(optional)</span></label>
          <textarea id="mod-warn-note" rows="2" maxlength="300" placeholder="Add details about what they did wrong..."></textarea>
        </div>
        ${alreadyMuted ? '' : `<label class="frame-toggle"><input type="checkbox" id="mod-mute"> Also mute ${repEsc(author.name)} (can read, but can't comment or chat)</label>`}`
      : ''}
      <p style="text-align:right">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-danger">Delete comment</button>
      </p>
    </form>
  `);
}

function modDoDelete(e, postId, cid) {
  e.preventDefault();
  const { comment } = modFind(postId, cid);
  const author = comment ? findCommentAuthor(comment) : null;
  const can = !!author && canModerateUser(author.email);
  const warnBox = document.getElementById('mod-warn');
  const muteBox = document.getElementById('mod-mute');
  const warn = can && !!warnBox && warnBox.checked;
  const mute = can && !!muteBox && muteBox.checked;
  const reason = warn ? document.getElementById('mod-warn-reason').value : '';
  const note = warn ? document.getElementById('mod-warn-note').value.trim() : '';
  const removed = deleteCommentById(postId, cid, { warned: warn, warnReason: reason, muted: mute });
  if (removed && warn) warnUser(author.email, reason, note);
  if (removed && mute) setUserMuted(author.email, true);
  closeModal();
  renderReports();
  return false;
}

/* ============================================================
   Blocked by the spam filter
   ============================================================ */

function renderBlocked() {
  const log = getSpamLog().slice().reverse();
  if (!log.length) return repEmpty('&#10003;', 'Nothing blocked', 'Comments the spam filter refuses to post will be listed here.');
  const header = `
    <p style="text-align:right;margin:0 0 10px">
      <button type="button" class="btn btn-small btn-outline" onclick="modConfirmClearLog()">Clear whole log</button>
    </p>`;
  return header + log.map((entry) => {
    const p = modPerson(entry.userEmail, entry.userName);
    const user = p.user;
    const same = log.filter((x) => x.userEmail === entry.userEmail).length;
    const can = !!user && canModerateUser(user.email);
    const muted = can && isUserMuted(user.email);
    return `
      <div class="card report-card">
        <div class="report-head">
          <span class="avatar lg">${p.avatar}</span>
          <div class="account-info">
            ${p.name} <span class="badge badge-other">${repEsc(p.role)}</span>
            <div class="muted">${entry.postTitle ? 'Tried to comment on: ' + repEsc(entry.postTitle) + ' &middot; ' : ''}${repWhen(entry.at)}</div>
          </div>
          <span class="comment-flag">Blocked</span>
        </div>
        ${modStatusChips(user)}
        <blockquote class="report-quote">${repEsc(entry.text)}</blockquote>
        ${spamBox(entry.reasons, entry.matches, entry.score, entry.kind)}
        ${same > 1 ? `<p class="muted" style="margin:10px 0 0">${repPlural(same, 'blocked comment')} from this user in the log.</p>` : ''}
        <div class="report-actions">
          <button type="button" class="btn btn-small btn-outline" onclick="modRemoveLogEntry('${entry.id}')">Remove from log</button>
          ${can ? `<button type="button" class="btn btn-small btn-outline" onclick="modOpenWarnFromLog('${entry.id}')">Warn user</button>` : ''}
          ${can ? (muted
            ? `<button type="button" class="btn btn-small btn-outline" onclick="modSetMute('${entry.id}', false)">Unmute user</button>`
            : `<button type="button" class="btn btn-small btn-danger" onclick="modConfirmMute('${entry.id}')">Mute user</button>`) : ''}
        </div>
      </div>`;
  }).join('');
}

function modLogEntry(id) { return getSpamLog().find((e) => e.id === id) || null; }

function modRemoveLogEntry(id) {
  removeSpamLogEntry(id);
  renderReports();
}

function modConfirmClearLog() {
  openModal(`
    <div class="modal-header">
      <h2>Clear the blocked-comment log?</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="icon-circle danger">&#9888;</div>
    <p style="text-align:center">All ${getSpamLog().length} entries will be removed. This can't be undone.</p>
    <p style="text-align:right">
      <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button type="button" class="btn btn-danger" onclick="clearSpamLog(); closeModal(); renderReports()">Clear log</button>
    </p>
  `);
}

function modOpenWarnFromLog(id) {
  const entry = modLogEntry(id);
  const user = entry ? getUserByEmail(entry.userEmail) : null;
  if (!entry || !user || !canModerateUser(user.email)) return;
  const prior = getWarnings(user.email).length;
  const suggested = modAbuseReason(entry.categories) || 'Spam or irrelevant content';
  openModal(`
    <div class="modal-header">
      <h2>Warn ${repEsc(user.name)}</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="icon-circle danger">&#9888;</div>
    <p class="muted" style="text-align:center">They will see this warning the next time they open MSIES Connect.${prior ? ` They already have ${repPlural(prior, 'previous warning')}.` : ''}</p>
    <div class="warn-quote">&ldquo;${repEsc(entry.text)}&rdquo;</div>
    <form onsubmit="return modSendWarnFromLog(event, '${id}')">
      <label for="mod-warn-reason"><strong>Violation</strong></label>
      <select id="mod-warn-reason">
        ${WARNING_REASONS.map((r) => `<option value="${repEsc(r)}"${r === suggested ? ' selected' : ''}>${repEsc(r)}</option>`).join('')}
      </select>
      <label for="mod-warn-note"><strong>Message to the user</strong> <span class="muted">(optional)</span></label>
      <textarea id="mod-warn-note" rows="3" maxlength="300" placeholder="Add details about what they did wrong..."></textarea>
      <p style="text-align:right">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-danger">Send warning</button>
      </p>
    </form>
  `);
}
function modSendWarnFromLog(e, id) {
  e.preventDefault();
  const entry = modLogEntry(id);
  if (entry) {
    warnUser(entry.userEmail, document.getElementById('mod-warn-reason').value, document.getElementById('mod-warn-note').value.trim());
  }
  closeModal();
  renderReports();
  return false;
}

function modConfirmMute(id) {
  const entry = modLogEntry(id);
  const user = entry ? getUserByEmail(entry.userEmail) : null;
  if (!user) return;
  openModal(`
    <div class="modal-header">
      <h2>Mute ${repEsc(user.name)}?</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="icon-circle danger">&#128263;</div>
    <p style="text-align:center">They will still be able to read posts and chats, but they won't be able to comment or send messages until you unmute them.</p>
    <p style="text-align:right">
      <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button type="button" class="btn btn-danger" onclick="modSetMute('${id}', true)">Mute user</button>
    </p>
  `);
}
function modSetMute(id, mute) {
  const entry = modLogEntry(id);
  if (entry) setUserMuted(entry.userEmail, mute);
  closeModal();
  renderReports();
}

/* ============================================================
   History
   ============================================================ */

function renderHistory() {
  const cases = getModerationCases().slice().reverse();
  if (!cases.length) return repEmpty('&#128193;', 'No history yet', 'When you dismiss or delete a reviewed comment, a record is kept here.');
  return cases.map((c) => {
    const p = modPerson(c.authorEmail, c.authorName);
    const deleted = c.action === 'deleted';
    const reasonCounts = {};
    (c.reports || []).forEach((r) => { reasonCounts[r.reason] = (reasonCounts[r.reason] || 0) + 1; });
    const reportLine = (c.reports || []).length
      ? `${repPlural(c.reports.length, 'user report')}: ${Object.keys(reasonCounts).map((k) => repEsc(k) + (reasonCounts[k] > 1 ? ' &times;' + reasonCounts[k] : '')).join(', ')}`
      : '';
    const autoLine = c.autoFlag
      ? `${modFilterName(c.autoFlag.kind)}, score ${Number(c.autoFlag.score) || 0}/100: ${repEsc((c.autoFlag.reasons || []).join(', ') || 'flagged')}`
      : '';
    const chips = [
      c.warned ? `<span class="comment-flag comment-flag-warn">&#9888; Warned${c.warnReason ? ': ' + repEsc(c.warnReason) : ''}</span>` : '',
      c.muted ? '<span class="comment-flag comment-flag-mute">&#128263; Muted</span>' : ''
    ].join(' ').trim();
    return `
      <div class="card report-card">
        <div class="report-head">
          <span class="avatar lg">${p.avatar}</span>
          <div class="account-info">
            ${p.name} <span class="badge badge-other">${repEsc(p.role)}</span>
            <div class="muted">On post: ${repEsc(c.postTitle)}</div>
          </div>
          <span class="badge ${deleted ? 'badge-danger' : ''}">${deleted ? 'Deleted' : 'Dismissed'}</span>
        </div>
        <blockquote class="report-quote">${repEsc(c.text)}</blockquote>
        ${reportLine || autoLine ? `<div class="muted history-why">${[reportLine, autoLine].filter(Boolean).join('<br>')}</div>` : ''}
        ${chips ? `<div class="mod-chips">${chips}</div>` : ''}
        <div class="muted history-by">${deleted ? 'Deleted' : 'Dismissed'} by ${repEsc(c.by ? c.by.name : 'Super Admin')} &middot; ${repWhen(c.at)}</div>
      </div>`;
  }).join('');
}

renderReports();
