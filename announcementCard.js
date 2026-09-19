function renderAnnouncementCard(a) {
  const metaParts = [];
  if (a.date) metaParts.push(fmtDate(a.date));
  if (a.time) metaParts.push(a.time);
  if (a.location) metaParts.push(a.location);
  const meta = metaParts.length ? `<p class="muted">${metaParts.join(' · ')}</p>` : '';

  const controls = isStaff()
    ? `
      <div>
        <button type="button" class="btn btn-small btn-outline" onclick="openEditAnnouncement(${a.id})">Edit</button>
        <button type="button" class="btn btn-small btn-danger" onclick="confirmDeleteAnnouncement(${a.id})">Delete</button>
      </div>
    `
    : '';

  const comments = (a.comments || [])
    .map(
      (c) => `
        <div class="comment-item">
          <span class="avatar">${initialsFor(c.author)}</span>
          <div class="comment-bubble"><strong>${c.author}</strong><span>${c.text}</span></div>
        </div>
      `
    )
    .join('');

  return `
    <div class="card" id="card-${a.id}">
      <div class="card-top">
        <span class="badge badge-${a.category.toLowerCase()}">${a.category}</span>
        ${controls}
      </div>
      <h3>${a.title}</h3>
      ${meta}
      ${a.photo ? `<img class="post-photo" src="${a.photo}" alt="${a.title}">` : ''}
      <p>${a.details || ''}</p>
      <hr>
      <p><strong>Comments</strong> <span class="muted">(${(a.comments || []).length})</span></p>
      <div class="comment-list">${comments}</div>
      <form class="comment-form" onsubmit="return submitComment(event, ${a.id})">
        <input type="text" placeholder="Write a comment..." required>
        <button type="submit" class="btn btn-small">Send</button>
      </form>
    </div>
  `;
}

function initialsFor(name) {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}
