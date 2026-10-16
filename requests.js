/* ============================================================
   requests.js - contact-request section of reports.html (Super Admin only)
   Parents and students send contact-info change requests from
   their profile. The Super Admin approves (applies the change)
   or declines them here.
   ============================================================ */

/* Auth, navbar and dash tabs are set up by reports.js (same page). */

let reqFilter = 'Pending';
const REQ_FILTERS = ['Pending', 'Approved', 'Declined', 'All'];

function rqEsc(s) {
  return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
function setReqFilter(f) { reqFilter = f; renderRequests(); }

function renderRequests() {
  const all = getContactRequests().slice().reverse();
  const list = all.filter((r) => reqFilter === 'All' || r.status === reqFilter.toLowerCase());
  const count = (f) => all.filter((r) => f === 'All' || r.status === f.toLowerCase()).length;
  document.getElementById('req-filters').innerHTML = REQ_FILTERS
    .map((f) => `<button type="button" class="btn ${f === reqFilter ? '' : 'btn-outline'}" onclick="setReqFilter('${f}')">${f} (${count(f)})</button>`).join('');

  const badgeFor = { pending: 'badge-holidays', approved: '', declined: 'badge-danger' };
  document.getElementById('req-list').innerHTML = list.length
    ? list.map((r) => {
        const u = getUserByEmail(r.userEmail);
        const when = new Date(r.at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
        const role = u ? (NAV_ROLE_LABELS[u.role] || u.role) : 'Account removed';
        const row = (label, from, to) => to ? `
          <div class="req-change">
            <span class="req-label">${label}</span>
            <span class="req-from">${rqEsc(from || 'Not set')}</span>
            <span class="req-arrow">&rarr;</span>
            <strong class="req-to">${rqEsc(to)}</strong>
          </div>` : '';
        const changes = row('Email', u && u.email, r.newEmail) + row('Phone', u && u.phone, r.newPhone);
        return `
          <div class="card report-card">
            <div class="report-head">
              <span class="avatar lg">${u ? avatarInner(u) : rqEsc(personInitials(r.userEmail))}</span>
              <div class="account-info">
                <strong>${rqEsc(u ? u.name : r.userEmail)}</strong> <span class="badge badge-other">${rqEsc(role)}</span>
                <div class="muted">Requested ${rqEsc(when)}</div>
              </div>
              <span class="badge ${badgeFor[r.status] || ''}">${r.status[0].toUpperCase() + r.status.slice(1)}</span>
            </div>
            <div class="req-changes">${changes}</div>
            ${r.reason ? `<blockquote class="report-quote">${rqEsc(r.reason)}</blockquote>` : ''}
            ${r.status === 'pending' ? `
              <div class="report-actions">
                <button type="button" class="btn btn-small btn-outline" onclick="resolveReq(${r.id}, false)">Decline</button>
                <button type="button" class="btn btn-small" onclick="resolveReq(${r.id}, true)">Approve</button>
              </div>` : ''}
          </div>`;
      }).join('')
    : repEmpty('&#9993;', reqFilter === 'All' ? 'No requests yet' : `No ${reqFilter.toLowerCase()} requests`,
        reqFilter === 'Pending' ? 'When a parent or student asks to change their email or phone number, it will appear here.' : 'Nothing to show for this filter.');
  if (typeof renderRepStats === 'function') renderRepStats();
}

function resolveReq(id, approve) {
  const err = resolveContactRequest(id, approve);
  if (err) alert(err);
  renderRequests();
}

renderRequests();
