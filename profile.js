/* ============================================================
   profile.js - page logic for profile.html
   Shows the logged-in user's account settings. Admins/teachers
   see staff fields; parents also see a notification preference.
   ============================================================ */

requireAuth();
renderNavbar('profile');

const ROLE_LABELS = {
  admin: 'Admin',
  teacher: 'Teacher',
  parent: 'Parent',
  student: 'Student'
};

function initials(name) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function renderHeader(user) {
  document.getElementById('profile-header').innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
      <div>
        <h2 style="margin-bottom:0;">${user.name}</h2>
        <p class="muted" style="margin-top:2px;">${ROLE_LABELS[user.role] || user.role}${user.section ? ' · ' + user.section : ''}</p>
      </div>
      <button type="button" class="btn" onclick="doLogout()">Log out</button>
    </div>
  `;
}

function renderForm(user) {
  const isParent = user.role === 'parent';
  document.getElementById('profile-form-wrap').innerHTML = `
    <h3>Account settings</h3>
    <form id="profile-form" onsubmit="return saveProfile(event)">
      <p>Full name:<br><input type="text" id="pf-name" value="${user.name || ''}" required></p>
      <p>Email address:<br><input type="email" id="pf-email" value="${user.email || ''}" required></p>
      <p>Phone number:<br><input type="text" id="pf-phone" value="${user.phone || ''}" placeholder="0912 345 6789"></p>
      ${isParent ? `
        <p>Notification preferences:<br>
          <select id="pf-notif">
            <option value="All announcements" ${user.notifPref === 'All announcements' || !user.notifPref ? 'selected' : ''}>All announcements</option>
            <option value="Events only" ${user.notifPref === 'Events only' ? 'selected' : ''}>Events only</option>
            <option value="None" ${user.notifPref === 'None' ? 'selected' : ''}>None</option>
          </select>
        </p>
      ` : ''}
      <p>Change password:<br><input type="password" id="pf-password" placeholder="Leave blank to keep current password"></p>
      <p style="text-align:right"><button type="submit" class="btn">Save changes</button></p>
    </form>
  `;
}

function saveProfile(e) {
  e.preventDefault();
  const data = {
    name: document.getElementById('pf-name').value.trim(),
    email: document.getElementById('pf-email').value.trim(),
    phone: document.getElementById('pf-phone').value.trim()
  };
  const notifEl = document.getElementById('pf-notif');
  if (notifEl) data.notifPref = notifEl.value;
  const pw = document.getElementById('pf-password').value;
  if (pw) data.password = pw;

  const updated = updateCurrentUser(data);
  renderNavbar('profile');
  renderHeader(updated);
  renderForm(updated);
  alert('Changes saved.');
  return false;
}

function doLogout() {
  logoutUser();
  window.location.href = 'index.html';
}

function renderAll() {
  const user = getCurrentUser();
  renderHeader(user);
  renderForm(user);
}

renderAll();

/* If the same account's details are changed from another tab, pick
   up the fresh copy here too rather than showing stale fields. */
onDataChange(STORAGE_KEYS.currentUser, renderAll);
