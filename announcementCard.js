/* ============================================================
   announcementCard.js - reusable announcement/post card component.
   Renders one announcement with its category badge, meta line,
   and details. Read-only this week — staff edit/delete controls
   and the comment thread will be added in a later milestone.
   ============================================================ */

function renderAnnouncementCard(a) {
  const metaParts = [];
  if (a.date) metaParts.push(fmtDate(a.date));
  if (a.time) metaParts.push(a.time);
  if (a.location) metaParts.push(a.location);
  const meta = metaParts.length ? `<p class="muted">${metaParts.join(' · ')}</p>` : '';

  return `
    <div class="card">
      <div class="card-top">
        <span class="badge badge-${a.category.toLowerCase()}">${a.category}</span>
      </div>
      <h3>${a.title}</h3>
      ${meta}
      <p>${a.details || ''}</p>
    </div>
  `;
}
