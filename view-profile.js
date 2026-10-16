/* ============================================================
   view-profile.js - page logic for view-profile.html
   Read-only profile view for someone found via the navbar search.
   Shows only directory-appropriate info (name, role, section) —
   never their password, phone, or notification preferences, which
   stay private to the account owner on profile.html. There is no
   direct messaging, and the Super Admin's profile isn't viewable by
   other roles.
   ============================================================ */

requireAuth();
renderNavbar('');

const ROLE_LABELS_VIEW = { superadmin: 'Super Admin', teacher: 'Teacher', parent: 'Parent', student: 'Student' };

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function renderNotFound() {
  document.getElementById('view-profile-wrap').innerHTML = `
    <div class="card" style="text-align:center;">
      <h2>Person not found</h2>
      <p class="muted">This profile doesn't exist or the link is invalid.</p>
      <p><a href="${isSuperAdmin() ? 'dashboard.html' : 'feed.html'}" class="btn">${isSuperAdmin() ? 'Back to dashboard' : 'Back to feed'}</a></p>
    </div>
  `;
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderProfile(user) {
  const roleLine = [ROLE_LABELS_VIEW[user.role] || user.role, user.section].filter(Boolean).join(' · ');

  document.getElementById('view-profile-wrap').innerHTML = `
    <div class="card">
      <div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
        <span class="avatar lg">${avatarInner(user)}</span>
        <div style="flex:1; min-width:180px;">
          <h2 style="margin-bottom:0;">${esc(user.name)}</h2>
          <p class="muted" style="margin-top:2px;">${esc(roleLine)}</p>
        </div>
        ${user.role === 'superadmin' ? '' : `<a class="btn" href="chat.html?dm=${encodeURIComponent(user.email)}">Message</a>`}
      </div>
      <hr>
      <p><strong>Email</strong><br><span class="muted">${esc(user.email)}</span></p>
    </div>
  `;
}

(function init() {
  const email = getParam('email');
  const me = getCurrentUser();
  const user = getUserByEmail(email);

  if (!user || (user.role === 'superadmin' && !isSuperAdmin())) {
    renderNotFound();
    return;
  }
  if (me && me.email.toLowerCase() === user.email.toLowerCase()) {
    // Viewing your own profile: send to the editable Profile page instead.
    window.location.href = 'profile.html';
    return;
  }
  renderProfile(user);
})();
