/* ============================================================
   profile.js - page logic for profile.html
   Account settings split into sections, Facebook-settings style:
     Profile        - photo + full name
     Contact info   - email + phone number
     Notifications  - notification preferences (parents)
     Security       - change password
   Each section has its own form and its own Save button.
   ============================================================ */

requireAuth();
renderNavbar('profile');

const ROLE_LABELS = {
  superadmin: 'Super Admin',
  teacher: 'Teacher',
  parent: 'Parent',
  student: 'Student'
};

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

/* Sections shown for the current user (notifications are for parents and students) */
function getSections(user) {
  const list = [
    { id: 'profile', label: 'Profile', icon: '&#128100;' },
    { id: 'contact', label: 'Contact info', icon: '&#9993;' }
  ];
  if (user.role === 'parent' || user.role === 'student') list.push({ id: 'notifications', label: 'Notifications', icon: '&#128276;' });
  list.push({ id: 'security', label: 'Security', icon: '&#128274;' });
  return list;
}

let activeSection = (window.location.hash || '').replace('#', '') || 'profile';

function setSection(id) {
  activeSection = id;
  history.replaceState(null, '', '#' + id);
  renderNav(getCurrentUser());
  renderPanel(getCurrentUser());
}

/* ---- Header (avatar, name, role, log out) ---- */

function renderHeader(user) {
  if (!user) return; /* logged out: requireAuth is already redirecting */
  document.getElementById('profile-header').innerHTML = `
    <div class="profile-head">
      <span class="avatar xl">${avatarInner(user)}</span>
      <div class="profile-head-text">
        <h2 style="margin-bottom:0;">${esc(user.name)}</h2>
        <p class="muted" style="margin-top:2px;">${ROLE_LABELS[user.role] || user.role}${user.section ? ' · ' + esc(user.section) : ''}</p>
      </div>
      <button type="button" class="btn" onclick="doLogout()">Log out</button>
    </div>
  `;
}

/* ---- Left menu ---- */

function renderNav(user) {
  if (!user) return; /* logged out: requireAuth is already redirecting */
  const sections = getSections(user);
  if (!sections.some((s) => s.id === activeSection)) activeSection = 'profile';
  document.getElementById('settings-nav').innerHTML = sections
    .map((s) => `
      <button type="button" class="settings-nav-item ${s.id === activeSection ? 'active' : ''}" onclick="setSection('${s.id}')" ${s.id === activeSection ? 'aria-current="page"' : ''}>
        <span class="settings-nav-icon" aria-hidden="true">${s.icon}</span>${s.label}
      </button>
    `)
    .join('');
}

/* ---- Section panels ---- */

function renderPanel(user) {
  if (!user) return; /* logged out: requireAuth is already redirecting */
  const panel = document.getElementById('settings-panel');
  const renderers = {
    profile: panelProfile,
    contact: panelContact,
    notifications: panelNotifications,
    security: panelSecurity
  };
  panel.innerHTML = (renderers[activeSection] || panelProfile)(user);
}

/* Parent <-> student connection, shown on the Profile section.
   Students register first; a parent links to the student's account
   with the child's email and full name (here, or when registering). */
function linkedAccountsBlock(user) {
  if (user.role !== 'parent' && user.role !== 'student') return '';
  const people = getLinkedAccounts(user.email);
  const isParent = user.role === 'parent';
  const title = isParent ? 'Linked student account' : 'Linked parent account';
  const empty = isParent
    ? 'No student linked yet. Link your child\'s account below.'
    : 'No parent linked yet. Your parent or guardian can link to your account from theirs using your email (<strong>' + esc(user.email) + '</strong>) and your full name.';
  const body = people.length
    ? people.map((p) => `
        <a class="linked-person" href="view-profile.html?email=${encodeURIComponent(p.email)}">
          <span class="avatar">${avatarInner(p)}</span>
          <span><strong>${esc(p.name)}</strong><br><span class="muted">${ROLE_LABELS[p.role] || p.role}${p.section ? ' · ' + esc(p.section) : ''}</span></span>
        </a>`).join('')
    : `<p class="muted" style="margin:0;">${empty}</p>`;
  const linkForm = isParent ? `
    <form class="link-form" onsubmit="return linkStudentFromProfile(event)">
      <p class="muted" style="margin:12px 0 6px;">${people.length ? 'Link another student account' : 'Link your child\'s student account'}</p>
      <p><input type="email" id="link-email" placeholder="Child's login email" required></p>
      <p><input type="text" id="link-name" placeholder="Child's full name (as registered)" required></p>
      <p class="settings-msg" id="link-msg" role="status"></p>
      <p style="text-align:right;margin:0;"><button type="submit" class="btn btn-small">Link student</button></p>
    </form>` : '';
  return `<div class="linked-box"><p class="linked-title">${title}${people.length > 1 ? 's' : ''}</p>${body}${linkForm}</div>`;
}

/* Parent links to a student account that already exists. */
function linkStudentFromProfile(e) {
  e.preventDefault();
  const me = getCurrentUser();
  const email = document.getElementById('link-email').value.trim();
  const name = document.getElementById('link-name').value.trim().replace(/\s+/g, ' ');
  const res = linkParentToStudent(me.email, email, name);
  if (!res.ok) {
    const el = document.getElementById('link-msg');
    el.textContent = LINK_MESSAGES[res.reason] || 'Could not link to that student account.';
    el.className = 'settings-msg error';
    return false;
  }
  const fresh = getUserByEmail(me.email);
  if (fresh) setCurrentUser(fresh);
  renderHeader(getCurrentUser());
  renderPanel(getCurrentUser());
  const el = document.getElementById('link-msg');
  if (el) { el.textContent = 'Linked to ' + res.student.name + '.'; el.className = 'settings-msg success'; }
  return false;
}

function panelProfile(user) {
  return `
    <h3>Profile</h3>
    <p class="muted">Your name and picture are shown on your comments and in search.</p>

    <div class="settings-row">
      <span class="avatar xl">${avatarInner(user)}</span>
      <div>
        <div class="profile-photo-actions" style="margin-top:0;">
          <button type="button" class="btn btn-small btn-outline" onclick="document.getElementById('profile-photo-input').click()">${user.photo ? 'Change photo' : 'Upload photo'}</button>
          ${user.photo ? '<button type="button" class="btn btn-small btn-outline" onclick="removeProfilePhoto()">Remove</button>' : ''}
        </div>
        <input type="file" id="profile-photo-input" accept="image/*" style="display:none" onchange="handleProfilePhoto(event)">
        <p class="muted" style="margin:6px 0 0; font-size:0.8rem;">Saved automatically. Square images work best.</p>
      </div>
    </div>

    ${linkedAccountsBlock(user)}
    <form onsubmit="return saveProfileSection(event)">
      <p>Full name:<br><input type="text" id="pf-name" value="${esc(user.name)}" required></p>
      <p class="settings-msg" id="settings-msg" role="status"></p>
      <p style="text-align:right"><button type="submit" class="btn">Save changes</button></p>
    </form>
  `;
}

function panelContact(user) {
  if (user.role === 'parent' || user.role === 'student') return panelContactRequest(user);
  return `
    <h3>Contact info</h3>
    <p class="muted">How the school and other members can reach you.</p>
    <form onsubmit="return saveContactSection(event)">
      <p>Email address:<br><input type="email" id="pf-email" value="${esc(user.email)}" required></p>
      <p>Phone number:<br><input type="text" id="pf-phone" value="${esc(user.phone)}" placeholder="0912 345 6789"></p>
      <p class="settings-msg" id="settings-msg" role="status"></p>
      <p style="text-align:right"><button type="submit" class="btn">Save changes</button></p>
    </form>
  `;
}

/* Parents and students can't edit contact info directly: they send a
   request, and the Super Admin approves or declines it. */
function panelContactRequest(user) {
  const mine = getContactRequests().filter((r) => r.userEmail === user.email.toLowerCase()).slice().reverse();
  const pending = mine.find((r) => r.status === 'pending');
  const history = mine.length
    ? mine.map((r) => `
        <div class="card" style="margin:8px 0;">
          <span class="badge badge-${r.status === 'approved' ? 'events' : r.status === 'declined' ? 'holidays' : 'reminders'}">${r.status[0].toUpperCase() + r.status.slice(1)}</span>
          <div class="muted" style="margin-top:6px;">
            ${r.newEmail ? 'New email: ' + esc(r.newEmail) + '<br>' : ''}${r.newPhone ? 'New phone: ' + esc(r.newPhone) + '<br>' : ''}${r.reason ? 'Reason: ' + esc(r.reason) : ''}
          </div>
        </div>`).join('')
    : '<p class="muted">No requests yet.</p>';
  return `
    <h3>Contact info</h3>
    <p class="muted">To keep school records accurate, your email and phone number can only be changed by the Super Admin. Send a request below.</p>
    <p>Email address:<br><input type="email" value="${esc(user.email)}" disabled></p>
    <p>Phone number:<br><input type="text" value="${esc(user.phone) || 'Not set'}" disabled></p>

    <h3 style="margin-top:24px;">Request a change</h3>
    ${pending
      ? '<p class="muted">You already have a request waiting for the Super Admin. You can send another once it has been reviewed.</p>'
      : `<form onsubmit="return submitContactRequest(event)">
      <p>New email address (leave blank to keep):<br><input type="email" id="rq-email" placeholder="${esc(user.email)}"></p>
      <p>New phone number (leave blank to keep):<br><input type="text" id="rq-phone" placeholder="0912 345 6789"></p>
      <p>Reason (optional):<br><input type="text" id="rq-reason" placeholder="e.g. I changed my number"></p>
      <p class="settings-msg" id="settings-msg" role="status"></p>
      <p style="text-align:right"><button type="submit" class="btn">Send request</button></p>
    </form>`}

    <h3 style="margin-top:24px;">Your requests</h3>
    ${history}
  `;
}

function submitContactRequest(e) {
  e.preventDefault();
  const me = getCurrentUser();
  const email = document.getElementById('rq-email').value.trim();
  const phone = document.getElementById('rq-phone').value.trim();
  const reason = document.getElementById('rq-reason').value.trim();
  const emailChanged = email && email.toLowerCase() !== me.email.toLowerCase();
  const phoneChanged = phone && phone !== (me.phone || '');
  if (!emailChanged && !phoneChanged) { showMsg('Enter a new email or phone number that is different from your current one.', true); return false; }
  if (emailChanged && getUsers().some((u) => u.email.toLowerCase() === email.toLowerCase())) { showMsg('Another account already uses that email.', true); return false; }
  addContactRequest(me.email, { email: emailChanged ? email : '', phone: phoneChanged ? phone : '', reason });
  renderPanel(me);
  showMsg('Request sent. The Super Admin will review it.');
  return false;
}

function panelNotifications(user) {
  const opt = (v) => `<option value="${v}" ${(user.notifPref || 'All announcements') === v ? 'selected' : ''}>${v}</option>`;
  return `
    <h3>Notifications</h3>
    <p class="muted">Choose which school updates you want to be notified about.</p>
    <form onsubmit="return saveNotificationsSection(event)">
      <p>Notification preferences:<br>
        <select id="pf-notif">
          ${opt('All announcements')}${opt('Events only')}${opt('None')}
        </select>
      </p>
      <p class="settings-msg" id="settings-msg" role="status"></p>
      <p style="text-align:right"><button type="submit" class="btn">Save changes</button></p>
    </form>
  `;
}

function panelSecurity() {
  return `
    <h3>Security</h3>
    <p class="muted">Change your password. You'll need your current password to do this.</p>
    <form onsubmit="return saveSecuritySection(event)" autocomplete="off">
      <p>Current password:<br><input type="password" id="pf-current" required></p>
      <p>New password:<br><input type="password" id="pf-new" required></p>
      <p>Confirm new password:<br><input type="password" id="pf-confirm" required></p>
      <p class="settings-msg" id="settings-msg" role="status"></p>
      <p style="text-align:right"><button type="submit" class="btn">Change password</button></p>
    </form>
  `;
}

/* ---- Feedback message under each form ---- */

function showMsg(text, isError) {
  const el = document.getElementById('settings-msg');
  if (!el) return;
  el.textContent = text;
  el.className = 'settings-msg ' + (isError ? 'error' : 'success');
}

/* ---- Save handlers (one per section) ---- */

function saveProfileSection(e) {
  e.preventDefault();
  const name = document.getElementById('pf-name').value.trim().replace(/\s+/g, ' ');
  if (!name) { showMsg('Please enter your name.', true); return false; }
  const updated = updateCurrentUser({ name });
  renderHeader(updated);
  showMsg('Name saved.');
  return false;
}

function saveContactSection(e) {
  e.preventDefault();
  if (getCurrentUser().role === 'parent' || getCurrentUser().role === 'student') return false;
  const email = document.getElementById('pf-email').value.trim();
  const phone = document.getElementById('pf-phone').value.trim();
  const me = getCurrentUser();
  const taken = getUsers().some((u) => u.email.toLowerCase() === email.toLowerCase() && u.email.toLowerCase() !== me.email.toLowerCase());
  if (taken) { showMsg('Another account already uses that email.', true); return false; }
  const updated = updateCurrentUser({ email, phone });
  renderHeader(updated);
  showMsg('Contact info saved.');
  return false;
}

function saveNotificationsSection(e) {
  e.preventDefault();
  updateCurrentUser({ notifPref: document.getElementById('pf-notif').value });
  showMsg('Notification preferences saved.');
  return false;
}

function saveSecuritySection(e) {
  e.preventDefault();
  const me = getCurrentUser();
  const current = document.getElementById('pf-current').value;
  const next = document.getElementById('pf-new').value;
  const confirm = document.getElementById('pf-confirm').value;
  if (current !== me.password) { showMsg('Your current password is incorrect.', true); return false; }
  if (next === current) { showMsg('Your new password must be different from the current one.', true); return false; }
  if (next !== confirm) { showMsg('The new passwords do not match.', true); return false; }
  updateCurrentUser({ password: next });
  renderPanel(getCurrentUser());
  showMsg('Password changed.');
  return false;
}

/* ---- Profile photo (saved immediately) ---- */

function handleProfilePhoto(e) {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  resizeAvatarFile(
    file,
    (dataUrl) => {
      try {
        const updated = updateCurrentUser({ photo: dataUrl });
        renderHeader(updated);
        renderPanel(updated);
      } catch (err) {
        alert("Couldn't save the photo (browser storage is full). Try a smaller image.");
      }
    },
    (msg) => alert(msg)
  );
}

function removeProfilePhoto() {
  const updated = updateCurrentUser({ photo: '' });
  renderHeader(updated);
  renderPanel(updated);
}

function doLogout() {
  logoutUser();
  window.location.href = 'index.html';
}

function renderAll() {
  const user = getCurrentUser();
  renderHeader(user);
  renderNav(user);
  renderPanel(user);
}

renderAll();
