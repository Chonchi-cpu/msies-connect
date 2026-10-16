/* ============================================================
   accounts.js - page logic for accounts.html (Super Admin only)
   Teachers are the school's day-to-day admins. The Super Admin
   adds, edits, resets passwords for, and removes accounts here.
   ============================================================ */

requireAuth();
if (!getCurrentUser() || getCurrentUser().role !== 'superadmin') {
  window.location.href = 'feed.html';
}
renderNavbar('accounts');
renderDashTabs('accounts');

const ACCOUNT_ROLES = {
  superadmin: { label: 'Super Admin', badge: 'badge-reminders' },
  teacher: { label: 'Teacher (Admin)', badge: 'badge-events' },
  parent: { label: 'Parent', badge: 'badge-holidays' },
  student: { label: 'Student', badge: 'badge-other' }
};
const ACCOUNT_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'teacher', label: 'Teachers' },
  { id: 'parent', label: 'Parents' },
  { id: 'student', label: 'Students' }
];
let accountFilter = 'all';

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
const sameEmail = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();

/* ---- List ---- */

/* The Super Admin account is hidden from this page entirely. */
function visibleUsers() {
  return getUsers().filter((u) => u.role !== 'superadmin');
}

function renderFilters() {
  const users = visibleUsers();
  document.getElementById('filters').innerHTML = ACCOUNT_FILTERS.map((f) => {
    const n = f.id === 'all' ? users.length : users.filter((u) => u.role === f.id).length;
    return `<button type="button" class="btn ${f.id === accountFilter ? '' : 'btn-outline'}" onclick="setAccountFilter('${f.id}')">${f.label} (${n})</button>`;
  }).join('');
}

function setAccountFilter(id) {
  accountFilter = id;
  renderFilters();
  renderAccounts();
}

function renderAccounts() {
  const me = getCurrentUser();
  if (!me) return; /* logged out: redirecting to login */
  const q = document.getElementById('account-search').value.trim().toLowerCase();
  const list = visibleUsers()
    .filter((u) => accountFilter === 'all' || u.role === accountFilter)
    .filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));

  document.getElementById('account-list').innerHTML = list.length
    ? list.map((u, i) => {
        const role = ACCOUNT_ROLES[u.role] || { label: u.role, badge: '' };
        const isMe = sameEmail(u.email, me.email);
        const status = getAccountStatus(u.email);
        const statusBadge = status.state === 'restricted'
          ? `<span class="comment-flag comment-flag-warn" title="${esc(status.reason)}">Restricted until ${esc(fmtStatusDate(status.until))}</span>`
          : status.state === 'suspended'
          ? `<span class="comment-flag" title="${esc(status.reason)}">Suspended until ${esc(fmtStatusDate(status.until))}</span>`
          : status.state === 'disabled'
          ? `<span class="comment-flag" title="${esc(status.reason)}">Disabled</span>`
          : '';
        const e = esc(u.email);
        /* parents & students get Facebook-style account controls;
           teachers keep edit / reset password */
        const items = canManageStatus(u.email)
          ? `
                ${status.state === 'restricted'
                  ? `<button type="button" role="menuitem" onclick="closeCardMenus(); doRestoreAccount('${e}')">Lift restriction</button>`
                  : status.state === 'active'
                  ? `<button type="button" role="menuitem" onclick="closeCardMenus(); openRestrictAccount('${e}')">Temporary restriction</button>`
                  : ''}
                ${status.state === 'suspended'
                  ? `<button type="button" role="menuitem" onclick="closeCardMenus(); doRestoreAccount('${e}')">Lift suspension</button>`
                  : status.state === 'disabled'
                  ? ''
                  : `<button type="button" role="menuitem" onclick="closeCardMenus(); openSuspendAccount('${e}')">Suspend account</button>`}
                ${status.state === 'disabled'
                  ? `<button type="button" role="menuitem" onclick="closeCardMenus(); doRestoreAccount('${e}')">Re-enable account</button>`
                  : `<button type="button" role="menuitem" onclick="closeCardMenus(); openDisableAccount('${e}')">Disable account</button>`}`
          : `
                <button type="button" role="menuitem" onclick="closeCardMenus(); openEditAccount('${e}')">Edit account</button>
                <button type="button" role="menuitem" onclick="closeCardMenus(); openResetPassword('${e}')">Reset password</button>`;
        const menu = isMe
          ? '<span class="muted" style="font-size:0.8rem;">You</span>'
          : `
            <div class="card-menu">
              <button type="button" class="card-menu-btn" aria-label="Account options" aria-haspopup="true" aria-expanded="false" onclick="toggleCardMenu(event, ${i})">&#8942;</button>
              <div class="card-menu-list" id="card-menu-${i}" role="menu" hidden>${items}
                ${canModerateUser(u.email) ? `<button type="button" role="menuitem" onclick="closeCardMenus(); openWarnings(${esc(JSON.stringify(u.email))})">Warnings (${getWarnings(u.email).length})</button>` : ''}
                <button type="button" role="menuitem" class="danger" onclick="closeCardMenus(); confirmDeleteAccount('${e}')">Delete account</button>
              </div>
            </div>`;
        return `
          <div class="card account-row">
            <span class="avatar lg">${avatarInner(u)}</span>
            <div class="account-info">
              <strong>${esc(u.name)}</strong>
              <div class="muted">${esc(u.email)}${u.section ? ' · ' + esc(u.section) : ''}</div>
              ${statusBadge ? `<div style="margin-top:4px">${statusBadge}</div>` : ''}
            </div>
            <span class="badge ${role.badge}">${role.label}</span>
            ${menu}
          </div>`;
      }).join('')
    : '<p class="muted">No accounts found.</p>';
}

/* ---- Row menu ---- */

function closeCardMenus() {
  document.querySelectorAll('.card-menu-list').forEach((m) => { m.hidden = true; });
  document.querySelectorAll('.card-menu-btn').forEach((b) => b.setAttribute('aria-expanded', 'false'));
}
function toggleCardMenu(e, id) {
  e.stopPropagation();
  const menu = document.getElementById('card-menu-' + id);
  const wasOpen = !menu.hidden;
  closeCardMenus();
  if (!wasOpen) { menu.hidden = false; e.currentTarget.setAttribute('aria-expanded', 'true'); }
}
document.addEventListener('click', closeCardMenus);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCardMenus(); });

/* ---- Add account (teacher or Super Admin) ---- */

function openAddAccount() {
  openModal(`
    <div class="modal-header">
      <h2>Add account</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <form onsubmit="return submitAddAccount(event)">
      <p class="muted">Role: Teacher (Admin). There is only one Super Admin.</p>
      <p>Full name:<br><input type="text" id="ac-name" required></p>
      <p>Email:<br><input type="email" id="ac-email" placeholder="name@msies.edu.ph" required></p>
      <p>Grade / section (optional):<br><input type="text" id="ac-section" placeholder="e.g. Grade 3 Adviser"></p>
      <p>Temporary password:<br><input type="text" id="ac-password" required></p>
      <p class="settings-msg error" id="ac-error" role="alert"></p>
      <p style="text-align:right">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn">Create account</button>
      </p>
    </form>
  `);
}

function submitAddAccount(e) {
  e.preventDefault();
  const err = (m) => { document.getElementById('ac-error').textContent = m; return false; };
  const name = document.getElementById('ac-name').value.trim().replace(/\s+/g, ' ');
  const email = document.getElementById('ac-email').value.trim();
  const section = document.getElementById('ac-section').value.trim();
  const password = document.getElementById('ac-password').value;
  const role = 'teacher'; /* only one Super Admin exists, so new staff are always teachers */
  if (getUserByEmail(email)) return err('An account with that email already exists.');
  const user = { name, email, password, role };
  if (section) user.section = section;
  saveUsers([...getUsers(), user]);
  closeModal();
  renderFilters();
  renderAccounts();
  return false;
}

/* ---- Edit account ---- */

function openEditAccount(email) {
  const u = getUserByEmail(email);
  if (!u) return;
  openModal(`
    <div class="modal-header">
      <h2>Edit account</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <form onsubmit="return submitEditAccount(event, '${esc(u.email)}')">
      <p class="muted">Role: ${(ACCOUNT_ROLES[u.role] || {}).label || u.role}</p>
      <p>Full name:<br><input type="text" id="ac-name" value="${esc(u.name)}" required></p>
      <p>Email:<br><input type="email" id="ac-email" value="${esc(u.email)}" required></p>
      <p>Grade / section:<br><input type="text" id="ac-section" value="${esc(u.section || '')}"></p>
      <p class="settings-msg error" id="ac-error" role="alert"></p>
      <p style="text-align:right">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn">Save changes</button>
      </p>
    </form>
  `);
}

function submitEditAccount(e, oldEmail) {
  e.preventDefault();
  const err = (m) => { document.getElementById('ac-error').textContent = m; return false; };
  const name = document.getElementById('ac-name').value.trim().replace(/\s+/g, ' ');
  const email = document.getElementById('ac-email').value.trim();
  const section = document.getElementById('ac-section').value.trim();
  if (!sameEmail(email, oldEmail) && getUserByEmail(email)) return err('Another account already uses that email.');

  const users = getUsers().map((u) => {
    if (sameEmail(u.email, oldEmail)) {
      const next = { ...u, name, email };
      if (section) next.section = section; else delete next.section;
      return next;
    }
    /* keep parent/student links pointing at a renamed email */
    if (!sameEmail(email, oldEmail) && (u.linked || []).some((x) => sameEmail(x, oldEmail))) {
      return { ...u, linked: u.linked.map((x) => (sameEmail(x, oldEmail) ? email : x)) };
    }
    return u;
  });
  saveUsers(users);
  closeModal();
  renderFilters();
  renderAccounts();
  return false;
}

/* ---- Reset password ---- */

function openResetPassword(email) {
  const u = getUserByEmail(email);
  if (!u) return;
  openModal(`
    <div class="modal-header">
      <h2>Reset password</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <p class="muted">Set a new temporary password for <strong>${esc(u.name)}</strong> (${esc(u.email)}). Share it with them privately.</p>
    <form onsubmit="return submitResetPassword(event, '${esc(u.email)}')">
      <p>New password:<br><input type="text" id="ac-password" required></p>
      <p style="text-align:right">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn">Reset password</button>
      </p>
    </form>
  `);
}

function submitResetPassword(e, email) {
  e.preventDefault();
  const password = document.getElementById('ac-password').value;
  saveUsers(getUsers().map((u) => (sameEmail(u.email, email) ? { ...u, password } : u)));
  openModal(`
    <div class="modal-header">
      <h2>Password reset</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <p>The password was changed. The person can log in with the new password right away.</p>
    <p style="text-align:right"><button type="button" class="btn" onclick="closeModal()">Close</button></p>
  `);
  return false;
}

/* ---- Temporary restriction / suspension / disabling ---- */

function durationOptions() {
  return STATUS_DURATIONS.map((d) => `<option value="${d.days}">${d.label}</option>`).join('');
}

function openRestrictAccount(email) {
  const u = getUserByEmail(email);
  if (!u) return;
  openModal(`
    <div class="modal-header">
      <h2>Temporary restriction</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="icon-circle danger">&#128679;</div>
    <p style="text-align:center"><strong>${esc(u.name)}</strong> will still be able to log in and read posts and chats, but can't comment or send messages until the restriction ends.</p>
    <form onsubmit="return submitRestrictAccount(event, '${esc(u.email)}')">
      <label for="st-days"><strong>Restrict for</strong></label>
      <select id="st-days">${durationOptions()}</select>
      <label for="st-reason"><strong>Reason</strong> <span class="muted">(optional, shown to the user)</span></label>
      <textarea id="st-reason" rows="3" maxlength="300" placeholder="e.g. Abusive language in the Grade 3 chat"></textarea>
      <p style="text-align:right">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-danger">Restrict account</button>
      </p>
    </form>
  `);
}
function submitRestrictAccount(e, email) {
  e.preventDefault();
  restrictAccount(email, parseInt(document.getElementById('st-days').value, 10), document.getElementById('st-reason').value.trim());
  closeModal();
  renderAccounts();
  return false;
}

function openSuspendAccount(email) {
  const u = getUserByEmail(email);
  if (!u) return;
  openModal(`
    <div class="modal-header">
      <h2>Suspend account</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="icon-circle danger">&#9208;</div>
    <p style="text-align:center"><strong>${esc(u.name)}</strong> won't be able to log in until the suspension ends. If they're logged in now, they'll be signed out on their next page.</p>
    <form onsubmit="return submitSuspendAccount(event, '${esc(u.email)}')">
      <label for="st-days"><strong>Suspend for</strong></label>
      <select id="st-days">${durationOptions()}</select>
      <label for="st-reason"><strong>Reason</strong> <span class="muted">(optional, shown to the user)</span></label>
      <textarea id="st-reason" rows="3" maxlength="300" placeholder="e.g. Repeated violations of the community rules"></textarea>
      <p style="text-align:right">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-danger">Suspend account</button>
      </p>
    </form>
  `);
}
function submitSuspendAccount(e, email) {
  e.preventDefault();
  suspendAccount(email, parseInt(document.getElementById('st-days').value, 10), document.getElementById('st-reason').value.trim());
  closeModal();
  renderAccounts();
  return false;
}

function openDisableAccount(email) {
  const u = getUserByEmail(email);
  if (!u) return;
  openModal(`
    <div class="modal-header">
      <h2>Disable account?</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="icon-circle danger">&#128683;</div>
    <p style="text-align:center"><strong>${esc(u.name)}</strong> won't be able to log in until you re-enable the account. Their posts, comments and messages are kept.</p>
    <form onsubmit="return submitDisableAccount(event, '${esc(u.email)}')">
      <label for="st-reason"><strong>Reason</strong> <span class="muted">(optional, shown to the user)</span></label>
      <textarea id="st-reason" rows="3" maxlength="300" placeholder="e.g. Account used by someone else"></textarea>
      <p style="text-align:right">
        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn btn-danger">Disable account</button>
      </p>
    </form>
  `);
}
function submitDisableAccount(e, email) {
  e.preventDefault();
  disableAccount(email, document.getElementById('st-reason').value.trim());
  closeModal();
  renderAccounts();
  return false;
}

/* Lifts a restriction, suspension or disabling. */
function doRestoreAccount(email) {
  restoreAccount(email);
  renderAccounts();
}

/* ---- Warnings: view and remove ---- */

function openWarnings(email) {
  const u = getUserByEmail(email);
  if (!u) return;
  const list = getWarnings(email);
  const q = esc(JSON.stringify(email));
  const rows = list.length
    ? list.slice().reverse().map((w) => `
        <div class="warning-item">
          <strong>${esc(w.reason)}</strong>
          ${w.note ? `<div>${esc(w.note)}</div>` : ''}
          <small class="muted">${esc(w.by)} &middot; ${esc(new Date(w.at).toLocaleString())}${w.seen ? '' : ' &middot; not yet seen by the user'}</small>
          <p style="text-align:right;margin:6px 0 0;"><button type="button" class="btn btn-small btn-outline" onclick="doRemoveWarning(${q}, ${w.at})">Remove this warning</button></p>
        </div>`).join('')
    : '<p class="muted">This account has no warnings.</p>';
  openModal(`
    <div class="modal-header">
      <h2>Warnings</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <p class="muted" style="margin-top:12px;">${esc(u.name)} (${esc(u.email)})</p>
    ${rows}
    <p style="text-align:right">
      ${list.length > 1 ? `<button type="button" class="btn btn-outline" onclick="doRemoveWarning(${q})">Remove all</button>` : ''}
      <button type="button" class="btn" onclick="closeModal()">Close</button>
    </p>
  `);
}

function doRemoveWarning(email, at) {
  removeWarning(email, at);
  openWarnings(email);
  renderAccounts();
}

/* ---- Delete account ---- */

function confirmDeleteAccount(email) {
  const u = getUserByEmail(email);
  if (!u) return;
  const lastSuper = u.role === 'superadmin' && getUsers().filter((x) => x.role === 'superadmin').length <= 1;
  if (lastSuper) {
    openModal(`
      <div class="modal-header"><h2>Can't delete</h2><button class="modal-close" onclick="closeModal()">&times;</button></div>
      <p>This is the only Super Admin account, so it can't be deleted.</p>
      <p style="text-align:right"><button type="button" class="btn" onclick="closeModal()">Close</button></p>
    `);
    return;
  }
  openModal(`
    <div class="modal-header">
      <h2>Delete this account?</h2>
      <button class="modal-close" onclick="closeModal()">&times;</button>
    </div>
    <div class="icon-circle danger">&#9888;</div>
    <p style="text-align:center"><strong>${esc(u.name)}</strong> (${esc(u.email)}) will no longer be able to log in. This can't be undone.</p>
    <p style="text-align:right">
      <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
      <button type="button" class="btn btn-danger" onclick="doDeleteAccount('${esc(u.email)}')">Delete</button>
    </p>
  `);
}

function doDeleteAccount(email) {
  const users = getUsers()
    .filter((u) => !sameEmail(u.email, email))
    .map((u) => ((u.linked || []).some((x) => sameEmail(x, email))
      ? { ...u, linked: u.linked.filter((x) => !sameEmail(x, email)) }
      : u));
  saveUsers(users);
  closeModal();
  renderFilters();
  renderAccounts();
}

renderFilters();
renderAccounts();
