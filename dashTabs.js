/* ============================================================
   dashTabs.js - tab bar shared by the Super Admin dashboard
   pages (dashboard.html: Posts + Calendar, accounts.html).
   Usage: renderDashTabs('posts' | 'calendar' | 'reports' | 'accounts')
   ============================================================ */

function renderDashTabs(active) {
  const el = document.getElementById('dash-tabs');
  if (!el) return;
  window.__dashActive = active;
  const waiting = typeof getAdminAttentionCount === 'function' ? getAdminAttentionCount() : 0;
  const badge = waiting ? `<span class="tab-badge" title="${waiting} waiting for review">${waiting}</span>` : '';
  const tabs = [
    { id: 'posts', label: 'Manage posts', href: 'dashboard.html#posts' },
    { id: 'calendar', label: 'Manage calendar', href: 'dashboard.html#calendar' },
    { id: 'reports', label: 'Reports & requests', href: 'reports.html' },
    { id: 'accounts', label: 'Accounts', href: 'accounts.html' }
  ];
  const current = tabs.find((t) => t.id === active) || tabs[0];
  el.classList.add('dash-menu');
  el.innerHTML = `
    <button type="button" class="dash-burger" id="dash-burger" aria-label="Open menu" aria-haspopup="true" aria-expanded="false">
      <span class="burger-icon" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="dash-burger-label">${current.label}</span>${badge}
    </button>
    <div class="dash-menu-list" id="dash-menu-list" role="menu" hidden>
      ${tabs.map((t) => `<a class="dash-tab ${t.id === active ? 'active' : ''}" role="menuitem" href="${t.href}" data-tab="${t.id}">${t.label}${t.id === 'reports' ? badge : ''}</a>`).join('')}
    </div>`;
  const btn = document.getElementById('dash-burger');
  const list = document.getElementById('dash-menu-list');
  const setOpen = (open) => {
    list.hidden = !open;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.classList.toggle('open', open);
  };
  btn.addEventListener('click', (e) => { e.stopPropagation(); setOpen(list.hidden); });
  list.addEventListener('click', () => setOpen(false));
  if (!window.__dashMenuWired) {
    window.__dashMenuWired = true;
    document.addEventListener('click', (e) => {
      const l = document.getElementById('dash-menu-list');
      const b = document.getElementById('dash-burger');
      if (l && !l.hidden && !l.contains(e.target) && !b.contains(e.target)) { l.hidden = true; b.setAttribute('aria-expanded', 'false'); b.classList.remove('open'); }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const l = document.getElementById('dash-menu-list'); const b = document.getElementById('dash-burger');
      if (l && !l.hidden) { l.hidden = true; b.setAttribute('aria-expanded', 'false'); b.classList.remove('open'); b.focus(); }
    });
  }
}

/* Re-draws the menu so the "waiting for review" badge is up to date
   after the Super Admin resolves something. */
function refreshDashTabs() {
  if (window.__dashActive) renderDashTabs(window.__dashActive);
}
