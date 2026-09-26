/* ============================================================
   view-profile.js - page logic for view-profile.html
   Read-only profile view for someone found via the navbar search.
   Shows only directory-appropriate info (name, role, section). Includes a
   "Message" button that opens/creates a 1:1 DM thread and sends
   the viewer straight to it in Chat.
   ============================================================ */

requireAuth();
renderNavbar('');

const ROLE_LABELS_VIEW = { admin: 'Admin', teacher: 'Teacher', parent: 'Parent', student: 'Student' };

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function renderNotFound() {
  document.getElementById('view-profile-wrap').innerHTML = `
    <div class="card" style="text-align:center;">
      <h2>Person not found</h2>
      <p class="muted">This profile doesn't exist or the link is invalid.</p>
      <p><a href="feed.html" class="btn">Back to feed</a></p>
    </div>
  `;
}

function renderProfile(user) {
  const roleLine = [ROLE_LABELS_VIEW[user.role] || user.role, user.section].filter(Boolean).join(' · ');

  document.getElementById('view-profile-wrap').innerHTML = `
    <div class="card">
      <div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
        <span class="avatar lg">${personInitials(user.name)}</span>
        <div style="flex:1; min-width:180px;">
          <h2 style="margin-bottom:0;">${user.name}</h2>
          <p class="muted" style="margin-top:2px;">${roleLine}</p>
        </div>
        <button type="button" class="btn" onclick="messageUser('${encodeURIComponent(user.email)}')">Message</button>
      </div>
      <hr>
      <p><strong>Email</strong><br><span class="muted">${user.email}</span></p>
    </div>
  `;
}

function messageUser(encodedEmail) {
  const email = decodeURIComponent(encodedEmail);
  getOrCreateDirectThread(email);
  window.location.href = `chat.html?dm=${encodeURIComponent(email)}`;
}

(function init() {
  const email = getParam('email');
  const me = getCurrentUser();
  const user = getUserByEmail(email);

  if (!user) {
    renderNotFound();
    return;
  }
  if (me && me.email.toLowerCase() === user.email.toLowerCase()) {
    // Viewing your own profile: send to the editable Profile page instead.
    window.location.href = 'profile.html';
    return;
  }
  renderProfile(user);

  /* If this person edits their own name/section/etc. from another
     tab while we're looking at their profile, refresh it here too. */
  onDataChange(STORAGE_KEYS.users, () => {
    const fresh = getUserByEmail(email);
    if (fresh) renderProfile(fresh);
  });
})();
